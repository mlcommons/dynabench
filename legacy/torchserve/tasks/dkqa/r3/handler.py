# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging
import os

import torch
from torch.utils.data import DataLoader, SequentialSampler
from transformers import (
    AutoConfig,
    AutoModelForQuestionAnswering,
    AutoTokenizer,
    BertTokenizer,
)
from transformers.data.metrics.squad_metrics import compute_exact, compute_f1
from transformers.data.processors.squad import (
    SquadResult,
    squad_convert_examples_to_features,
)
from ts.torch_handler.base_handler import BaseHandler

# from captum.attr import LayerIntegratedGradients
from qa_utils import compute_predictions_logits, convert_to_squad_example
from settings import my_secret
from shared import check_fields, generate_response_signature, handler_initialize


# import pdb


logger = logging.getLogger(__name__)


THRESHOLD_F1 = 0.4
QA_CONFIG = {
    "max_seq_length": 256,
    "max_query_length": 64,
    "max_answer_length": 30,
    "do_lower_case": True,
    "doc_stride": 128,
    "eval_batch_size": 8,
    "n_best_size": 1,
    "n_best_per_passage_size": 1,
}


class TransformersSeqClassifierHandler(BaseHandler):
    def __init__(self):
        super().__init__()
        self.initialized = False

    def initialize(self, ctx):
        # Initializes the model and tokenizer during server start up
        model_dir, model_pt_path, self.device, self.setup_config = handler_initialize(
            ctx
        )

        self.my_task_id = self.setup_config["my_task_id"]
        self.my_round_id = self.setup_config["my_round_id"]

        # Loading the model and tokenizer from checkpoint and config files based on
        # the user's choice of mode further setup config can be added.
        if self.setup_config["save_mode"] == "torchscript":
            logger.warning("Loading torchscript model")
            self.model = torch.jit.load(model_pt_path)
        elif self.setup_config["save_mode"] == "pretrained":
            if os.path.isfile(os.path.join(model_dir, "config.json")):
                logger.warning("Loading pretrained model")
                config = AutoConfig.from_pretrained(model_dir)
                self.model = AutoModelForQuestionAnswering.from_pretrained(
                    model_dir, config=config
                )
            else:
                raise FileNotFoundError("Missing config file")

        # pdb.set_trace()
        if os.path.isfile(os.path.join(model_dir, "vocab.txt")):
            self.tokenizer = AutoTokenizer.from_pretrained(model_dir)
            logger.info("Using provided vocab")
        else:
            self.tokenizer = BertTokenizer.from_pretrained("bert-large-uncased")
            logger.info("Using default vocab")

        self.model.to(self.device)
        self.model.eval()
        logger.debug(f"Transformer model from path {model_dir} loaded successfully")

        # ---------------- Captum initialization ----------------#
        # self.lig = LayerIntegratedGradients(
        #    captum_qa_forward, self.model.bert.embeddings
        # )
        self.initialized = True

    def preprocess(self, data):
        # Basic text preprocessing
        logger.info("In preprocess, data's value: '%s'", data)
        body = data[0]["body"]
        if not body:
            raise AttributeError("No body found in the request")
        # Checks if the request contains the necessary attributes
        attribute_list = ["answer", "context", "hypothesis", "insight"]
        check_fields(body, attribute_list)

        passage = body["context"]
        question = body["hypothesis"]
        answer = body["answer"]
        insight = body["insight"]
        logger.info("In preprocess, body's value: '%s'", body)
        logger.info("In preprocess, passage's value: '%s'", passage)
        logger.info("In preprocess, questions's value: '%s'", question)
        logger.info("In preprocess, answer's value: '%s'", answer)

        example = {"passage": passage.strip(), "question": question.strip()}

        return [example], answer, insight

    def inference(self, examples):
        # Predict the class (or classes) of the received text using the serialized
        # transformers checkpoint.

        def to_list(tensor):
            return tensor.detach().cpu().tolist()

        # Handling inference for question answering
        self.model.eval()
        with torch.no_grad():
            # Convert all to SQuAD Examples
            examples = [
                convert_to_squad_example(passage=ex["passage"], question=ex["question"])
                for ex in examples
            ]

            print("The examples after convert_to_squad", examples)
            # Featurise the examples
            features, dataset = squad_convert_examples_to_features(
                examples=examples,
                tokenizer=self.tokenizer,
                max_seq_length=QA_CONFIG["max_seq_length"],
                doc_stride=QA_CONFIG["doc_stride"],
                max_query_length=QA_CONFIG["max_query_length"],
                is_training=False,
                return_dataset="pt",
            )

            eval_sampler = SequentialSampler(dataset)
            eval_dataloader = DataLoader(
                dataset, sampler=eval_sampler, batch_size=QA_CONFIG["eval_batch_size"]
            )

            all_results = []
            predictions = {}

            for batch in eval_dataloader:
                inputs = {"input_ids": batch[0], "attention_mask": batch[1]}
                example_indices = batch[3]
                outputs = self.model(**inputs)

                for i, example_index in enumerate(example_indices):
                    eval_feature = features[example_index.item()]
                    unique_id = int(eval_feature.unique_id)

                    output = [to_list(output[i]) for output in outputs]

                    start_logits, end_logits = output
                    result = SquadResult(unique_id, start_logits, end_logits)

                    all_results.append(result)

                batch_predictions = compute_predictions_logits(
                    examples,
                    features,
                    all_results,
                    QA_CONFIG["n_best_per_passage_size"],
                    QA_CONFIG["max_answer_length"],
                    QA_CONFIG["do_lower_case"],
                    None,
                    None,
                    None,
                    False,
                    False,
                    0.0,
                    self.tokenizer,
                )
                predictions.update(batch_predictions)

            predictions_by_examples = [predictions[ex.qas_id] for ex in examples]
            predictions_by_example = predictions_by_examples[0]
            logger.info(
                "predictions_by_example at the end of inference %s",
                predictions_by_example,
            )
            return predictions_by_example

    def postprocess(self, predictions_by_example, example, answer):
        # Post-processing of the model predictions to handle signature
        contx = example[0]["passage"]
        data = example[0]["question"]
        response = {}

        logger.info("response without sign '%s'", response)
        response["text"] = predictions_by_example["text"]
        response["prob"] = max(1.0, min(0.0, predictions_by_example["model_conf"]))
        # this is what the frontend expects

        # Evaluate the model prediction against the human answer
        human_ans = str(answer).strip()
        response["eval_f1"] = compute_f1(human_ans, response["text"])
        response["eval_exact"] = compute_exact(human_ans, response["text"])
        response["model_is_correct"] = response["eval_f1"] > THRESHOLD_F1

        # The inputs are concatenated to generate signature
        stringlist = [
            str(response["model_is_correct"]) + "|" + str(response["text"]),
            contx,
            data,
        ]
        # pred_str = '|'.join(str(x) for x in response["prediction"])
        # stringlist = [pred_str,data,contx]

        response["signed"] = generate_response_signature(
            self.my_task_id, self.my_round_id, my_secret, stringlist
        )
        logger.info("response before return '%s'", response)

        return [response]


_service = TransformersSeqClassifierHandler()


def handle(data, context):
    # This function handles the requests for the model and returns a
    # postprocessed response
    # sample input {
    #    "answer": "pretend you are reviewing a place",
    #    "context": "Please pretend you are reviewing a place, product, book or movie",
    #    "hypothesis": "What should i pretend?",
    #    "insight": true
    #    } and output response is probabilities
    try:
        if not _service.initialized:
            _service.initialize(context)

        if data is None:
            return None

        example, answer, insight = _service.preprocess(data)
        if not insight:
            predictions_by_example = _service.inference(example)
            response = _service.postprocess(predictions_by_example, example, answer)
            return response

    except Exception as e:
        raise e
