# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from ast import literal_eval

import yaml

from app.domain.services.base.score import ScoreService
from app.domain.services.builder_and_evaluation.eval_utils.instance_property import (
    instance_property,
)
from app.domain.services.builder_and_evaluation.eval_utils.metrics_dicts import (
    meta_metrics_dict,
)
from app.domain.services.utils.secure_copy_protocol import SecureCopyProtocol
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.example import ExampleRepository
from app.infrastructure.repositories.historical_data import HistoricalDataRepository
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.taskcategories import TaskCategoriesRepository
from app.infrastructure.repositories.user import UserRepository
from app.infrastructure.repositories.validation import ValidationRepository


class TaskService:
    def __init__(self):
        self.task_repository = TaskRepository()
        self.dataset_repository = DatasetRepository()
        self.model_repository = ModelRepository()
        self.example_repository = ExampleRepository()
        self.score_services = ScoreService()
        self.task_categories_repository = TaskCategoriesRepository()
        self.user_repository = UserRepository()
        self.validation_repository = ValidationRepository()
        self.historical_task_repository = HistoricalDataRepository()
        self.server_ssh = os.getenv("SERVER_SSH")
        self.build_eval_server_pem = os.getenv("BUILD_EVAL_SERVER_PEM")

    def get_task_code_by_task_id(self, task_id: int):
        return self.task_repository.get_task_code_by_task_id(task_id)

    def update_last_activity_date(self, task_id: int):
        self.task_repository.update_last_activity_date(task_id)

    def get_active_tasks_with_round_info(self):
        tasks_and_round_info = self.task_repository.get_active_tasks_with_round_info()
        tasks = [
            task_and_round_info["Task"].__dict__
            for task_and_round_info in tasks_and_round_info
        ]
        rounds = [
            task_and_round_info["Round"].__dict__
            for task_and_round_info in tasks_and_round_info
        ]
        challenge_types = [
            task_and_round_info["ChallengesTypes"].__dict__
            for task_and_round_info in tasks_and_round_info
        ]
        for i, challenge_type in enumerate(challenge_types):
            tasks[i]["challenge_type_info"] = dict(challenge_type)
        for i, round in enumerate(rounds):
            tasks[i]["round"] = dict(round)
        return tasks

    def get_challenges_types(self):
        return self.task_repository.get_challenges_types()

    def get_metric_weight(self, field_name, perf_metric_field_name, default_weights):
        default_weight = default_weights.get(field_name)
        if default_weight is not None:
            return default_weight

        if field_name == perf_metric_field_name:
            return 4
        return 1

    def get_dataset_weight(self, dataset_id: int = None):
        dataset_weight = self.dataset_repository.get_dataset_weight(dataset_id)[0]
        if dataset_weight is not None:
            return dataset_weight
        return 5

    def get_order_datasets_by_task_id(self, task_id: int):
        datasets = self.dataset_repository.get_order_datasets_by_task_id(task_id)
        return [dataset.__dict__ for dataset in datasets]

    def get_order_scoring_datasets_by_task_id(self, task_id: int):
        scoring_datasets = (
            self.dataset_repository.get_order_scoring_datasets_by_task_id(task_id)
        )
        scoring_datasets = [dataset.__dict__ for dataset in scoring_datasets]
        for scoring_dataset in scoring_datasets:
            scoring_dataset["default_weight"] = self.get_dataset_weight(
                scoring_dataset.get("id")
            )
        return scoring_datasets

    def get_task_info_by_task_id(self, task_id: int):
        return self.task_repository.get_task_info_by_task_id(task_id)

    def get_order_metrics_by_task_id(self, task_id: int):
        task_info = self.get_task_info_by_task_id(task_id).__dict__
        task_configuration = yaml.load(task_info.get("config_yaml"), yaml.SafeLoader)

        if isinstance(task_configuration["perf_metric"], list):
            perf_metric_type = task_configuration.get("perf_metric", [])
            type_values = [item["type"] for item in perf_metric_type]
        elif isinstance(task_configuration["perf_metric"], dict):
            perf_metric_type = task_configuration.get("perf_metric", {})
            type_values = [perf_metric_type["type"]]

        delta_perf_metrics_type = [
            obj["type"] for obj in task_configuration.get("delta_metrics", [])
        ]
        aws_metric_names = instance_property.get(
            task_info.get("instance_type"), {}
        ).get("aws_metrics", [])

        ordered_metric_field_names = (
            type_values + aws_metric_names + delta_perf_metrics_type
        )
        metrics_metadata = {
            metric: meta_metrics_dict.get(metric)(task_info)
            for metric in ordered_metric_field_names
        }
        order_metrics = [
            dict(
                {
                    "name": metrics_metadata[field_name]["pretty_name"],
                    "field_name": field_name,
                    "default_weight": self.get_metric_weight(
                        field_name,
                        task_info.get("perf_metric_field_name"),
                        task_configuration.get("aggregation_metric", {}).get(
                            "default_weights", {-1: 1}
                        ),
                    ),
                },
                **metrics_metadata[field_name],
            )
            for field_name in ordered_metric_field_names
        ]
        return order_metrics

    def get_task_with_round_info_by_task_id(self, task_id: int):
        task_and_round_info = self.task_repository.get_task_with_round_info_by_task_id(
            task_id
        )
        task = task_and_round_info["Task"].__dict__
        task["round"] = task_and_round_info["Round"].__dict__
        task["challenge_type_name"] = task_and_round_info["ChallengesTypes"].__dict__[
            "name"
        ]
        return task

    def get_task_id_by_task_code(self, task_code: str):
        print("task_code", task_code)
        return self.task_repository.get_task_id_by_task_code(task_code).id

    def get_perf_metric_field_name_by_task_id(self, task_id: int):
        task_info = self.get_task_info_by_task_id(task_id).__dict__
        task_configuration = yaml.load(task_info.get("config_yaml"), yaml.SafeLoader)
        if isinstance(task_configuration["perf_metric"], list):
            principal_metric = task_configuration.get("perf_metric", [])[0]
            perf_metric_type = principal_metric["type"]
        elif isinstance(task_configuration["perf_metric"], dict):
            perf_metric_type = task_configuration.get("perf_metric", {})["type"]
        return perf_metric_type

    def get_dynaboard_info_by_task_id(
        self,
        task_id: int,
        ordered_metric_weights: list,
        ordered_scoring_dataset_weights: list,
        sort_by: str = "dynascore",
        sort_direction: str = "asc",
        offset: int = 0,
        limit: int = 5,
        metrics: list = [],
    ):
        dynaboard_info = {}
        ordered_metrics = self.get_order_metrics_by_task_id(task_id)
        ordered_scoring_datasets = self.get_order_scoring_datasets_by_task_id(task_id)
        task_info = self.get_task_info_by_task_id(task_id).__dict__
        task_configuration = yaml.load(task_info.get("config_yaml"), yaml.SafeLoader)
        perf_metric_info = task_configuration.get("perf_metric", {})
        order_metric_with_weight = [
            dict({"weight": weight}, **metric)
            for weight, metric in zip(ordered_metric_weights, ordered_metrics)
        ]
        order_scoring_datasets_with_weight = [
            {"weight": weight, "did": did}
            for weight, did in zip(
                ordered_scoring_dataset_weights,
                [dataset["id"] for dataset in ordered_scoring_datasets],
            )
        ]
        models = self.model_repository.get_active_models_by_task_id(task_id)
        models_id = [model.id for model in models]
        perf_metric_field_name = self.get_perf_metric_field_name_by_task_id(task_id)
        dynaboard_info["count"] = len(models_id)
        data = self.score_services.get_dynaboard_info_for_all_the_models(
            models_id,
            order_scoring_datasets_with_weight,
            order_metric_with_weight,
            perf_metric_field_name,
            sort_by,
            sort_direction,
            offset,
            limit,
            metrics,
            perf_metric_info,
        )
        dynaboard_info["data"] = data
        return dynaboard_info

    def get_task_trends_score(self, task_id: int, dataset_id: int):
        task_info = self.get_task_with_round_and_dataset_info(task_id)
        return task_info

    def get_active_dataperf_tasks(self):
        return self.task_repository.get_active_dataperf_tasks()

    def get_tasks_categories(self):
        return self.task_categories_repository.get_tasks_categories()

    def get_task_instructions(self, task_id: int):
        instructions = self.task_repository.get_task_instructions(
            task_id
        ).general_instructions
        try:
            return literal_eval(instructions)
        except Exception as e:
            print(e)
            return {}

    def update_task_instructions(self, task_id: int, instructions: dict):
        return self.task_repository.update_task_instructions(task_id, instructions)

    def get_tasks_with_samples_created_by_user(self, user_id: int):
        return self.task_repository.get_tasks_with_samples_created_by_user(user_id)

    def get_active_tasks_by_user_id(self, user_id: int):
        tasks_with_models_activity = self.model_repository.get_active_tasks_by_user_id(
            user_id
        )
        tasks_with_examples_activity = (
            self.example_repository.get_active_tasks_by_user_id(user_id)
        )
        tasks_with_validation_activity = (
            self.validation_repository.get_active_tasks_by_user_id(user_id)
        )
        active_tasks = list(
            tasks_with_models_activity
            + tasks_with_examples_activity
            + tasks_with_validation_activity
        )
        active_tasks = [task[0] for task in active_tasks]
        all_tasks = self.get_active_tasks_with_round_info()
        active_tasks = [task for task in all_tasks if task["id"] in active_tasks]
        return active_tasks

    def check_signed_consent(self, task_id: int, user_id: int):
        if self.historical_task_repository.check_signed_consent(task_id, user_id):
            return True
        return False

    def sign_in_consent(self, task_id: int, user_id: int):
        return self.historical_task_repository.save_historical_data(
            task_id, user_id, "consent"
        )

    def update_config_yaml(self, task_id: int, config_yaml: str):
        return self.task_repository.update_config_yaml(task_id, config_yaml)

    def allow_update_dynalab_submissions(self, task_id: int, user_id: int):
        dynalab_threshold = self.task_repository.get_dynalab_threshold(
            task_id
        ).dynalab_threshold
        hr_diff = self.task_repository.get_dynalab_hr_diff(task_id)
        amount_of_models_uploaded_in_hr_diff = (
            self.model_repository.get_amount_of_models_uploaded_in_hr_diff(
                task_id, user_id, hr_diff
            )
        )
        return amount_of_models_uploaded_in_hr_diff < dynalab_threshold

    def download_logs(self, task_id: str, local_dir: str):
        remote_file = os.getenv(f"REMOTE_FILE_TASK_{task_id}")
        os.makedirs(local_dir, exist_ok=True)
        local_file_path = os.path.join(local_dir, os.path.basename(remote_file))
        with open(local_file_path, "w"):
            pass
        protocol = SecureCopyProtocol(self.server_ssh, self.build_eval_server_pem)
        file_log = protocol.copy_pipeline(remote_file, local_file_path)
        return file_log
