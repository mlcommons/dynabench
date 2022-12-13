# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import pandas as pd

from app.infrastructure.repositories.score import ScoreRepository
from app.infrastructure.repositories.task import TaskRepository


class ScoreService:
    def __init__(self):
        self.score_repository = ScoreRepository()
        self.task_repository = TaskRepository()

    def get_dynaboard_score_by_task_id(
        self,
        task_id: int,
        perf_metric_field_name: str,
        order_metric_with_weight: list,
        order_datasets_with_weight: list,
        sort_by: str = "dynascore",
        sort: str = "desc",
        limit: int = 10,
        offset: int = 0,
    ):
        unpublished_models_in_leaderboard = (
            self.task_repository.get_unpublished_models_in_leaderboard(task_id)
        )
        unpublished_models_in_leaderboard = unpublished_models_in_leaderboard[0]
        ordered_datasets_id = [
            did_and_weight["did"] for did_and_weight in order_datasets_with_weight
        ]
        scores_users_dataset_and_model_info = (
            self.score_repository.get_scores_users_dataset_and_model_by_task_id(
                task_id, ordered_datasets_id, unpublished_models_in_leaderboard
            )
        )
        scores, users, datasets, models = zip(*scores_users_dataset_and_model_info)
        scores, users, datasets, models = (
            set(scores),
            set(users),
            set(datasets),
            set(models),
        )
        order_datasets = sorted(datasets, key=lambda dataset: dataset.__dict__["id"])
        model_id_to_unique_dataset_ids = {}
        for score in scores:
            if score.__dict__["mid"] in model_id_to_unique_dataset_ids:
                model_id_to_unique_dataset_ids[score.__dict__["mid"]].add(
                    score.__dict__["did"]
                )
            else:
                model_id_to_unique_dataset_ids[score.__dict__["mid"]] = {
                    score.__dict__["did"]
                }
        filtered_scores = []
        for score in scores:
            if model_id_to_unique_dataset_ids.get(score.__dict__["mid"], set()) == set(
                ordered_datasets_id
            ):
                filtered_scores.append(score)
        filtered_models = []
        for model in models:
            if model_id_to_unique_dataset_ids.get(model.__dict__["id"], set()) == set(
                ordered_datasets_id
            ):
                filtered_models.append(model)

        # TODO: more refactoring
        model_id_and_dataset_id_to_scores = {}
        for filter_score in filtered_scores:
            model_id_and_dataset_id_to_scores[
                (filter_score.__dict__.get("mid"), filter_score.__dict__.get("did"))
            ] = filter_score
        dataset_results_dict = {}
        for order_dataset in order_datasets:
            dataset_results_dict[order_dataset.__dict__.get("id")] = {
                metric_info["field_name"]: []
                for metric_info in order_metric_with_weight
            }
            for model in models:
                score = model_id_and_dataset_id_to_scores[
                    (model.__dict__.get("id"), order_dataset.__dict__.get("id"))
                ]
                for field_name in dataset_results_dict[
                    order_dataset.__dict__.get("id")
                ]:
                    result = score.__dict__.get(field_name, None)
                    dataset_results_dict[order_dataset.__dict__.get("id")][
                        field_name
                    ].append(result)

        datasets_id_with_weight = {
            did_and_weight["did"]: did_and_weight["weight"]
            for did_and_weight in order_datasets_with_weight
        }
        for key, value in dataset_results_dict.items():
            df = pd.DataFrame.from_dict(value)
            dataset_results_dict[key] = df
            averaged_dataset_results = datasets_id_with_weight[key] * df

        converted_dataset_results = self.calculate_dynascore(
            perf_metric_field_name,
            averaged_dataset_results,
            weights={
                metric_info["field_name"]: metric_info["weight"]
                for metric_info in order_metric_with_weight
            },
            direction_multipliers={
                metric_info["field_name"]: metric_info["utility_direction"]
                for metric_info in order_metric_with_weight
            },
            offsets={
                metric_info["field_name"]: metric_info["offset"]
                for metric_info in order_metric_with_weight
            },
        )

        # All the re factoring is still needed
        uid_to_username = {}
        for user in users:
            uid_to_username[user.__dict__.get("id")] = user.__dict__.get("username")
        data_list = []
        model_index = 0
        ordered_metric_field_names = [
            metric_info["field_name"] for metric_info in order_metric_with_weight
        ]
        for model in models:
            datasets_list = []
            for dataset in datasets:
                scores = []
                for field_name in ordered_metric_field_names:
                    scores.append(
                        dataset_results_dict[dataset.id][field_name][model_index]
                    )
                variances = [0] * len(scores)  # TODO
                datasets_list.append(
                    {
                        "id": dataset.__dict__.get("id"),
                        "name": dataset.__dict__.get("name"),
                        "scores": scores,
                        "variances": variances,
                    }
                )
            averaged_scores = []
            for field_name in ordered_metric_field_names:
                averaged_scores.append(
                    averaged_dataset_results[field_name][model_index]
                )
            averaged_variances = [0] * len(averaged_scores)  # TODO
            dynascore = converted_dataset_results["dynascore"][model_index]
            data_list.append(
                {
                    "model_id": model.__dict__.get("id"),
                    "model_name": model.name if model.is_published else None,
                    # Don't give away the users for unpublished models.
                    "uid": model.__dict__.get("uid")
                    if model.__dict__.get("is_published")
                    and not model.__dict__.get("is_anonymous")
                    else None,
                    "username": uid_to_username[model.__dict__.get("uid")]
                    if model.is_published and not model.is_anonymous
                    else None,
                    "averaged_scores": averaged_scores,
                    "averaged_variances": averaged_variances,
                    "dynascore": dynascore,
                    "dynavariance": 0,
                    "datasets": datasets_list,
                }
            )
            model_index += 1

        ordered_metric_pretty_names = [
            metric_info["pretty_name"] for metric_info in order_metric_with_weight
        ]
        if sort_by == "dynascore":
            data_list.sort(reverse=sort, key=lambda model: model["dynascore"])
        elif sort_by in ordered_metric_pretty_names:
            data_list.sort(
                reverse=sort,
                key=lambda model: model["averaged_scores"][
                    ordered_metric_pretty_names.index(sort_by)
                ],
            )
        elif sort_by == "model_name":
            data_list.sort(reverse=sort, key=lambda model: model["model_name"])

        return {"result": data_list}

    def calculate_dynascore(
        self,
        perf_metric_field_name: str,
        averaged_dataset_results: pd.DataFrame,
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
