# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import yaml

from app.domain.services.base.score import ScoreService
from app.domain.services.builder_and_evaluation.eval_utils.instance_property import (
    instance_property,
)
from app.domain.services.builder_and_evaluation.eval_utils.metrics_dicts import (
    meta_metrics_dict,
)
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.task import TaskRepository


class TaskService:
    def __init__(self):
        self.task_repository = TaskRepository()
        self.dataset_repository = DatasetRepository()
        self.score_services = ScoreService()

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
        for i, round in enumerate(rounds):
            tasks[i]["round"] = dict(round)
        return tasks

    def get_metric_weight(self, field_name, perf_metric_field_name, default_weights):
        default_weight = default_weights.get(field_name)
        if default_weight is not None:
            return default_weight

        if field_name == perf_metric_field_name:
            return 4
        return 1

    def get_dataset_weight(self):
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
            scoring_dataset["default_weight"] = self.get_dataset_weight()
        return scoring_datasets

    def get_order_metrics_by_task_id(self, task_id: int):
        task_info = self.task_repository.get_task_info_by_task_id(task_id).__dict__
        task_configuration = yaml.load(task_info.get("config_yaml"), yaml.SafeLoader)
        perf_metric_type = task_configuration.get("perf_metric", [])
        delta_perf_metrics_type = [
            obj["type"] for obj in task_configuration.get("delta_metrics", [])
        ]
        aws_metric_names = instance_property.get(
            task_info.get("instance_type"), None
        ).get("aws_metrics", [])
        ordered_metric_field_names = (
            [perf_metric_type["type"]] + delta_perf_metrics_type + aws_metric_names
        )
        metrics_metadata = {
            metric: meta_metrics_dict.get(
                metric, meta_metrics_dict[perf_metric_type["type"]]
            )(task_info)
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
        return task

    def get_task_id_by_task_code(self, task_code: str):
        return self.task_repository.get_task_id_by_task_code(task_code).id

    def get_perf_metric_field_name_by_task_id(self, task_id: int):
        task_info = self.task_repository.get_task_info_by_task_id(task_id).__dict__
        task_configuration = yaml.load(task_info.get("config_yaml"), yaml.SafeLoader)
        return task_configuration["perf_metric"]["type"]

    def get_dynaboard_info_by_task_id(
        self,
        task_id: int,
        ordered_metric_weights: list,
        ordered_scoring_dataset_weights: list,
        sort_by: str = "id",
        sort_direction: str = "asc",
        offset: int = 0,
        limit: int = 5,
    ):
        ordered_metrics = self.get_order_metrics_by_task_id(task_id)
        ordered_scoring_datasets = self.get_order_scoring_datasets_by_task_id(task_id)
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
        perf_metric_field_name = self.get_perf_metric_field_name_by_task_id(task_id)
        return self.score_services.get_dynaboard_score_by_task_id(
            task_id,
            perf_metric_field_name,
            order_metric_with_weight,
            order_scoring_datasets_with_weight,
            sort_by,
            sort_direction,
            offset,
            limit,
        )

    def get_task_trends_score(self, task_id: int, dataset_id: int):
        task_info = self.get_task_with_round_and_dataset_info(task_id)
        return task_info

    def get_active_dataperf_tasks(self):
        return self.task_repository.get_active_dataperf_tasks()
