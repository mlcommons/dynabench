# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os

import boto3
import numpy as np
import pandas as pd

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
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")

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
            if metric_with_score_and_weight["field_name"] in [
                "examples_per_second",
                "memory_utilization",
            ]:
                score = scores_by_dataset_and_model_id[
                    metric_with_score_and_weight["field_name"]
                ]
                metric_with_score_and_weight["score"] = score
            else:
                score = json.loads(scores_by_dataset_and_model_id["metadata_json"])[
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
        dataset_has_downstream = self.dataset_service.get_dataset_has_downstream(
            dataset_id
        )[0]
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
        if dataset_has_downstream:
            downstream_info = self.get_score_info_by_downstream_task(
                dataset_id, model_id, order_metric_with_weight
            )
            final_scores_by_dataset_and_model_id["downstream_info"] = downstream_info
            mean_dataset_score = [
                sum(scores) / len(downstream_info)
                for scores in zip(*(item["score"] for item in downstream_info))
            ]
            final_scores_by_dataset_and_model_id["scores"] = mean_dataset_score
        return final_scores_by_dataset_and_model_id

    def get_score_info_by_downstream_task(
        self, dataset_id: int, model_id: int, order_metric_with_weight: dict
    ):
        downstream_scores = self.score_repository.get_downstream_scores(
            dataset_id, model_id
        )
        downstream_info = []
        for downstream_score in downstream_scores:
            downstream_score = downstream_score.__dict__
            downstream_info_metadata = json.loads(
                downstream_score["metadata_json"].replace("“", '"').replace("”", '"')
            )
            field_scores_names = [
                item["field_name"] for item in order_metric_with_weight
            ]
            scores = []
            for field_score_name in field_scores_names:
                scores.append(downstream_info_metadata[field_score_name])
            downstream_info.append(
                {"sub_task": downstream_info_metadata["sub_task"], "score": scores}
            )
        return downstream_info

    def get_dynaboard_info_for_all_the_models(
        self,
        model_ids: list,
        order_scoring_datasets_with_weight: list,
        order_metric_with_weight: dict,
        perf_metric_field_name: list,
        sort_by: str,
        sort_direction: str,
        offset: int,
        limit: int,
        metrics: list,
        perf_metric_info: dict,
    ):
        models_dynaboard_info = []
        for model_id in model_ids:
            (
                model_dynaboard_info,
                order_metric_with_weight,
            ) = self.get_model_dynaboard_info(
                model_id,
                order_scoring_datasets_with_weight,
                order_metric_with_weight,
                perf_metric_field_name,
            )
            models_dynaboard_info.append(model_dynaboard_info)
        df_dynascore = self.calculate_all_dynascores(
            models_dynaboard_info, order_metric_with_weight, perf_metric_field_name
        )
        df_dynascore = df_dynascore.sort_index()
        df_dynascore.fillna(0, inplace=True)
        models_ids = [data_dict["model_id"] for data_dict in models_dynaboard_info]
        df_dynascore["model_id"] = models_ids
        models_dynaboard_info = [
            {
                **d,
                "dynascore": df_dynascore[df_dynascore["model_id"] == d["model_id"]][
                    "dynascore"
                ].iloc[0],
            }
            for d in models_dynaboard_info
            if df_dynascore["model_id"].isin([d["model_id"]]).any()
        ]

        # Sort
        if isinstance(perf_metric_info, list):
            perf_metric_info = perf_metric_info[0]
        utility_direction = perf_metric_info.get("utility_direction", None)
        if utility_direction == -1:
            sort_direction = "desc" if sort_direction == "asc" else "asc"
        if sort_by != "dynascore":
            models_dynaboard_info = sorted(
                models_dynaboard_info,
                key=lambda x: x["averaged_scores"][metrics.index(sort_by)],
                reverse=(sort_direction == "desc"),
            )
        else:
            models_dynaboard_info = sorted(
                models_dynaboard_info,
                key=lambda x: x["dynascore"],
                reverse=(sort_direction == "desc"),
            )
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
        return model_dynaboard_info, order_metric_with_weight

    def get_averaged_scores(self, datasets_info: list, weights: list) -> list:
        datasets_info = sorted(datasets_info, key=lambda i: i["id"])
        weights = sorted(weights, key=lambda i: i["did"])
        scores = [dataset_info["scores"] for dataset_info in datasets_info]
        weights = [weight["weight"] for weight in weights]
        averaged_scores = np.array(scores).T
        return list(np.dot(averaged_scores, weights))

    def calculate_all_dynascores(
        self, models_dynaboard_info, order_metric_with_weight, perf_metric_field_name
    ):
        averaged_scores_list = [
            data_dict["averaged_scores"] for data_dict in models_dynaboard_info
        ]
        columns = [
            metric_info["field_name"] for metric_info in order_metric_with_weight
        ]
        df_scores = pd.DataFrame(averaged_scores_list, columns=columns)

        weights_dict = {
            metric_info["field_name"]: metric_info["weight"]
            for metric_info in order_metric_with_weight
        }
        direction_multipliers = {
            metric_info["field_name"]: metric_info["utility_direction"]
            for metric_info in order_metric_with_weight
        }
        offsets = {
            metric_info["field_name"]: metric_info["offset"]
            for metric_info in order_metric_with_weight
        }
        return self.calculate_dynascore(
            perf_metric_field_name,
            df_scores,
            weights_dict,
            direction_multipliers,
            offsets,
        )

    def calculate_dynascore(
        self,
        perf_metric_field_name: str,
        data,
        weights: dict,
        direction_multipliers: dict,
        offsets: dict,
        delta_cutoff_proportion=0.0001,
    ):
        converted_data = data.copy(deep=True)
        converted_data.sort_values(perf_metric_field_name, inplace=True)
        for metric in list(data):
            converted_data[metric] = (
                direction_multipliers[metric] * converted_data[metric] + offsets[metric]
            )
        converted_data["dynascore"] = 0

        denominator = sum(weights.values())
        for key in weights:
            weights[key] /= denominator

        delta = converted_data.diff()
        delta_threshold = (
            converted_data[perf_metric_field_name].max() * delta_cutoff_proportion
        )
        satisfied_indices = []
        for index in range(len(delta[perf_metric_field_name])):
            if abs(delta[perf_metric_field_name][index]) > delta_threshold:
                satisfied_indices.append(index)
        for metric in list(data):
            AMRS = (
                delta[metric][satisfied_indices].abs()
                / delta[perf_metric_field_name][satisfied_indices]
            ).mean(skipna=True)
            converted_data[metric] = converted_data[metric] / abs(AMRS)
            converted_data["dynascore"] += converted_data[metric] * weights.get(
                metric, 0
            )
        return converted_data

    def get_maximun_principal_score_by_task(self, task_id: int) -> float:
        scoring_datasets = self.dataset_service.get_scoring_datasets_by_task_id(task_id)
        scoring_datasets = [dataset["id"] for dataset in scoring_datasets]
        scores = self.score_repository.get_maximun_principal_score_by_task(
            task_id, scoring_datasets
        )
        if scores:
            return scores
        else:
            return {"perf": 0.00}

    def verify_scores_for_all_the_datasets(self, model_id: int):
        task_id = self.model_repository.get_task_id_by_model_id(model_id)[0]
        scoring_datasets = self.dataset_service.get_scoring_datasets_by_task_id(task_id)
        scoring_datasets = [item[0] for item in scoring_datasets]
        return self.score_repository.check_if_model_has_all_scoring_datasets(
            model_id, scoring_datasets
        )

    def read_users_score_csv(self, task_id: int):
        s3_bucket = self.task_repository.get_s3_bucket_by_task_id(task_id)[0]
        task_code = self.task_repository.get_task_code_by_task_id(task_id)[0]
        final_file = f"./app/resources/predictions/{task_code}_users_scores.csv"
        self.s3.download_file(
            s3_bucket,
            f"{task_code}/users_scores.csv",
            final_file,
        )
        csv_file = pd.read_csv(final_file)
        csv_file["username"] = csv_file["uid"].apply(
            lambda x: self.user_repository.get_user_name_by_id(x)[0]
        )
        csv_file.drop(columns=["uid"], inplace=True)
        csv_file = csv_file[
            ["username"] + [col for col in csv_file.columns if col != "username"]
        ]
        return csv_file.to_json(orient="records")

    def fix_metrics_with_custom_names(self, model_id: int):
        self.score_repository.fix_matthews_correlation(model_id)
        self.score_repository.fix_f1_score(model_id)
