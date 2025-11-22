# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import random
import secrets
from ast import literal_eval
from typing import Union

import boto3
import yaml
from fastapi import HTTPException

from app.domain.services.base.score import ScoreService
from app.domain.services.builder_and_evaluation.eval_utils.instance_property import (
    instance_property,
)
from app.domain.services.builder_and_evaluation.eval_utils.metrics_dicts import (
    meta_metrics_dict,
)
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.example import ExampleRepository
from app.infrastructure.repositories.historical_data import HistoricalDataRepository
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.round import RoundRepository
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.taskcategories import TaskCategoriesRepository
from app.infrastructure.repositories.taskuserpermission import (
    TaskUserPermissionRepository,
)
from app.infrastructure.repositories.user import UserRepository
from app.infrastructure.repositories.validation import ValidationRepository


class TaskService:
    def __init__(self):
        self.task_repository = TaskRepository()
        self.dataset_repository = DatasetRepository()
        self.model_repository = ModelRepository()
        self.example_repository = ExampleRepository()
        self.score_services = ScoreService()
        self.round_repository = RoundRepository()
        self.task_categories_repository = TaskCategoriesRepository()
        self.user_repository = UserRepository()
        self.validation_repository = ValidationRepository()
        self.historical_task_repository = HistoricalDataRepository()
        self.task_user_permission_repository = TaskUserPermissionRepository()
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")

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
        filtered: str = None,
    ):
        dynaboard_info = {}
        ordered_metrics = self.get_order_metrics_by_task_id(task_id)
        ordered_scoring_datasets = self.get_order_scoring_datasets_by_task_id(task_id)
        task_info = self.get_task_info_by_task_id(task_id).__dict__
        task_configuration = yaml.load(task_info.get("config_yaml"), yaml.SafeLoader)
        perf_metric_info = task_configuration.get("perf_metric", {})
        filtered_by = None
        if filtered:
            leaderboard_config = task_configuration.get("leaderboard", {})
            filtered_by = leaderboard_config.get("key", None)
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
            filtered,
            filtered_by,
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

    def check_preliminary_questions_done(self, task_id: int, user_id: int):
        if self.historical_task_repository.check_preliminary_questions_done(
            task_id, user_id
        ):
            return True
        return False

    def sign_in_consent(self, task_id: int, user_id: int):
        return self.historical_task_repository.save_historical_data(
            task_id, user_id, "consent"
        )

    def save_preliminary_questions(
        self, task_id: int, user_id: int, preliminary_questions: dict
    ):
        return self.historical_task_repository.save_historical_data(
            task_id, user_id, json.dumps(preliminary_questions)
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

    def download_logs(self, task_id: str):
        filename = os.getenv(f"REMOTE_LOG_PATH_{task_id}")
        if not os.path.exists(filename):
            raise HTTPException(status_code=404, detail="File not found")
        return filename

    def get_config_file_by_task_id(self, task_id: int):
        return self.task_repository.get_config_file_by_task_id(task_id)

    def get_random_provider_and_model_info(self, task_id: int, user_id: int):
        yaml_file = self.task_repository.get_config_file_by_task_id(task_id)[0]
        yaml_file = yaml.safe_load(yaml_file)
        providers = yaml_file["context"]["generative_context"]["artifacts"].get(
            "providers", None
        )
        provider = random.choice(list(providers))
        if providers is None:
            return {"model": "", "provider": None}

        is_unique = yaml_file["context"]["generative_context"].get("is_unique", False)
        if is_unique:
            model_names = [
                model[0]
                for model in self.example_repository.get_used_models_by_user_id_and_task_id(
                    user_id, task_id
                )
            ]
            model_names = list(set(model_names))
            available_models = [
                model_config
                for model_config in providers[provider]
                if model_config["model_name"] not in model_names
            ]
            if len(available_models) == 0:
                return {"model": "", "provider": None}
            model = random.choice(available_models)
        else:
            model = random.choice(providers[provider])
        return {"model": model, "provider": provider}

    def get_task_consent(self, task_id: int):
        yaml_file = self.task_repository.get_config_file_by_task_id(task_id)[0]
        yaml_file = yaml.safe_load(yaml_file)
        consent_URI = yaml_file["context"]["generative_context"]["artifacts"].get(
            "consent_uri", None
        )
        if consent_URI is None:
            return {"consent_terms": None, "agree_text": None, "disagree_text": None}

        s3_bucket = consent_URI.split("/")[2]
        key = "/".join(consent_URI.split("/")[3:])
        consent_file = self.s3.get_object(Bucket=s3_bucket, Key=key)

        consent_file = json.loads(consent_file["Body"].read())

        return consent_file

    def get_tasks(self, exclude_hidden: bool = True):
        filters = {
            "hidden": int(not exclude_hidden),
        }
        tasks = self.task_repository.get_tasks_current_round(filters)
        converted_tasks = []
        flag = 0
        for task, round_obj in tasks:
            task_dict = {
                **{k: v for k, v in task.__dict__.items() if not k.startswith("_")},
                "round": {
                    k: v for k, v in round_obj.__dict__.items() if not k.startswith("_")
                },
            }
            converted_tasks.append(task_dict)
            if flag < 1:
                print("task_dict", task_dict)
                flag += 1
        return converted_tasks

    def get_task_with_round_and_metric_data(self, task_id_or_code: Union[int, str]):
        try:
            task, round_obj = self.task_repository.get_task_with_round_info(
                task_id_or_code
            )

            datasets = self.dataset_repository.get_order_datasets_by_task_id(task.id)
            dataset_list = []
            scoring_dataset_list = []
            for dataset in datasets:
                dataset_list.append({"id": dataset.id, "name": dataset.name})
                if dataset.access_type == "scoring":
                    scoring_dataset_list.append(
                        {
                            "id": dataset.id,
                            "name": dataset.name,
                            "default_weight": self.get_dataset_weight(dataset.id),
                        }
                    )
            dataset_list.sort(key=lambda dataset: dataset["id"])
            scoring_dataset_list.sort(key=lambda dataset: dataset["id"])

            task_dict = task.__dict__
            round_dict = round_obj.__dict__
            task_dict["ordered_scoring_datasets"] = scoring_dataset_list
            task_dict["ordered_datasets"] = dataset_list
            config = yaml.load(task_dict["config_yaml"], yaml.SafeLoader)
            if "perf_metric" in config:
                if isinstance(config["perf_metric"], list):
                    principal_metric = config["perf_metric"][0]
                    task_dict["perf_metric_field_name"] = principal_metric["type"]
                elif isinstance(config["perf_metric"], dict):
                    task_dict["perf_metric_field_name"] = config["perf_metric"]["type"]
                metrics_meta, ordered_field_names = self.get_task_metrics_meta(
                    task_dict
                )
                print("ordered_field_names", ordered_field_names)
                ordered_metrics = [
                    dict(
                        {
                            "name": metrics_meta[field_name]["pretty_name"],
                            "field_name": field_name,
                            "default_weight": self.get_metric_weight(
                                field_name,
                                task_dict.get("perf_metric_field_name"),
                                config.get("aggregation_metric", {}).get(
                                    "default_weights", {-1: 1}
                                ),
                            ),
                        },
                        **metrics_meta[field_name],
                    )
                    for field_name in ordered_field_names
                ]

                task_dict["ordered_metrics"] = ordered_metrics
            task_dict["round"] = round_dict
            return task_dict
        except Exception:
            return False

    def get_task_metrics_meta(self, task):
        task_config = yaml.load(task["config_yaml"], yaml.SafeLoader)
        if isinstance(task_config["perf_metric"], list):
            perf_metric_type = [obj["type"] for obj in task_config["perf_metric"]]
        elif isinstance(task_config["perf_metric"], dict):
            perf_metric_type = [task_config["perf_metric"]["type"]]
        delta_metric_types = [
            obj["type"] for obj in task_config.get("delta_metrics", [])
        ]
        aws_metric_names = instance_property.get(task.get("instance_type"), {}).get(
            "aws_metrics", []
        )
        principal_metric = perf_metric_type[0]

        # TODO: make it possible to display some modes with aws metrics and some
        # models without aws metrics on the same leaderboard?
        if task.get("predictions_upload", False) or "train_file_metric" in task_config:
            aws_metric_names = []
        ordered_metric_field_names = (
            perf_metric_type + aws_metric_names + delta_metric_types
        )
        metrics_meta = {
            metric: meta_metrics_dict.get(metric, meta_metrics_dict[principal_metric])(
                task
            )
            for metric in ordered_metric_field_names
        }
        return metrics_meta, ordered_metric_field_names

    def get_task_trends(self, task_id: int):
        """
        Get top perform models and its round wise performance metrics at task level
        It will fetch only top 10 models and its round wise performance metrics
        :param tid: Task id
        :return: Json Object
        """
        task_dict = self.get_task_with_round_and_metric_data(task_id)
        ordered_metric_and_weight = list(
            map(
                lambda metric: dict({"weight": metric["default_weight"]}, **metric),
                task_dict["ordered_metrics"],
            )
        )
        ordered_did_and_weight = list(
            map(
                lambda dataset: dict(
                    {"weight": dataset["default_weight"], "did": dataset["id"]},
                    **dataset,
                ),
                task_dict["ordered_scoring_datasets"],
            )
        )
        dynaboard_response = self.score_services.get_dynaboard_by_task(
            task_id,
            task_dict.get("unpublished_models_in_leaderboard"),
            task_dict.get("perf_metric_field_name"),
            ordered_metric_and_weight,
            ordered_did_and_weight,
            "dynascore",
            True,
            10,
            0,
        )
        mid_and_rid_to_perf = {}
        did_to_rid = {}
        for dataset in self.dataset_repository.get_all():
            did_to_rid[dataset.id] = dataset.rid
        rid_to_did_to_weight = {}
        for did_and_weight in ordered_did_and_weight:
            rid = did_to_rid[did_and_weight["did"]]
            if rid in rid_to_did_to_weight:
                rid_to_did_to_weight[rid][did_and_weight["did"]] = did_and_weight[
                    "weight"
                ]
            else:
                rid_to_did_to_weight[rid] = {
                    did_and_weight["did"]: did_and_weight["weight"]
                }
        mid_to_name = {}
        for model in self.model_repository.get_all():
            mid_to_name[model.id] = model.name

        if isinstance(dynaboard_response, tuple):
            dynaboard_response = dynaboard_response[0]

        for model_results in dynaboard_response["data"]:
            for dataset_results in model_results["datasets"]:
                rid = did_to_rid[dataset_results["id"]]
                if rid != 0:
                    ordered_metric_field_names = list(
                        map(
                            lambda metric: metric["field_name"],
                            task_dict["ordered_metrics"],
                        )
                    )
                    perf = dataset_results["scores"][
                        ordered_metric_field_names.index(
                            task_dict["perf_metric_field_name"]
                        )
                    ]
                    mid_and_rid = (model_results["model_id"], rid)
                    # Weighting is needed in case there are multiple scoring
                    # datasets for the same round.
                    weighted_perf = (
                        perf
                        * rid_to_did_to_weight[rid][dataset_results["id"]]
                        / sum(rid_to_did_to_weight[rid].values())
                    )
                    if mid_and_rid in mid_and_rid_to_perf:
                        mid_and_rid_to_perf[
                            (model_results["model_id"], rid)
                        ] += weighted_perf
                    else:
                        mid_and_rid_to_perf[
                            (model_results["model_id"], rid)
                        ] = weighted_perf
        query_result = []
        for (mid, rid), perf in mid_and_rid_to_perf.items():
            query_result.append(
                {
                    "model_id": mid,
                    "model_name": mid_to_name[mid],
                    "performance": perf,
                    "round_id": rid,
                }
            )

        response_obj = {}
        for result in query_result:
            round_id = result["round_id"]
            model_key = f"{result['model_name']}_{result['model_id']}"

            if round_id in response_obj:
                response_obj[round_id][model_key] = result["performance"]
            else:
                response_obj[round_id] = {
                    "round": round_id,
                    model_key: result["performance"],
                }

        return (
            sorted(list(response_obj.values()), key=lambda x: x["round"])
            if response_obj
            else []
        )

    def update_task(self, task_id, data):
        for field in data:
            if field not in (
                "unpublished_models_in_leaderboard",
                "validate_non_fooling",
                "num_matching_validations",
                "instructions_md",
                "predictions_upload_instructions_md",
                "train_file_upload_instructions_md",
                "mlcube_tutorial_markdown",
                "dynamic_adversarial_data_collection",
                "dynamic_adversarial_data_validation",
                "hidden",
                "submitable",
                "create_endpoint",
                "build_sqs_queue",
                "eval_sqs_queue",
                "is_decen_task",
                "task_aws_account_id",
                "task_gateway_predict_prefix",
                "config_yaml",
                "context",
                "leaderboard_description",
            ):
                raise HTTPException(
                    status_code=403, detail=f"Field {field} cannot be updated."
                )
        return self.task_repository.update_task(task_id, data)

    def get_task_owners(self, task_id):
        tasks = self.task_user_permission_repository.get_task_owners(task_id)
        users = []
        for user in tasks:
            user_name = self.user_repository.get_user_name_by_id(user["uid"])
            users.append({"user_id": user["uid"], "username": user_name["username"]})
        return users

    def toogle_user_task_permission(self, task_id: int, username: str):
        user_to_toggle = self.user_repository.get_user_by_username(username)

        if (task_id, "owner") in [
            (perm.tid, perm.type) for perm in user_to_toggle.task_permissions
        ]:
            self.task_user_permission_repository.delete_task_user_permission(
                task_id, user_to_toggle.id, "owner"
            )
            print("Removed task owner: " + username)
        else:
            self.task_user_permission_repository.create_user_task_permission(
                task_id, user_to_toggle.id, "owner"
            )
            print("Added task owner: " + username)

        return {"success": "ok"}

    def get_models_in_the_loop(self, task_id: int):
        rounds = self.round_repository.get_rounds_by_task_id(task_id)
        models = self.model_repository.get_models_by_task_id(task_id)
        rid_to_model_identifiers = {}
        for round in rounds:
            model_identifiers = []
            for model in models:
                if model.light_model:
                    if model.is_published and model.deployment_status == "deployed":
                        model_identifiers.append(
                            {
                                "model_name": model.name,
                                "model_id": model.id,
                                "uid": model.uid,
                                "username": model.user.username,
                                "is_in_the_loop": model.is_in_the_loop,
                            }
                        )
            rid_to_model_identifiers[round.rid] = model_identifiers
        return rid_to_model_identifiers

    def create_round(self, task_id: int):
        task = self.task_repository.get_task_info_by_task_id(task_id).__dict__
        self.task_repository.increment_task_round(task_id)
        self.round_repository.add(
            {
                "tid": task_id,
                "rid": task["cur_round"] + 1,
                "secret": secrets.token_hex(),
            }
        )
        return {"success": "ok"}

    def get_model_identifiers(self, task_id):
        models = self.model_repository.get_models_by_task_id(task_id)
        model_identifiers = []
        for model in models:
            model_identifiers.append(
                {
                    "model_name": model.name,
                    "model_id": model.id,
                    "deployment_status": model.deployment_status,
                    "is_published": bool(model.is_published),
                    "uid": model.uid,
                    "username": model.user.username,
                }
            )
        return model_identifiers
