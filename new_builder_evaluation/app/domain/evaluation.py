# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) MLCommons, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import secrets
import shutil
import sys
import time

import boto3
import requests
import yaml

import jsonlines
from app.domain.builder import Builder
from app.domain.eval_utils.evaluator import Evaluator
from app.domain.eval_utils.input_formatter import InputFormatter
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.score import ScoreRepository
from app.infrastructure.repositories.task import TaskRepository


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
        self.builder = Builder()
        self.task_repository = TaskRepository()
        self.score_repository = ScoreRepository()
        self.dataset_repository = DatasetRepository()

    def require_fields_task(self):
        return

    def get_task_configuration(self, task_id: int):
        task_configuration = yaml.safe_load(
            self.task_repository.get_by_id(task_id)["config_yaml"]
        )
        return task_configuration

    def single_evaluation_ecs(self, ip: str, text):
        headers = {
            "accept": "application/json",
        }
        json_data = {
            "input_text": text,
        }
        response = requests.post(
            f"http://{ip}/model/single_evaluation", headers=headers, json=json_data
        )
        return json.loads(response.text)

    def get_scoring_datasets(self, task_id: int, round_id: int):
        scoring_datasets = self.dataset_repository.get_scoring_datasets(
            task_id, round_id
        )
        jsonl_scoring_datasets = []
        for scoring_dataset in scoring_datasets:
            jsonl_scoring_datasets.append(f"{scoring_dataset.name}")
        return jsonl_scoring_datasets

    def downloads_scoring_datasets(
        self,
        jsonl_scoring_datasets: list,
        bucket_name: str,
        task_code: str,
        delta_metrics: list,
        model: str,
    ):
        folder_name = model.split("/")[-1].split(".")[0]
        final_datasets = []
        for scoring_dataset in jsonl_scoring_datasets:
            base_dataset_name = f"datasets/{task_code}/{scoring_dataset}.jsonl"
            self.s3.download_file(
                bucket_name,
                base_dataset_name,
                "./app/{}/datasets/{}.jsonl".format(
                    folder_name, scoring_dataset["dataset"]
                ),
            )
            final_datasets.append(f"{scoring_dataset}.jsonl")
            for delta_metric in delta_metrics:
                delta_dataset_name = (
                    f"datasets/{task_code}/{delta_metric}-{scoring_dataset}.jsonl"
                )
                self.s3.download_file(
                    bucket_name,
                    delta_dataset_name,
                    "./app/{}/datasets/{}-{}.jsonl".format(
                        folder_name, delta_metric, scoring_dataset["dataset"]
                    ),
                )
                final_datasets.append(f"{delta_metric}-{scoring_dataset}.jsonl")
        return final_datasets

    def heavy_prediction(self, datasets: list, task_code: str, model: str):
        folder_name = model.split("/")[-1].split(".")[0]
        ip, model_name = self.builder.get_ip_ecs_task(model)
        final_dict_prediction = {}
        for dataset in datasets:
            dict_dataset_type = {}
            with jsonlines.open(
                "./app/{}/datasets/{}".format(folder_name, dataset["dataset"]), "r"
            ) as jsonl_f:
                lst = [obj for obj in jsonl_f]
            responses = []
            for line in lst:
                answer = self.single_evaluation_ecs(ip, line["statement"])
                answer["signature"] = secrets.token_hex(15)
                answer["id"] = line["uid"]
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
            dict_dataset_type["dataset"] = "./app/{}/datasets/{}".format(
                folder_name, dataset["dataset"]
            )
            dict_dataset_type[
                "predictions"
            ] = f"./app/{folder_name}/datasets/{name_prediction}"
            dataset_type = dataset["dataset_type"]
            final_dict_prediction[dataset_type] = dict_dataset_type
            dataset_id = dataset["dataset_id"]
        return final_dict_prediction, dataset_id

    def evaluation(self, task: str, model_s3_zip: str):
        tasks = self.task_repository.get_id_and_code(task)
        delta_metrics = self.get_task_configuration(tasks.task_id)["delta_metrics"]
        delta_metrics = [delta_metric["type"] for delta_metric in delta_metrics]
        jsonl_scoring_datasets = self.get_scoring_datasets(tasks.task_id, 1)
        datasets = self.downloads_scoring_datasets(
            jsonl_scoring_datasets,
            self.s3_bucket,
            tasks.task_code,
            delta_metrics,
            model_s3_zip,
        )
        prediction_dict = self.heavy_prediction(datasets, tasks.task_code, model_s3_zip)
        data_dict = {}
        for data_version, data_types in prediction_dict.items():
            for data_type in data_types:
                data_dict[f"{data_version}_{data_type}"] = self._load_dataset(
                    prediction_dict[data_version][data_type]
                )
        perturb_exists = (
            "fairness_predictions" in data_dict or "robustness_predictions" in data_dict
        )
        new_scores = []
        for round in rounds:
            round_datasets = [
                dataset for dataset in datasets if dataset["round_id"] == round
            ]
            prediction_dict, dataset_id = self.heavy_prediction(
                round_datasets, tasks.task_code, model_s3_zip
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

            task_configuration = yaml.safe_load(
                self.task_repository.get_by_id(tasks.id)["config_yaml"]
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

        task_configuration = yaml.safe_load(
            self.task_repository.get_by_id(tasks.task_id)["config_yaml"]
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
        delta_metrics = {}
        if perturb_exists:
            delta_metrics = evaluator.evaluate_delta_metrics(
                formatted_dict.get("grouped_base_predictions"),
                formatted_dict.get("grouped_robustness_predictions"),
                formatted_dict.get("grouped_fairness_predictions"),
            )

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
        return response.get("Messages", [])

    def trigger_sqs(self):
        while True:
            messages = self.get_sqs_messages()
            for message in messages:
                message_body = json.loads(message["Body"])
                try:
                    new_score = self.evaluation(
                        message_body["task_code"], message_body["s3_uri"]
                    )
                    return new_score
                except Exception as ex:
                    return ex
            time.sleep(300)

    @staticmethod
    def _load_dataset(path: str):
        data = []
        with open(path) as f:
            for line in f.readlines():
                data.append(json.loads(line))
        return data

    def _upload_results(evaluated_model_metrics: dict):
        return None
