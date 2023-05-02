# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import numpy as np

from app.domain.services.base.dataset import DatasetService
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.score import ScoreRepository
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.user import UserRepository


class ScoreService:
    def __init__(self):
        self.score_repository = ScoreRepository()
        self.task_repository = TaskRepository()
        self.dataset_service = DatasetService()
        self.model_repository = ModelRepository()
        self.user_repository = UserRepository()

    def get_scores_by_dataset_and_model_id(
        self,
        scores_by_dataset_and_model_id: list,
        order_metric_with_weight: dict,
        perf_metric_field_name: str,
    ):

        scores_by_dataset_and_model_id[
            perf_metric_field_name
        ] = scores_by_dataset_and_model_id.pop("perf")
        metrics_with_score_and_weight = [
            {col: row[col] for col in ["field_name", "weight"]}
            for row in order_metric_with_weight
        ]
        for metric_with_score_and_weight in metrics_with_score_and_weight:
            score = scores_by_dataset_and_model_id[
                metric_with_score_and_weight["field_name"]
            ]
            metric_with_score_and_weight["score"] = score
        return metrics_with_score_and_weight

    def get_score_info_by_dataset_and_model_id(
        self,
        dataset_id: int,
        model_id: int,
        order_metric_with_weight: dict,
        perf_metric_field_name: str,
    ):
        scores_by_dataset_and_model_id = (
            self.score_repository.get_scores_by_dataset_and_model_id(
                dataset_id, model_id
            )[0]
        ).__dict__
        final_scores_by_dataset_and_model_id = {}
        dataset_id = scores_by_dataset_and_model_id["did"]
        dataset_name = self.dataset_service.get_dataset_name_by_id(dataset_id)[0]
        final_scores_by_dataset_and_model_id["id"] = dataset_id
        final_scores_by_dataset_and_model_id["name"] = dataset_name
        metrics_with_score_and_weight = self.get_scores_by_dataset_and_model_id(
            scores_by_dataset_and_model_id,
            order_metric_with_weight,
            perf_metric_field_name,
        )
        scores = [
            metric_score["score"] for metric_score in metrics_with_score_and_weight
        ]
        final_scores_by_dataset_and_model_id["scores"] = scores
        final_scores_by_dataset_and_model_id["variances"] = [0] * len(scores)
        return final_scores_by_dataset_and_model_id

    def get_dynaboard_info_for_all_the_models(
        self,
        model_ids: list,
        order_scoring_datasets_with_weight: list,
        order_metric_with_weight: dict,
        perf_metric_field_name: str,
    ):
        models_dynaboard_info = []
        for model_id in model_ids:
            model_dynaboard_info = self.get_model_dynaboard_info(
                model_id,
                order_scoring_datasets_with_weight,
                order_metric_with_weight,
                perf_metric_field_name,
            )
            models_dynaboard_info.append(model_dynaboard_info)
        return models_dynaboard_info

    def get_model_dynaboard_info(
        self,
        model_id: int,
        order_scoring_datasets_with_weight: list,
        order_metric_with_weight: dict,
        perf_metric_field_name: str,
    ) -> dict:
        model_dynaboard_info = {}
        datasets_id = [dataset["did"] for dataset in order_scoring_datasets_with_weight]
        model_dynaboard_info["model_id"] = model_id
        model_dynaboard_info["model_name"] = self.model_repository.get_model_name_by_id(
            model_id
        )[0]
        user_id = self.model_repository.get_user_id_by_model_id(model_id)[0]
        model_dynaboard_info["uid"] = user_id
        model_dynaboard_info["username"] = self.user_repository.get_user_name_by_id(
            user_id
        )[0]
        datasets_info = []
        for dataset_id in datasets_id:
            dataset_info = self.get_score_info_by_dataset_and_model_id(
                dataset_id, model_id, order_metric_with_weight, perf_metric_field_name
            )
            datasets_info.append(dataset_info)
        averaged_scores = self.get_averaged_scores(
            datasets_info, order_scoring_datasets_with_weight
        )
        model_dynaboard_info["datasets"] = datasets_info
        model_dynaboard_info["averaged_scores"] = averaged_scores
        model_dynaboard_info["averaged_variances"] = [0] * len(averaged_scores)
        model_dynaboard_info["dynascore"] = 0
        return model_dynaboard_info

    def get_averaged_scores(self, datasets_info: list, weights: list) -> list:
        datasets_info = sorted(datasets_info, key=lambda i: i["id"])
        weights = sorted(weights, key=lambda i: i["did"])
        scores = [dataset_info["scores"] for dataset_info in datasets_info]
        weights = [weight["weight"] for weight in weights]
        averaged_scores = np.array(scores).T
        return list(np.dot(averaged_scores, weights))

    def calculate_dynascore(
        self,
        perf_metric_field_name: str,
        averaged_dataset_results: dict,
        weights: dict,
        direction_multipliers: dict,
        offsets: dict,
        delta_cutoff_proportion=0.0001,
    ):
        metrics = list(averaged_dataset_results)
        for metric in metrics:
            averaged_dataset_results[metric] = (
                direction_multipliers[metric] * averaged_dataset_results[metric]
                + offsets[metric]
            )
        averaged_dataset_results["dynascore"] = 0

        denominator = sum(weights.values())
        for key in weights:
            weights[key] /= denominator

        delta = averaged_dataset_results.diff()
        delta_threshold = (
            averaged_dataset_results[perf_metric_field_name].max()
            * delta_cutoff_proportion
        )
        satisfied_indices = []
        for index in range(len(delta[perf_metric_field_name])):
            if abs(delta[perf_metric_field_name][index]) > delta_threshold:
                satisfied_indices.append(index)

        for metric in metrics:
            AMRS = (
                delta[metric][satisfied_indices].abs()
                / delta[perf_metric_field_name][satisfied_indices]
            ).mean(skipna=True)
            averaged_dataset_results[metric] = averaged_dataset_results[metric] / abs(
                AMRS
            )
            averaged_dataset_results["dynascore"] += averaged_dataset_results[
                metric
            ] * weights.get(metric, 0)

        return averaged_dataset_results

    def get_maximun_principal_score_per_task(self, task_id: int) -> float:
        scoring_datasets = self.dataset_service.get_scoring_datasets_by_task_id(task_id)
        scoring_datasets = [dataset["id"] for dataset in scoring_datasets]
        scores = self.score_repository.get_maximun_principal_score_per_task(
            task_id, scoring_datasets
        )
        if scores:
            return scores
        else:
            return {"perf": 0.00}
