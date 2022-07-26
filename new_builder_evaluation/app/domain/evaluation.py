# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import functools
import importlib
import json
import logging
import os
import secrets
import shutil
import sys
import time
import typing as tp
from pathlib import Path

import boto3
import jsonlines
import requests
import yaml

import app.infrastructure.repositories.dataset
import app.infrastructure.repositories.task
from app import utils
from app.domain.builder import Builder
from app.domain.eval_utils.evaluator import Evaluator
from app.domain.eval_utils.input_formatter import InputFormatter
from app.infrastructure import repositories
from app.infrastructure.repositories.round import RoundRepository
from app.infrastructure.repositories.score import ScoreRepository


log = logging.getLogger(__name__)


class Evaluation:
    def __init__(self):
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.sqs = self.session.client("sqs")
        self.s3_bucket = os.getenv("AWS_S3_BUCKET")
        assert self.s3_bucket
        self.decentralized = bool(os.getenv("DYNABENCH_API"))
        self.builder = Builder()

        if not self.decentralized:
            self.task_repository = repositories.task.TaskRepository()
            self.score_repository = ScoreRepository()
            self.dataset_repository = repositories.dataset.DatasetRepository()
        else:
            self.task_repository = repositories.task.DecenTaskRepository()
            self.dataset_repository = repositories.dataset.DecenDatasetRepository()

    @functools.lru_cache()
    def get_task_configuration(self, task_id: int) -> dict:
        task_configuration = yaml.safe_load(
            self.task_repository.get_by_id(task_id)["config_yaml"]
        )
        return task_configuration

    def require_fields_task(self):
        spec = importlib.util.spec_from_file_location("ModelSingleInput", "./test.py")
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        return module.ModelSingleInput.schema().get("required")

    @functools.lru_cache()
    def get_task_inputs(self, task_code: str) -> tp.List[str]:
        task_config = self.get_task_configuration(task_code)
        inputs = [obj["name"] for obj in task_config["input"]]
        contexts = [obj["name"] for obj in task_config.get("context", [])]
        outputs = set(obj["name"] for obj in task_config.get("output", []))

        # Make sure the models don't receive the outputs.
        # Maybe this could be validated before the task creation
        return [x for x in inputs + contexts if x not in outputs]

    def single_evaluation_ecs(self, ip: str, data: dict):
        headers = {
            "accept": "application/json",
        }
        response = requests.post(
            "http://{}/model/single_evaluation".format(ip),
            headers=headers,
            json=data,
        )
        # TODO: error handling
        return response.json()

    def dl_dataset(self, task_code: str, dataset: str, delta_metric: str = None) -> str:
        if not delta_metric:
            dataset_name = f"datasets/{task_code}/{dataset}.jsonl"
        else:
            dataset_name = f"datasets/{task_code}/{delta_metric}-{dataset}.jsonl"
        local_path = f"./app/{dataset_name}.jsonl"

        if self.decentralized and not self.local_path.exists():
            file = utils.api_download_dataset(dataset, delta_metric, local_path)
            Path(file).rename(local_path)
        else:
            self.s3.download_file(self.s3_bucket, dataset_name, local_path)
        return Path(dataset_name).name

    def downloads_scoring_datasets(
        self,
        bucket_name: str,
        task_code: str,
        delta_metrics: list,
        model: str,
    ):
        jsonl_scoring_datasets = self.dataset_repository.get_scoring_datasets(task_code)
        final_datasets = []
        folder_name = model.split("/")[-1].split(".")[0]
        dataset_dir = f"{folder_name}/datasets"
        (Path("./app") / dataset_dir).mkdir(exist_ok=True, parents=True)
        for scoring_dataset in jsonl_scoring_datasets:
            final_dataset = {}
            base_dataset_file = f"{dataset_dir}/{scoring_dataset['dataset']}.jsonl"
            self.s3.download_file(
                bucket_name, base_dataset_file, f"./app/{base_dataset_file}"
            )
            final_dataset["dataset_type"] = "base"
            final_dataset["round_id"] = scoring_dataset["round_id"]
            final_dataset["dataset_id"] = scoring_dataset["dataset_id"]
            final_dataset["dataset"] = Path(base_dataset_file).name
            final_datasets.append(final_dataset)
            for delta_metric in delta_metrics:
                final_dataset = {}
                delta_dataset_file = (
                    f"{dataset_dir}/{delta_metric}-{scoring_dataset['dataset']}.jsonl"
                )
                self.s3.download_file(
                    bucket_name, delta_dataset_file, f"./app/{delta_dataset_file}"
                )
                final_dataset["dataset_type"] = delta_metric
                final_dataset["round_id"] = scoring_dataset["round_id"]
                final_dataset["dataset_id"] = scoring_dataset["dataset_id"]
                final_dataset["dataset"] = Path(delta_dataset_file).name
                final_datasets.append(final_dataset)
        return final_datasets

    def validate_input_schema(self, schema: list, dataset: list):
        for param in schema:
            if not (all([param in d for d in dataset])):
                raise Exception(f"Missing param: {param}")

    def build_single_request(self, schema: list, sample_dataset: dict):
        return {param: sample_dataset.get(param) for param in schema}

    def heavy_prediction(self, datasets: list, task_code: str, model: str):
        folder_name = model.split("/")[-1].split(".")[0]
        ip, model_name = self.builder.get_ip_ecs_task(model)
        final_dict_prediction = {}
        for dataset in datasets:
            dataset_file = "./app/{}/datasets/{}".format(
                folder_name, dataset["dataset"]
            )
            with jsonlines.open(dataset_file, "r") as jsonl_f:
                samples = list(jsonl_f)

            schema = self.get_task_inputs(task_code)
            # self.validate_input_schema(schema, samples)

            # TODO: this seems very unefficient.
            # There is always exactly one flying request.
            # So this server is doing nothing while the task server is working,
            # and the task server is doing nothing while we are handling responses.
            # We should enqueue several queries or at least parallelize over datasets
            responses = []
            for sample in samples:
                args = {k: sample[k] for k in schema}
                # TODO: where do those weird names come from ?
                args = {
                    "sourceText": args["sourceText"],
                    "origin_lan": args["sourceLanguage"],
                    "target_lan": args["targetLanguage"],
                }
                answer = self.single_evaluation_ecs(ip, args)
                answer["signature"] = secrets.token_hex(15)
                answer["id"] = sample["uid"]
                responses.append(answer)

            predictions = "./app/{}/datasets/{}.out".format(
                folder_name, dataset["dataset"]
            )
            with jsonlines.open(predictions, "w") as writer:
                writer.write_all(responses)
            name_prediction = predictions.split("/")[-1]
            self.s3.upload_file(
                predictions,
                self.s3_bucket,
                f"predictions/{task_code}/{model_name}/{name_prediction}",
            )
            dict_dataset_type = {"dataset": dataset_file, "predictions": predictions}
            dataset_type = dataset["dataset_type"]
            final_dict_prediction[dataset_type] = dict_dataset_type
            dataset_id = dataset["dataset_id"]
        return final_dict_prediction, dataset_id

    def evaluation(self, task_code: str, model_s3_zip: str, model_id: int) -> list:
        task = self.task_repository.get_by_id_or_code(task_code)
        task_configuration = self.get_task_configuration(task_code)
        delta_metrics = [
            delta_metric["type"]
            for delta_metric in task_configuration.get("delta_metrics", [])
        ]
        datasets = self.downloads_scoring_datasets(
            self.s3_bucket,
            task.task_code,
            delta_metrics,
            model_s3_zip,
        )
        rounds = list(
            map(
                int, {round for rounds in datasets for round in str(rounds["round_id"])}
            )
        )
        new_scores = []
        for round in rounds:
            round_datasets = [
                dataset for dataset in datasets if dataset["round_id"] == round
            ]
            prediction_dict, dataset_id = self.heavy_prediction(
                round_datasets, task.task_code, model_s3_zip
            )
            data_dict = {}
            for data_version, data_types in prediction_dict.items():
                for data_type in data_types:
                    data_dict[f"{data_version}_{data_type}"] = self._load_dataset(
                        prediction_dict[data_version][data_type]
                    )
            perturb_exists = (
                "fairness_predictions" in data_dict
                or "robustness_predictions" in data_dict
            )

            input_formatter = InputFormatter(task_configuration)

            formatted_dict = {}
            for data_type in data_dict:
                formatted_key = f"formatted_{data_type}"
                grouped_key = f"grouped_{data_type}"
                if "dataset" in data_type:
                    formatted_dict[formatted_key] = input_formatter.format_labels(
                        data_dict[data_type]
                    )
                    formatted_dict[grouped_key] = input_formatter.group_labels(
                        formatted_dict[formatted_key]
                    )
                elif "predictions" in data_type:
                    formatted_dict[formatted_key] = input_formatter.format_predictions(
                        data_dict[data_type]
                    )
                    formatted_dict[grouped_key] = input_formatter.group_predictions(
                        formatted_dict[formatted_key]
                    )

            evaluator = Evaluator(task_configuration)
            main_metric = evaluator.evaluate(
                formatted_dict["formatted_base_predictions"],
                formatted_dict["formatted_base_dataset"],
            )
            # TODO: remove hardcoding and use delta_metrics list
            delta_metrics = {}
            if perturb_exists:
                delta_metrics = evaluator.evaluate_delta_metrics(
                    formatted_dict.get("grouped_base_predictions"),
                    formatted_dict.get("grouped_robustness_predictions"),
                    formatted_dict.get("grouped_fairness_predictions"),
                )

            metric = task_configuration["perf_metric"]["type"]
            final_scores = {
                str(metric): main_metric,
                "fairness": delta_metrics.get("fairness"),
                "robustness": delta_metrics.get("robustness"),
                "memory": 0,
                "throughput": 0,
            }
            round_info = self.round_repository.get_round_info_by_round_and_task(
                task.id, round
            )
            new_score = {
                "perf": main_metric["perf"],
                "pretty_perf": main_metric["pretty_perf"],
                "fairness": final_scores["fairness"],
                "robustness": final_scores["robustness"],
                "mid": model_id,
                "r_realid": round_info.id,
                "did": dataset_id,
                "memory_utilization": final_scores["memory"],
                "examples_per_second": final_scores["throughput"],
            }

            self.score_repository.add(new_score)
            new_scores.append(new_score)

            shutil.rmtree("./app/{}".format(model_s3_zip.split(".")[0]))
        return new_scores

    def get_sqs_messages(self):
        queue_url = self.sqs.get_queue_url(
            QueueName=os.getenv("SQS_NEW_BUILDER"),
        )["QueueUrl"]
        response = self.sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=10,
        )
        return response.get("Messages", []), queue_url

    def delete_sqs_message(self, queue_url, receipt_handle):
        self.sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=receipt_handle,
        )

    def trigger_sqs(self):
        while True:
            messages, queue_url = self.get_sqs_messages()
            for message in messages:
                message_body = json.loads(message["Body"])
                new_score = self.evaluation(
                    message_body["task_code"],
                    message_body["s3_uri"],
                    message_body["model_id"],
                )
                self.delete_sqs_message(queue_url, message["ReceiptHandle"])
                return new_score
            time.sleep(15)

    @staticmethod
    def _load_dataset(path: str):
        data = []
        with open(path) as f:
            for line in f.readlines():
                data.append(json.loads(line))
        return data

    def _upload_results(evaluated_model_metrics: dict):
        return None
