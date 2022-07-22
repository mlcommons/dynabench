import requests
import json
import functools
import yaml
import secrets
import os
import boto3
import jsonlines
import logging
import time
import typing as tp
from pathlib import Path

from app import utils
from app.domain.builder import Builder
from app.infrastructure import repositories
import app.infrastructure.repositories.task
from app.infrastructure.repositories.score import ScoreRepository
from app.infrastructure.repositories.dataset import DatasetRepository
from app.domain.eval_utils.input_formatter import InputFormatter
from app.domain.eval_utils.evaluator import Evaluator

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
            self.dataset_repository = DatasetRepository()
        else:
            self.task_repository = repositories.task.DecenTaskRepository()

    def require_fields_task(self):
        return

    @functools.lru_cache()
    def get_task_configuration(self, task_id: int) -> dict:
        task_configuration = yaml.safe_load(
            self.task_repository.get_by_id(task_id)["config_yaml"]
        )
        return task_configuration

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

    def get_scoring_datasets(self, task_id: int, round_id: int):
        if self.decentralized:
            return ["flores101-small1-dev", "flores101-small1-devtest"]

        scoring_datasets = self.dataset_repository.get_scoring_datasets(
            task_id, round_id
        )
        jsonl_scoring_datasets = []
        for scoring_dataset in scoring_datasets:
            jsonl_scoring_datasets.append("{}".format(scoring_dataset.name))
        return jsonl_scoring_datasets

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
        jsonl_scoring_datasets: list,
        bucket_name: str,
        task_code: str,
        delta_metrics: list,
    ):
        final_datasets = []
        for scoring_dataset in jsonl_scoring_datasets:
            base_dataset_name = "datasets/{}/{}.jsonl".format(
                task_code, scoring_dataset
            )
            self.s3.download_file(
                bucket_name,
                base_dataset_name,
                "./app/datasets/{}.jsonl".format(scoring_dataset),
            )
            final_datasets.append("{}.jsonl".format(scoring_dataset))
            for delta_metric in delta_metrics:
                delta_dataset_name = "datasets/{}/{}-{}.jsonl".format(
                    task_code, delta_metric, scoring_dataset
                )
                self.s3.download_file(
                    bucket_name,
                    delta_dataset_name,
                    "./app/datasets/{}-{}.jsonl".format(delta_metric, scoring_dataset),
                )
                final_datasets.append(
                    "{}-{}.jsonl".format(delta_metric, scoring_dataset)
                )
        return final_datasets

    def heavy_prediction(self, datasets: list, task_code: str, model: str):
        output_files = {}
        ip, model_name = self.builder.get_ip_ecs_task(model)
        task_inputs = self.get_task_inputs(task_code)

        for dataset in datasets:
            dataset_file = "./app/datasets/{}".format(dataset)
            with jsonlines.open(dataset_file, "r") as jsonl_f:
                samples = list(jsonl_f)

            # TODO: this seems very unefficient.
            # There is always exactly one flying request.
            # So this server is doing nothing while the task server is working,
            # and the task server is doing nothing while we are handling responses.
            # We should enqueue several queries or at least parallelize over datasets
            responses = []
            for sample in samples:
                args = {k: sample[k] for k in task_inputs}
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

            predictions_file = "./app/datasets/{}.out".format(dataset)
            with jsonlines.open(predictions_file, "w") as writer:
                writer.write_all(responses)

            output_files["base"] = {
                "dataset": dataset_file,
                "predictions": predictions_file,
            }
            self.s3.upload_file(
                predictions_file,
                self.s3_bucket,
                "predictions/{}/{}/{}".format(
                    task_code, model_name, predictions_file.split("/")[-1]
                ),
            )
        # TODO: remove hardcoding
        # return output_files
        return {
            "base": {
                "dataset": "./app/datasets/rafa.jsonl",
                "predictions": "./app/datasets/rafa.jsonl.out",
            },
            "fairness": {
                "dataset": "./app/datasets/fairness-rafa.jsonl",
                "predictions": "./app/datasets/fairness-rafa.jsonl.out",
            },
            "robustness": {
                "dataset": "./app/datasets/robustness-rafa.jsonl",
                "predictions": "./app/datasets/robustness-rafa.jsonl.out",
            },
        }

    def evaluation(self, task: str, model_id: str, model_s3_zip: str):
        tasks = self.task_repository.get_id_and_code(task)
        task_configuration = self.get_task_configuration(tasks.task_id)
        delta_metrics = [
            delta_metric["type"]
            for delta_metric in task_configuration.get("delta_metrics", [])
        ]
        jsonl_scoring_datasets = self.get_scoring_datasets(tasks.task_id, 1)
        datasets = self.downloads_scoring_datasets(
            jsonl_scoring_datasets, self.s3_bucket, tasks.task_code, delta_metrics
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

        input_formatter = InputFormatter(task_configuration)

        formatted_dict = {}
        for data_type in data_dict:
            huevon = f"formatted_{data_type}"
            ferovaes = f"grouped_{data_type}"
            if "dataset" in data_type:
                formatted_dict[huevon] = input_formatter.format_labels(
                    data_dict[data_type]
                )
                formatted_dict[ferovaes] = input_formatter.group_labels(
                    formatted_dict[huevon]
                )
            elif "predictions" in data_type:
                formatted_dict[huevon] = input_formatter.format_predictions(
                    data_dict[data_type]
                )
                formatted_dict[ferovaes] = input_formatter.group_predictions(
                    formatted_dict[huevon]
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

        new_score = {
            "perf": main_metric["perf"],
            "pretty_perf": main_metric["pretty_perf"],
            "fairness": final_scores["fairness"],
            "robustness": final_scores["robustness"],
            "mid": model_id,
            "r_realid": 4,
            "did": 1,
            "memory_utilization": final_scores["memory"],
            "examples_per_second": final_scores["throughput"],
        }

        # TODO(decentralized): call models/update_database_with_metrics endpoint
        self.score_repository.add(new_score)
        return new_score

    @functools.lru_cache()
    def get_task_inputs(self, task_code: str) -> tp.List[str]:
        task_config = self.get_task_configuration(task_code)
        inputs = [obj["name"] for obj in task_config["input"]]
        contexts = [obj["name"] for obj in task_config.get("context", [])]
        outputs = set(obj["name"] for obj in task_config.get("output", []))

        # Make sure the models don't receive the outputs.
        # Maybe this could be validated before the task creation
        return [x for x in inputs + contexts if x not in outputs]

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
                        message_body["task_code"],
                        message_body["model_id"],
                        message_body["s3_uri"],
                    )
                    return new_score
                except:
                    pass
            time.sleep(300)

    @staticmethod
    def _load_dataset(path: str):
        data = []
        with open(path, "r") as f:
            for line in f.readlines():
                data.append(json.loads(line))
        return data

    def _upload_results(evaluated_model_metrics: dict):
        return None
