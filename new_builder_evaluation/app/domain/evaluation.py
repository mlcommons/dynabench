# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import datetime
import importlib
import json
import os
import secrets
import shutil
import sys
import time

import boto3
import jsonlines
import requests
import yaml

from app.domain.builder import Builder
from app.domain.eval_utils.evaluator import Evaluator
from app.domain.eval_utils.input_formatter import InputFormatter
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.round import RoundRepository
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
        self.cloud_watch = self.session.client("cloudwatch")
        self.s3_bucket = os.getenv("AWS_S3_BUCKET")
        self.builder = Builder()
        self.task_repository = TaskRepository()
        self.score_repository = ScoreRepository()
        self.dataset_repository = DatasetRepository()
        self.round_repository = RoundRepository()
        self.model_repository = ModelRepository()

    def require_fields_task(self, folder_name: str):
        input_location = f"./app/models/{folder_name}/app/api/schemas/model.py"
        spec = importlib.util.spec_from_file_location(
            "ModelSingleInput", input_location
        )
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        return module.ModelSingleInput.schema().get("required")

    def get_task_configuration(self, task_id: int):
        task_configuration = yaml.safe_load(
            self.task_repository.get_by_id(task_id)["config_yaml"]
        )
        return task_configuration

    def single_evaluation_ecs(self, ip: str, json_data: dict):
        headers = {
            "accept": "application/json",
        }
        response = requests.post(
            f"http://{ip}/model/single_evaluation", headers=headers, json=json_data
        )
        return json.loads(response.text)

    def get_scoring_datasets(self, task_id: int):
        jsonl_scoring_datasets = self.dataset_repository.get_scoring_datasets(task_id)
        return jsonl_scoring_datasets

    def downloads_scoring_datasets(
        self,
        jsonl_scoring_datasets: list,
        bucket_name: str,
        task_code: str,
        delta_metrics_task: list,
        model: str,
    ):
        folder_name = model.split("/")[-1].split(".")[0]
        os.mkdir(f"./app/models/{folder_name}")
        os.mkdir(f"./app/models/{folder_name}/datasets/")
        final_datasets = []
        for scoring_dataset in jsonl_scoring_datasets:
            final_dataset = {}
            base_dataset_name = "datasets/{}/{}.jsonl".format(
                task_code, scoring_dataset["dataset"]
            )
            print(bucket_name, base_dataset_name)
            self.s3.download_file(
                bucket_name,
                base_dataset_name,
                "./app/models/{}/datasets/{}.jsonl".format(
                    folder_name, scoring_dataset["dataset"]
                ),
            )
            final_dataset["dataset_type"] = "base"
            final_dataset["round_id"] = scoring_dataset["round_id"]
            final_dataset["dataset_id"] = scoring_dataset["dataset_id"]
            final_dataset["dataset"] = "{}.jsonl".format(scoring_dataset["dataset"])
            final_datasets.append(final_dataset)
            for delta_metric in delta_metrics_task:
                final_dataset = {}
                delta_dataset_name = "datasets/{}/{}-{}.jsonl".format(
                    task_code, delta_metric, scoring_dataset["dataset"]
                )
                self.s3.download_file(
                    bucket_name,
                    delta_dataset_name,
                    "./app/models/{}/datasets/{}-{}.jsonl".format(
                        folder_name, delta_metric, scoring_dataset["dataset"]
                    ),
                )
                final_dataset["dataset_type"] = delta_metric
                final_dataset["round_id"] = scoring_dataset["round_id"]
                final_dataset["dataset_id"] = scoring_dataset["dataset_id"]
                final_dataset["dataset"] = "{}-{}.jsonl".format(
                    delta_metric, scoring_dataset["dataset"]
                )
                final_datasets.append(final_dataset)
        return final_datasets

    def validate_input_schema(self, schema: list, dataset: list):
        for param in schema:
            if not (all([param in d for d in dataset])):
                raise Exception(f"Missing param: {param}")

    def build_single_request(self, schema: list, sample_dataset: dict):
        return {param: sample_dataset.get(param) for param in schema}

    def heavy_prediction(self, datasets: list, task_code: str, model: str):
        ip, model_name, folder_name, arn_service = self.builder.get_ip_ecs_task(model)
        final_dict_prediction = {}
        start_prediction = time.time()
        num_samples = 0
        for dataset in datasets:
            dict_dataset_type = {}
            with jsonlines.open(
                "./app/models/{}/datasets/{}".format(folder_name, dataset["dataset"]),
                "r",
            ) as jsonl_f:
                lst = [obj for obj in jsonl_f]
            responses = []
            schema = self.require_fields_task(folder_name)
            self.validate_input_schema(schema, lst)
            for line in lst:
                answer = self.single_evaluation_ecs(
                    ip, self.build_single_request(schema, line)
                )
                answer["signature"] = secrets.token_hex(15)
                answer["id"] = line["uid"]
                responses.append(answer)
            predictions = "./app/models/{}/datasets/{}.out".format(
                folder_name, dataset["dataset"]
            )
            num_samples += len(lst)
            with jsonlines.open(predictions, "w") as writer:
                writer.write_all(responses)
            name_prediction = predictions.split("/")[-1]
            self.s3.upload_file(
                predictions,
                self.s3_bucket,
                f"predictions/{task_code}/{model_name}/{name_prediction}",
            )
            dict_dataset_type["dataset"] = "./app/models/{}/datasets/{}".format(
                folder_name, dataset["dataset"]
            )
            dict_dataset_type[
                "predictions"
            ] = f"./app/models/{folder_name}/datasets/{name_prediction}"
            dataset_type = dataset["dataset_type"]
            final_dict_prediction[dataset_type] = dict_dataset_type
            dataset_id = dataset["dataset_id"]
        end_prediction = time.time()
        seconds_time_prediction = end_prediction - start_prediction
        return (
            final_dict_prediction,
            dataset_id,
            arn_service,
            model_name,
            seconds_time_prediction,
            num_samples,
            folder_name,
        )

    def get_memory_utilization(self, model_name: str) -> float:
        while True:
            memory_utilization = self.cloud_watch.get_metric_statistics(
                Namespace="AWS/ECS",
                MetricName="CPUUtilization",
                Dimensions=[
                    {
                        "Name": "ClusterName",
                        "Value": os.getenv("CLUSTER_TASK_EVALUATION"),
                    },
                    {"Name": "ServiceName", "Value": model_name},
                ],
                StartTime=datetime.datetime.now() - datetime.timedelta(hours=0.05),
                EndTime=datetime.datetime.now(),
                Period=36000,
                Statistics=["Average"],
            )
            if len(memory_utilization["Datapoints"]) > 0:
                return memory_utilization["Datapoints"][0]["Average"]
            else:
                time.sleep(15)

    def get_throughput(self, num_samples: int, seconds_time_prediction: float):
        return round(num_samples / seconds_time_prediction, 2)

    def evaluation(self, task: str, model_s3_zip: str, model_id: int) -> dict:
        tasks = self.task_repository.get_model_id_and_task_code(task)
        delta_metrics_task = self.get_task_configuration(tasks.id)["delta_metrics"]
        delta_metrics_task = [
            delta_metric_task["type"] for delta_metric_task in delta_metrics_task
        ]
        jsonl_scoring_datasets = self.get_scoring_datasets(tasks.id)
        datasets = self.downloads_scoring_datasets(
            jsonl_scoring_datasets,
            self.s3_bucket,
            tasks.task_code,
            delta_metrics_task,
            model_s3_zip,
        )
        rounds = list(
            map(
                int,
                {
                    current_round
                    for rounds in datasets
                    for current_round in str(rounds["round_id"])
                },
            )
        )
        new_scores = []
        for current_round in rounds:
            round_datasets = [
                dataset for dataset in datasets if dataset["round_id"] == current_round
            ]
            (
                prediction_dict,
                dataset_id,
                arn_service,
                model_name,
                minutes_time_prediction,
                num_samples,
                folder_name,
            ) = self.heavy_prediction(round_datasets, tasks.task_code, model_s3_zip)
            self.builder.delete_ecs_service(arn_service)
            memory = self.get_memory_utilization(model_name)
            throughput = self.get_throughput(num_samples, minutes_time_prediction)
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
            metric = task_configuration["perf_metric"]["type"]
            final_scores = {
                str(metric): main_metric,
                "fairness": delta_metrics.get("fairness"),
                "robustness": delta_metrics.get("robustness"),
                "memory": memory,
                "throughput": throughput,
            }
            round_info = self.round_repository.get_round_info_by_round_and_task(
                tasks.id, current_round
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

            new_score["metadata_json"] = json.dumps(new_score)

            self.score_repository.add(new_score)
            new_scores.append(new_score)
            url_light_model = self.builder.create_light_model(model_name, folder_name)
            self.model_repository.update_light_model(model_id, url_light_model)
            shutil.rmtree(f"./app/models/{folder_name}")
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
