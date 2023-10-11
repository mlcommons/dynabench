# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import secrets
import time

import boto3
import requests
import yaml
from fastapi import HTTPException, UploadFile
from langchain.chains import ConversationChain
from langchain.memory import ConversationBufferMemory
from pydantic import Json

from app.domain.helpers.email import EmailHelper
from app.domain.helpers.task.model_evaluation_metrics.model_evaluation_metric import (
    ModelEvaluationStrategy,
)
from app.domain.helpers.transform_data_objects import (
    load_json_lines,
    transform_list_to_csv,
)
from app.domain.services.base.example import ExampleService
from app.domain.services.base.rounduserexampleinfo import RoundUserExampleInfoService
from app.domain.services.base.score import ScoreService
from app.domain.services.base.task import TaskService
from app.domain.services.builder_and_evaluation.evaluation import EvaluationService
from app.domain.services.utils.llm import OpenAIProvider
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.user import UserRepository


class ModelService:
    def __init__(self):
        self.model_repository = ModelRepository()
        self.task_repository = TaskRepository()
        self.user_repository = UserRepository()
        self.score_service = ScoreService()
        self.dataset_repository = DatasetRepository()
        self.task_service = TaskService()
        self.example_service = ExampleService()
        self.evaluation_service = EvaluationService()
        self.round_user_example_service = RoundUserExampleInfoService()
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.s3_bucket = os.getenv("AWS_S3_BUCKET")
        self.email_helper = EmailHelper()
        self.openai_provider = OpenAIProvider()

    def get_model_in_the_loop(self, task_id: str) -> str:
        model_in_the_loop_info = self.model_repository.get_model_in_the_loop(task_id)
        if model_in_the_loop_info is None:
            model_in_the_loop = ""
        else:
            model_in_the_loop = model_in_the_loop_info.light_model
        return model_in_the_loop

    def upload_model_to_s3_and_evaluate(
        self,
        model_name: str,
        description: str,
        num_paramaters: str,
        languages: str,
        license: str,
        file_name: str,
        user_id: str,
        task_code: str,
        file_to_upload: UploadFile,
    ) -> str:
        file_name = file_name.lower()
        task_id = self.task_repository.get_task_id_by_task_code(task_code)[0]
        user_email = self.user_repository.get_user_email(user_id)[0]
        task_is_decen_task = self.task_repository.get_task_is_decen_task(task_id)[0]
        model = self.model_repository.create_new_model(
            task_id=task_id,
            user_id=user_id,
            model_name=model_name,
            shortname=model_name,
            longdesc=description,
            desc=description,
            languages=languages,
            license=license,
            params=num_paramaters,
            deployment_status="uploaded",
            secret=secrets.token_hex(),
        )
        self.user_repository.increment_model_submitted_count(user_id)
        if task_is_decen_task:
            model_path = f"models/{task_code}/{user_id}-{file_name}"
            self.s3.put_object(
                Body=file_to_upload.file,
                Bucket="dynabench-challenge",
                Key=model_path,
                ContentType=file_to_upload.content_type,
            )
            decentralize_host = os.getenv("DECENTRALIZED_HOST")
            endpoint = "/builder_evaluation/evaluation/initialize_model_evaluation"
            url = f"{decentralize_host}{endpoint}"
            requests.post(
                url,
                json={
                    "task_code": task_code,
                    "s3_url": model_path,
                    "model_id": model["id"],
                    "user_id": user_id,
                },
            )
            self.email_helper.send(
                contact=user_email,
                cc_contact="dynabench-site@mlcommons.org",
                template_name="model_upload_successful.txt",
                msg_dict={"name": model_name},
                subject=f"Model {model_name} upload succeeded.",
            )
        else:
            model_path = f"models/{task_code}/{user_id}-{file_name}"
            self.s3.put_object(
                Body=file_to_upload.file,
                Bucket=os.getenv("AWS_S3_BUCKET"),
                Key=model_path,
                ContentType=file_to_upload.content_type,
            )
            centralize_host = os.getenv("CENTRALIZED_HOST")
            endpoint = "/builder_evaluation/evaluation/initialize_model_evaluation"
            url = f"{centralize_host}{endpoint}"
            requests.post(
                url,
                json={
                    "task_code": task_code,
                    "s3_url": model_path,
                    "model_id": model["id"],
                    "user_id": user_id,
                },
            )
            self.email_helper.send(
                contact=user_email,
                cc_contact="dynabench-site@mlcommons.org",
                template_name="model_upload_successful.txt",
                msg_dict={"name": model_name},
                subject=f"Model {model_name} upload succeeded.",
            )
        return "Model evaluate successfully"

    def single_model_prediction(self, model_url: str, model_input: dict):
        return requests.post(model_url, json=model_input).json()

    def single_model_prediction_submit(
        self,
        model_url: str,
        model_input: dict,
        context_id: int,
        user_id: int,
        tag: str,
        round_id: int,
        task_id: int,
        sandbox_mode: bool,
        model_prediction_label: str,
        model_evaluation_metric_info: dict,
        model_metadata: Json,
    ) -> str:
        response = {}
        task_config = self.task_service.get_task_info_by_task_id(task_id)
        config_yaml = yaml.safe_load(task_config.config_yaml)
        if model_url:
            prediction = self.single_model_prediction(model_url, model_input)
            response["prediction"] = prediction[model_prediction_label]
            if "cast_output" in config_yaml:
                response["prediction"] = next(
                    (
                        key
                        for key, value in config_yaml["cast_output"].items()
                        if value == response["prediction"]
                    ),
                    None,
                )
            response["probabilities"] = prediction["prob"]
            model_wrong = self.evaluate_model_in_the_loop(
                response["prediction"],
                model_input["label"],
                model_evaluation_metric_info,
            )
        else:
            response["prediction"] = model_input.get("label", "")
            response["probabilities"] = {}
            prediction = {}
            model_wrong = False
        response["label"] = model_input.get("label", "")
        response["input"] = model_input.get(model_input.get("input_by_user", None), "")
        response["fooled"] = model_wrong
        response["sandBox"] = sandbox_mode
        external_validator = config_yaml.get("external_validator", None)
        if external_validator:
            amount_require_examples = external_validator.get(
                "amount_require_examples", -1
            )
            external_validator_url = external_validator.get("url", None)
            external_validator_artifacts = external_validator.get("artifacts", None)
        if not sandbox_mode:
            self.example_service.create_example_and_increment_counters(
                context_id,
                user_id,
                model_wrong,
                model_url,
                json.dumps(model_input),
                json.dumps(prediction),
                json.dumps(model_metadata),
                tag,
                round_id,
                task_id,
                amount_require_examples,
                external_validator_url,
                external_validator_artifacts,
            )
        return response

    def evaluate_model_in_the_loop(
        self,
        prediction: str,
        ground_truth: str,
        model_evaluation_metric_info: dict = {},
    ) -> int:
        return ModelEvaluationStrategy(
            prediction,
            ground_truth,
            model_evaluation_metric_info["metric_name"],
            model_evaluation_metric_info.get("metric_parameters", {}),
        ).evaluate_model()

    def batch_prediction(
        self,
        model_url: str,
        context_id: int,
        user_id: int,
        round_id: int,
        task_id: int,
        metadata: Json,
        tag: str,
        batch_samples: UploadFile,
    ) -> dict:
        batch_samples_data = load_json_lines(batch_samples.file)
        predictions = []
        for example in batch_samples_data:
            prediction = self.single_model_prediction(model_url, example)
            model_wrong = self.evaluate_model_in_the_loop(
                prediction["label"], example["label"]
            )
            prediction["model_wrong"] = model_wrong
            self.example_service.create_example_and_increment_counters(
                context_id,
                user_id,
                model_wrong,
                model_url,
                json.dumps(example),
                json.dumps(prediction),
                metadata,
                tag,
                round_id,
                task_id,
            )
            predictions.append(prediction)
        csv_location = transform_list_to_csv(predictions, batch_samples.filename)
        return csv_location

    def create_input_for_lambda(self, task_id: str):
        task_config = self.evaluation_service.get_task_configuration(task_id)
        inputs = task_config["input"]
        input_data = {}
        for input in inputs:
            input_name = input["name"]
            input_data[input_name] = "test"
        input_data["context"] = "test"
        return input_data

    def initiate_lambda_models(self):
        models = self.model_repository.get_lambda_models()
        while True:
            for model in models:
                model_url = model.light_model.replace("/model/single_evaluation", "")
                try:
                    requests.get(model_url)
                except requests.exceptions.RequestException as e:
                    print(e)
            print("Finished")
            time.sleep(320)

    def get_model_prediction_by_dataset(
        self, user_id: int, model_id: int, dataset_id: int
    ):
        model_info = self.model_repository.get_model_info_by_id(model_id)
        dataset_name = self.dataset_repository.get_dataset_name_by_id(dataset_id)[0]
        task_code = self.task_repository.get_task_code_by_task_id(model_info["tid"])[0]
        if model_info["uid"] != user_id:
            return None
        model_id = str(model_id)
        final_file = f"./app/resources/predictions/{model_id}-{dataset_name}.jsonl.out"
        self.s3.download_file(
            self.s3_bucket,
            f"predictions/{task_code}/{model_id}/{dataset_name}.jsonl.out",
            final_file,
        )
        return final_file

    def get_amount_of_models_by_task(self, task_id: int):
        return self.model_repository.get_amount_of_models_by_task(task_id)

    def get_model_name_by_id(self, model_id: int):
        return self.model_repository.get_model_name_by_id(model_id)

    def get_user_id_by_model_id(self, model_id: int):
        return self.model_repository.get_user_id_by_model_id(model_id)

    def upload_prediction_to_s3(
        self, user_id: int, task_code: str, model_name: str, predictions: UploadFile
    ):
        task_id = self.task_repository.get_task_id_by_task_code(task_code)[0]
        user_email = self.user_repository.get_user_email(user_id)[0]
        model = self.model_repository.create_new_model(
            task_id=task_id,
            user_id=user_id,
            model_name=model_name,
            shortname=model_name,
            longdesc="",
            desc="",
            languages="",
            license=license,
            params=0,
            deployment_status="uploaded",
            secret=secrets.token_hex(),
        )
        self.user_repository.increment_model_submitted_count(user_id)
        file_name = f"{model['id']}-{predictions.filename.split('.')[0]}-{user_id}"
        model_path = f"predictions/{task_code}/{file_name}.jsonl"
        self.s3.put_object(
            Body=predictions.file,
            Bucket=os.getenv("AWS_S3_BUCKET"),
            Key=model_path,
            ContentType=predictions.content_type,
        )
        self.email_helper.send(
            contact=user_email,
            cc_contact="dynabench-site@mlcommons.org",
            template_name="model_upload_successful.txt",
            msg_dict={"name": model_name},
            subject=f"Model {model_name} upload succeeded.",
        )
        centralize_host = os.getenv("CENTRALIZED_HOST")
        endpoint = "/builder_evaluation/evaluation/evaluate_downstream_tasks"
        url = f"{centralize_host}{endpoint}"
        evaluate_model = requests.post(
            url,
            json={
                "task_id": task_id,
                "predictions": file_name,
                "model_id": model["id"],
            },
        )
        if evaluate_model.status_code == 200:
            self.email_helper.send(
                contact=user_email,
                cc_contact="dynabench-site@mlcommons.org",
                template_name="model_evaluation_sucessful.txt",
                msg_dict={"name": model_name, "model_id": model["id"]},
                subject=f"Model {model_name} evaluation succeeded.",
            )
        else:
            self.email_helper.send(
                contact=user_email,
                cc_contact="dynabench-site@mlcommons.org",
                template_name="model_evaluation_failed.txt",
                msg_dict={"name": model_name},
                subject=f"Model {model_name} evaluation failed.",
            )
            raise HTTPException(
                status_code=400, detail="Model evaluation fail, please try again"
            )
        return "Model evaluate successfully"

    def conversation_with_buffer_memory(
        self,
        history: dict,
        model_name: str,
        provider: str,
        prompt: str,
        num_answers: int,
    ):
        if provider == "openai":
            llm = self.openai_provider.initialize(
                model_name=model_name,
            )
        memory = ConversationBufferMemory()
        for entry in history["user"]:
            user_message = entry["text"]
            memory.chat_memory.add_user_message(user_message)
            if history["bot"]:
                ai_message = history["bot"].pop(0)["text"]
                memory.chat_memory.add_ai_message(ai_message)
        responses = []
        for i in range(num_answers):
            conversation = ConversationChain(llm=llm, memory=memory)
            response = {
                "id": i,
                "model_name": model_name,
                "text": conversation.predict(input=prompt),
                "score": 0.5,
            }
            responses.append(response)
        return responses

    def update_model_status(self, model_id: int):
        if self.score_service.verify_scores_for_all_the_datasets(model_id):
            self.model_repository.update_published_status(model_id)
        else:
            raise HTTPException(status_code=400, detail="Model no has all the scores")

    def get_models_by_user_id(self, user_id: int):
        return self.model_repository.get_models_by_user_id(user_id)

    def delete_model(self, model_id: int):
        return self.model_repository.delete_model(model_id)

    def get_all_model_info_by_id(self, model_id: int):
        return self.model_repository.get_all_model_info_by_id(model_id)

    def update_model_info(
        self,
        model_id: int,
        name: str,
        desc: str,
        longdesc: str,
        params: float,
        languages: str,
        license: str,
        source_url: str,
    ):
        return self.model_repository.update_model_info(
            model_id, name, desc, longdesc, params, languages, license, source_url
        )
