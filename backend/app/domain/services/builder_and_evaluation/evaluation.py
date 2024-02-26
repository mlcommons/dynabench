# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import datetime
import importlib
import json
import logging
import os
import secrets
import shutil
import sys
import time

import boto3
import jsonlines
import numpy as np
import requests
import yaml
from cloudwatch import cloudwatch

from app.domain.helpers.email import EmailHelper
from app.domain.services.builder_and_evaluation.builder import BuilderService
from app.domain.services.builder_and_evaluation.eval_utils.evaluator import (
    evaluate,
    evaluate_delta_metrics,
    evaluation_without_tags,
)
from app.domain.services.builder_and_evaluation.eval_utils.input_formatter import (
    load_dataset,
    necessary_format_for_evaluation,
    necessary_format_for_multilingual_evaluation,
)
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.round import RoundRepository
from app.infrastructure.repositories.score import ScoreRepository
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.user import UserRepository


class EvaluationService:
    def __init__(self):
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.cloud_watch = self.session.client("cloudwatch")
        self.s3_bucket = os.getenv("AWS_S3_BUCKET")
        self.builder = BuilderService()
        self.task_repository = TaskRepository()
        self.score_repository = ScoreRepository()
        self.dataset_repository = DatasetRepository()
        self.round_repository = RoundRepository()
        self.model_repository = ModelRepository()
        self.user_repository = UserRepository()
        self.email_helper = EmailHelper()
        self.logger = logging.getLogger("logger")
        self.logger.setLevel(logging.INFO)

    def require_fields_task(self, folder_name: str):
        input_location = f"./app/models/{folder_name}/app/domain/schemas/model.py"
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
        response = requests.post(f"http://{ip}/model/single_evaluation", json=json_data)
        return json.loads(response.text)

    def batch_evaluation_ecs(
        self, ip: str, data: list, schema: list, batch_size: int = 64
    ):
        final_predictions = []
        print("start prediction")
        for i in range(0, len(data), batch_size):
            uid = [
                (x)
                for x in [
                    dataset_sample["uid"] for dataset_sample in data[i : batch_size + i]
                ]
            ]
            if i % (batch_size * 10) == 0:
                print(i)
            dataset_samples = {}
            dataset_samples["dataset_samples"] = data[i : batch_size + i]
            dataset_samples_filter = [
                {col: row[col] for col in schema}
                for row in dataset_samples["dataset_samples"]
            ]
            dataset_samples["dataset_samples"] = dataset_samples_filter
            responses = requests.post(
                f"http://{ip}/model/batch_evaluation",
                json=dataset_samples,
            )
            responses = json.loads(responses.text)
            for i, response in enumerate(responses):
                response["id"] = uid[i]
                response["signature"] = secrets.token_hex(15)
            final_predictions = final_predictions + responses
        return final_predictions

    def get_scoring_datasets(self, task_id: int, dataset_name: str = None):
        return self.dataset_repository.get_scoring_datasets(task_id, dataset_name)

    def download_dataset(self, task_code: str, scoring_dataset: dict, folder_name: str):
        final_dataset = {}
        base_dataset_name = "datasets/{}/{}.jsonl".format(
            task_code, scoring_dataset["dataset"]
        )
        print("base_dataset_name", base_dataset_name)
        self.s3.download_file(
            self.s3_bucket,
            base_dataset_name,
            "./app/models/{}/datasets/{}.jsonl".format(
                folder_name, scoring_dataset["dataset"]
            ),
        )
        final_dataset["dataset_type"] = "base"
        final_dataset["round_id"] = scoring_dataset["round_id"]
        final_dataset["dataset_id"] = scoring_dataset["dataset_id"]
        final_dataset["tags"] = scoring_dataset["tags"]
        final_dataset["dataset"] = "{}.jsonl".format(scoring_dataset["dataset"])
        return final_dataset

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
            final_dataset = self.download_dataset(
                task_code, scoring_dataset, folder_name
            )
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
                final_dataset["tags"] = scoring_dataset["tags"]
                final_dataset["dataset"] = "{}-{}.jsonl".format(
                    delta_metric, scoring_dataset["dataset"]
                )
                final_datasets.append(final_dataset)
        return final_datasets

    def get_not_scoring_datasets(self, task_id: int):
        jsonl_not_scoring_datasets = self.dataset_repository.get_not_scoring_datasets(
            task_id
        )
        return jsonl_not_scoring_datasets

    def downloads_not_scoring_datasets(
        self,
        jsonl_all_datasets: list,
        bucket_name: str,
        task_code: str,
        model: str,
    ):
        folder_name = model.split("/")[-1].split(".")[0]
        final_datasets = []
        for dataset in jsonl_all_datasets:
            final_dataset = {}
            base_dataset_name = "datasets/{}/{}.jsonl".format(
                task_code, dataset["dataset"]
            )
            self.s3.download_file(
                bucket_name,
                base_dataset_name,
                "./app/models/{}/datasets/{}.jsonl".format(
                    folder_name, dataset["dataset"]
                ),
            )
            final_dataset["dataset_type"] = "base"
            final_dataset["round_id"] = dataset["round_id"]
            final_dataset["dataset_id"] = dataset["dataset_id"]
            final_dataset["dataset"] = "{}.jsonl".format(dataset["dataset"])
            final_datasets.append(final_dataset)
        return final_datasets

    def validate_input_schema(self, schema: list, dataset: list):
        for param in schema:
            if not (all([param in d for d in dataset])):
                raise Exception(f"Missing param: {param}")

    def build_single_request(self, schema: list, sample_dataset: dict):
        return {param: sample_dataset.get(param) for param in schema}

    def evaluate_dataset(
        self,
        ip: str,
        dataset: dict,
        folder_name: str,
        model_id: int,
        task_code: str,
        num_samples: int = 0,
    ):
        self.logger.info(f"Evaluated {dataset}")
        dict_dataset_type = {}
        with jsonlines.open(
            "./app/models/{}/datasets/{}".format(folder_name, dataset["dataset"]),
            "r",
        ) as jsonl_f:
            dataset_samples = [json.loads(json.dumps(obj)) for obj in jsonl_f]
        responses = []
        # schema = self.require_fields_task(folder_name)
        schema = ["statement"]
        self.validate_input_schema(schema, dataset_samples)
        print(len(dataset_samples))
        responses = self.batch_evaluation_ecs(ip, dataset_samples, schema)
        predictions = "./app/models/{}/datasets/{}.out".format(
            folder_name, dataset["dataset"]
        )
        num_samples += len(dataset_samples)
        with jsonlines.open(predictions, "w") as writer:
            writer.write_all(responses)
        name_prediction = predictions.split("/")[-1]
        self.s3.upload_file(
            predictions,
            self.s3_bucket,
            f"predictions/{task_code}/{model_id}/{name_prediction}",
        )
        dict_dataset_type["dataset"] = "./app/models/{}/datasets/{}".format(
            folder_name, dataset["dataset"]
        )
        dict_dataset_type[
            "predictions"
        ] = f"./app/models/{folder_name}/datasets/{name_prediction}"
        dataset_type = dataset["dataset_type"]
        dataset_id = dataset["dataset_id"]
        tags = dataset["tags"]
        return dict_dataset_type, dataset_type, dataset_id, tags, num_samples

    def heavy_prediction(
        self, datasets: list, task_code: str, ip: str, model_id: int, folder_name: str
    ):
        final_dict_prediction = {}
        start_prediction = time.time()
        num_samples = 0
        for dataset in datasets:
            (
                eval_dataset,
                dataset_type,
                dataset_id,
                tags,
                num_samples,
            ) = self.evaluate_dataset(
                ip, dataset, folder_name, model_id, task_code, num_samples
            )
            final_dict_prediction[dataset_type] = eval_dataset
        end_prediction = time.time()
        seconds_time_prediction = end_prediction - start_prediction
        return (
            final_dict_prediction,
            dataset_id,
            model_id,
            seconds_time_prediction,
            num_samples,
            folder_name,
            tags,
        )

    def get_memory_utilization(self, model_name: str) -> float:
        while True:
            memory_utilization = self.cloud_watch.get_metric_statistics(
                Namespace="AWS/ECS",
                MetricName="MemoryUtilization",
                Dimensions=[
                    {
                        "Name": "ClusterName",
                        "Value": os.getenv("CLUSTER_TASK_EVALUATION"),
                    },
                    {"Name": "ServiceName", "Value": model_name},
                ],
                StartTime=datetime.datetime.utcnow() - datetime.timedelta(hours=0.5),
                EndTime=datetime.datetime.utcnow(),
                Period=36000,
                Statistics=["Average"],
            )
            if len(memory_utilization["Datapoints"]) > 0:
                return (int(memory_utilization["Datapoints"][0]["Average"]) / 100) * (
                    int(os.getenv("MEMORY_UTILIZATION")) / 1000
                )
            else:
                time.sleep(15)

    def get_throughput(self, num_samples: int, seconds_time_prediction: float):
        return round(num_samples / seconds_time_prediction, 2)

    def get_model_ip(self, model_s3_zip: str):
        (
            ip,
            model_name,
            folder_name,
            arn_service,
            repo_name,
        ) = self.builder.get_ip_ecs_task(model_s3_zip, self.logger)
        return ip, model_name, folder_name, arn_service, repo_name

    def necessary_datasets(
        self, task_id: int, task_code: str, model_s3_zip: str, delta_metrics_task: list
    ):
        jsonl_scoring_datasets = self.get_scoring_datasets(task_id)
        scoring_datasets = self.downloads_scoring_datasets(
            jsonl_scoring_datasets,
            self.s3_bucket,
            task_code,
            delta_metrics_task,
            model_s3_zip,
        )
        return scoring_datasets

    def evaluation_with_selected_langs(
        self,
        task_id: str,
        task_code: str,
        model_s3_zip: str,
        model_id: int,
        user_id: int,
        selected_langs: str,
    ) -> dict:
        selected_langs = selected_langs.split(",")
        task_configuration = self.get_task_configuration(task_id)
        folder_name = model_s3_zip.split("/")[-1].split(".")[0]
        os.mkdir(f"./app/models/{folder_name}")
        os.mkdir(f"./app/models/{folder_name}/datasets/")
        genders = task_configuration.get("submit_config", {}).get("genders", [])
        multigender = task_configuration.get("submit_config", {}).get(
            "multigender", False
        )
        ip, model_name, folder_name, arn_service, repo_name = self.get_model_ip(
            model_s3_zip
        )
        for lang in selected_langs:
            if multigender:
                for gender in genders:
                    dataset = self.dataset_repository.get_scoring_datasets(
                        task_id, f"{lang}-{gender}"
                    )[0]
                    dataset = self.download_dataset(task_code, dataset, folder_name)
                    (
                        dict_dataset_type,
                        _,
                        dataset_id,
                        tags,
                        num_samples,
                    ) = self.evaluate_dataset(
                        ip, dataset, folder_name, model_id, task_code
                    )
                    for gender in genders:
                        final_scores, main_metric, metric = self.get_finals_scores(
                            task_id, dict_dataset_type, False, True, "statement"
                        )
                    print("dataset::", dataset)
                    round_info = self.round_repository.get_round_info_by_round_and_task(
                        task_id, dataset["round_id"]
                    )
                    print("final_scores", final_scores)
                    print("main_metric", main_metric)
                    print("metric", metric)
                    new_score = {
                        "perf": main_metric["perf"],
                        "pretty_perf": main_metric["pretty_perf"],
                        "fairness": final_scores["fairness"],
                        "robustness": final_scores["robustness"],
                        "mid": model_id,
                        "r_realid": round_info.id,
                        "did": dataset_id,
                        "memory_utilization": 0,
                        "examples_per_second": 0,
                    }
                    final_score = new_score.copy()
                    metric_name = str(metric)
                    final_score[metric_name] = main_metric["perf"]
                    new_score["metadata_json"] = json.dumps(final_score)
                    self.score_repository.add(new_score)
            else:
                dataset = self.dataset_repository.get_scoring_datasets(task_id, lang)[0]
                dataset = self.download_dataset(task_code, dataset, folder_name)
                (
                    dict_dataset_type,
                    _,
                    dataset_id,
                    tags,
                    num_samples,
                ) = self.evaluate_dataset(ip, dataset, folder_name, model_id, task_code)
                for gender in genders:
                    final_scores, main_metric, metric = self.get_finals_scores(
                        task_id, dict_dataset_type, False, True, gender
                    )
                    print("dataset::", dataset)
                    round_info = self.round_repository.get_round_info_by_round_and_task(
                        task_id, dataset["round_id"]
                    )
                    print("final_scores", final_scores)
                    print("main_metric", main_metric)
                    print("metric", metric)
                    new_score = {
                        "perf": main_metric["perf"],
                        "pretty_perf": main_metric["pretty_perf"],
                        "fairness": final_scores["fairness"],
                        "robustness": final_scores["robustness"],
                        "mid": model_id,
                        "r_realid": round_info.id,
                        "did": dataset_id,
                        "memory_utilization": 0,
                        "examples_per_second": 0,
                    }
                    final_score = new_score.copy()
                    metric_name = str(metric)
                    final_score[metric_name] = main_metric["perf"]
                    new_score["metadata_json"] = json.dumps(final_score)
                    self.score_repository.add(new_score)
        self.builder.delete_repository(repo_name)
        self.clean_folder_and_service(folder_name, arn_service)
        user_email = self.user_repository.get_user_email(user_id)[0]
        self.email_helper.send(
            contact=user_email,
            cc_contact="dynabench-site@mlcommons.org",
            template_name="model_train_successful.txt",
            msg_dict={"name": model_name, "model_id": model_id},
            subject=f"Model {model_name} training succeeded.",
        )
        return

    def evaluation(
        self,
        task_code: str,
        model_s3_zip: str,
        model_id: int,
        user_id: int,
        selected_langs: str = None,
        evaluate_not_scoring_datasets: bool = False,
    ) -> dict:
        tasks = self.task_repository.get_model_id_and_task_code(task_code)
        if selected_langs is not None and len(selected_langs) > 0:
            new_scores = self.evaluation_with_selected_langs(
                tasks.id, task_code, model_s3_zip, model_id, user_id, selected_langs
            )
            return new_scores
        logs_name = "logs-{}".format(
            (model_s3_zip.split("/")[-1].split(".")[0]).split("-")[0]
        )
        handler = cloudwatch.CloudwatchHandler(
            log_group="test_logging_new_builder",
            log_stream=logs_name,
            access_id=os.getenv("AWS_ACCESS_KEY_ID"),
            access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region=os.getenv("AWS_REGION"),
        )
        formatter = logging.Formatter("%(asctime)s : %(levelname)s - %(message)s")
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

        self.logger.info(f"Task: {tasks.id}")
        delta_metrics_task = self.get_task_configuration(tasks.id).get(
            "delta_metrics", []
        )
        delta_metrics_task = [
            delta_metric_task["type"] for delta_metric_task in delta_metrics_task
        ]
        scoring_datasets = self.necessary_datasets(
            tasks.id, tasks.task_code, model_s3_zip, delta_metrics_task
        )
        self.logger.info("Datasets downloaded")
        rounds = list(
            map(
                int,
                {
                    current_round
                    for rounds in scoring_datasets
                    for current_round in str(rounds["round_id"])
                },
            )
        )
        ip, model_name, folder_name, arn_service, repo_name = self.get_model_ip(
            model_s3_zip
        )
        new_scores = []
        self.logger.info(f"Create endpoint for evaluation: {ip}")
        for current_round in rounds:
            round_datasets = [
                dataset
                for dataset in scoring_datasets
                if dataset["round_id"] == current_round
            ]
            self.logger.info("Evaluate scoring datasets")
            new_score = self.save_predictions_dataset(
                round_datasets,
                tasks,
                ip,
                model_name,
                folder_name,
                model_id,
                arn_service,
                current_round,
                selected_langs,
            )
            new_scores.append(new_score)
        if evaluate_not_scoring_datasets:
            jsonl_not_scoring_datasets = self.get_not_scoring_datasets(tasks.id)
            not_scoring_datasets = self.downloads_not_scoring_datasets(
                jsonl_not_scoring_datasets,
                self.s3_bucket,
                tasks.task_code,
                model_s3_zip,
            )
            for not_scoring_dataset in not_scoring_datasets:
                self.logger.info("Evaluate non-scoring datasets")
                send_not_scoring_dataset = []
                send_not_scoring_dataset.append(not_scoring_dataset)
                new_score = self.save_predictions_dataset(
                    send_not_scoring_dataset,
                    tasks,
                    ip,
                    model_name,
                    folder_name,
                    model_id,
                    arn_service,
                )
                new_scores.append(new_score)
        self.builder.delete_repository(repo_name)
        self.logger.info("Create light model")
        self.model_repository.update_model_status(model_id)
        self.logger.info("Clean folder and service")
        self.clean_folder_and_service(folder_name, arn_service)
        user_email = self.user_repository.get_user_email(user_id)[0]
        self.email_helper.send(
            contact=user_email,
            cc_contact="dynabench-site@mlcommons.org",
            template_name="model_train_successful.txt",
            msg_dict={"name": model_name, "model_id": model_id},
            subject=f"Model {model_name} training succeeded.",
        )
        return new_scores

    def clean_folder_and_service(self, folder_name: str, arn_service: str):
        print("arn_service", arn_service)
        if arn_service:
            self.builder.delete_ecs_service(str(arn_service))
        shutil.rmtree(f"./app/models/{folder_name}")

    def get_finals_scores(
        self,
        task_id: int,
        prediction_dict: dict,
        tags: bool,
        multilingual: bool = False,
        gender: str = None,
    ):
        task_configuration = self.get_task_configuration(task_id)
        if isinstance(task_configuration["perf_metric"], list):
            metric_info = task_configuration["perf_metric"]
        elif isinstance(task_configuration["perf_metric"], dict):
            metric_info = task_configuration["perf_metric"]

        if multilingual:
            (
                formatted_dict,
                perturb_exists,
            ) = necessary_format_for_multilingual_evaluation(
                prediction_dict, "translation", gender
            )
        else:
            formatted_dict, perturb_exists = necessary_format_for_evaluation(
                prediction_dict, metric_info["reference_name"]
            )

        if tags:
            main_metric = evaluate(
                metric_info["type"],
                formatted_dict["formatted_base_predictions"],
                formatted_dict["formatted_base_dataset"],
            )
        else:
            main_metric = evaluation_without_tags(
                metric_info["type"],
                formatted_dict["formatted_base_predictions"],
                formatted_dict["formatted_base_dataset"],
                multilingual,
            )
        delta_metrics = {}
        if perturb_exists:
            delta_metrics = evaluate_delta_metrics(
                metric_info["type"],
                formatted_dict.get("grouped_base_predictions"),
                formatted_dict.get("grouped_robustness_predictions"),
                formatted_dict.get("grouped_fairness_predictions"),
                task_configuration["delta_metrics"],
            )
        metric = metric_info["type"]
        final_scores = {
            str(metric): main_metric,
            "fairness": delta_metrics.get("fairness"),
            "robustness": delta_metrics.get("robustness"),
        }
        return final_scores, main_metric, metric

    def save_predictions_dataset(
        self,
        dataset: dict,
        tasks: dict,
        ip: str,
        model_name: str,
        folder_name: str,
        model_id: int,
        arn_service: str,
        current_round: int = 1,
        selected_langs: str = None,
    ):
        try:
            print("dataset", dataset)
            (
                prediction_dict,
                dataset_id,
                model_id,
                minutes_time_prediction,
                num_samples,
                folder_name,
                tags,
            ) = self.heavy_prediction(
                dataset, tasks.task_code, ip, model_id, folder_name
            )
            self.logger.info("Calculate memory utilization")
            memory = self.get_memory_utilization(model_name)
            self.logger.info("Calculate throughput")
            throughput = self.get_throughput(num_samples, minutes_time_prediction)
            self.logger.info("Calculate score")
            final_scores, main_metric, metric = self.get_finals_scores(
                tasks.id, prediction_dict, False
            )
            print("current_round", current_round)
            round_info = self.round_repository.get_round_info_by_round_and_task(
                tasks.id, current_round
            )
            print("final_scores", final_scores)
            print("main_metric", main_metric)
            print("metric", metric)
            new_score = {
                "perf": main_metric["perf"],
                "pretty_perf": main_metric["pretty_perf"],
                "fairness": final_scores["fairness"],
                "robustness": final_scores["robustness"],
                "mid": model_id,
                "r_realid": round_info.id,
                "did": dataset_id,
                "memory_utilization": memory,
                "examples_per_second": throughput,
            }
            final_score = new_score.copy()
            metric_name = str(metric)
            final_score[metric_name] = main_metric["perf"]
            new_score["metadata_json"] = json.dumps(final_score)
            self.score_repository.add(new_score)
            self.logger.info("Save score")
            return new_score
        except Exception:
            self.clean_folder_and_service(folder_name, arn_service)

    def evaluate_dataperf_decentralized(self, dataperf_response: dict):
        model_id = dataperf_response["model_id"]
        task_id = self.model_repository.get_by_id(model_id)["tid"]
        print("Received a submission for model ID", model_id, "and task ID", task_id)

        task_config = self.get_task_configuration(task_id)
        if isinstance(task_config["perf_metric"], list):
            task_metric = task_config["perf_metric"]["type"]
        elif isinstance(task_config["perf_metric"], dict):
            task_metric = task_config["perf_metric"]["type"]

        dataset_name = list(dataperf_response["results"].keys())[0]

        score = dataperf_response["results"][dataset_name]["auc_score"][str(model_id)][
            "fraction_fixes"
        ]
        score = 100 * np.round(score, 4)

        did = self.dataset_repository.get_dataset_info_by_name(dataset_name)["id"]
        r_realid = self.round_repository.get_by_id(task_id)["rid"]

        new_score = {
            "perf": score,
            "pretty_perf": f"{score}%",
            "mid": model_id,
            "r_realid": r_realid,
            "did": did,
        }
        final_score = new_score.copy()
        metric_name = str(task_metric)
        final_score[metric_name] = score
        final_score["perf_by_tag"] = [
            {
                "tag": dataset_name,
                "pretty_perf": f"{score} %",
                "perf": score,
                "perf_std": 0.0,
                "perf_dict": {task_metric: score},
            }
        ]

        new_score["metadata_json"] = json.dumps(final_score)
        self.score_repository.add(new_score)
        return new_score

    def download_downstream_dataset(self, task_code: str, downstream_dataset: dict):
        base_dataset_name = "datasets/{}/{}.jsonl".format(
            task_code, downstream_dataset["dataset"]
        )
        filename = "app/resources/datasets/{}.jsonl".format(
            downstream_dataset["dataset"]
        )
        self.s3.download_file(
            self.s3_bucket,
            base_dataset_name,
            filename,
        )
        return filename

    def download_predictions(self, task_code: str, predictions: str):
        filename = f"app/resources/predictions/{predictions}.jsonl"
        base_prediction_name = f"predictions/{task_code}/{predictions}.jsonl"
        self.s3.download_file(
            self.s3_bucket,
            base_prediction_name,
            filename,
        )
        return filename

    def evaluate_downstream_tasks(self, task_id: int, predictions: str, model_id: int):
        downstream_datasets_info = self.dataset_repository.get_downstream_datasets(
            task_id
        )
        task_code = self.task_repository.get_by_id(task_id)["task_code"]
        print(downstream_datasets_info)
        download_predictions = self.download_predictions(task_code, predictions)
        downstream_predictions = load_dataset(download_predictions)
        for downstream_dataset in downstream_datasets_info:
            dataset_name = downstream_dataset["dataset"].split("-")[0]
            if dataset_name.split("_")[0] == "msgs":
                dataset_name = dataset_name.split("_")[0]
            print("dataset_name", dataset_name)
            downstream_datasets_filename = self.download_downstream_dataset(
                task_code, downstream_dataset
            )
            downstream_datasets = load_dataset(downstream_datasets_filename)
            downstream_tasks = [item["sub_task"] for item in downstream_datasets]
            downstream_prediction = [
                d for d in downstream_predictions if d["task"].lower() == dataset_name
            ]
            current_round = downstream_dataset["round_id"]
            dataset_id = downstream_dataset["dataset_id"]
            for sub_task in downstream_tasks:
                print("sub_task", sub_task)
                self.logger.info("Evaluate downstream task={sub_task}")
                labels = [
                    data for data in downstream_datasets if data["sub_task"] == sub_task
                ][0]["labels"]
                predicts = [
                    data
                    for data in downstream_prediction
                    if data["sub_task"] == sub_task
                ][0]["predictions"]
                predicts = [
                    item
                    for item in predicts
                    if any(item["id"] == entry["id"] for entry in labels)
                ]
                metric = [
                    data for data in downstream_datasets if data["sub_task"] == sub_task
                ][0]["metric"]
                round_info = self.round_repository.get_round_info_by_round_and_task(
                    task_id, current_round
                )
                score = evaluation_without_tags(metric, predicts, labels)
                print(score)
                new_score = {
                    "perf": score["perf"],
                    "pretty_perf": score["pretty_perf"],
                    "fairness": 0,
                    "robustness": 0,
                    "mid": model_id,
                    "r_realid": round_info.id,
                    "did": dataset_id,
                    "memory_utilization": 0,
                    "examples_per_second": 0,
                }
                final_score = new_score.copy()
                metric_name = str(metric)
                final_score[metric_name] = final_score["perf"]
                final_score["task"] = dataset_name
                final_score["sub_task"] = sub_task
                new_score["metadata_json"] = json.dumps(final_score)
                self.score_repository.add(new_score)
                self.logger.info("Save score")
        self.model_repository.update_model_status(model_id)
        user_id = self.model_repository.get_user_id_by_model_id(model_id)[0]
        user_email = self.user_repository.get_user_email(user_id)[0]
        self.score_repository.fix_matthews_correlation(model_id)
        self.score_repository.fix_f1_score(model_id)
        self.email_helper.send(
            contact=user_email,
            cc_contact="dynabench-site@mlcommons.org",
            template_name="model_train_successful.txt",
            msg_dict={"name": model_id, "model_id": model_id},
            subject=f"Model {model_id} training succeeded.",
        )

    # def test(self):
    #     task_code = "multilingual-holistic-bias"
    #     task_id = 54
    #     model_id = 1674
    #     self.evaluation_with_selected_langs(
    #         task_id, task_code, "models/1608.zip", model_id, 1675, "eng-spa_Latn"
    #     )
    #     return "test"

    def initialize_model_evaluation(
        self,
        task_code: str,
        s3_url: str,
        model_id: int,
        user_id: int,
        selected_langs: str,
    ):
        return self.evaluation(task_code, s3_url, model_id, user_id, selected_langs)
