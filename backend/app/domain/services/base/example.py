# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json

import yaml
from pydantic import Json

from app.domain.services.base.context import ContextService
from app.domain.services.base.round import RoundService
from app.domain.services.base.rounduserexampleinfo import RoundUserExampleInfoService
from app.domain.services.base.task import TaskService
from app.domain.services.base.user import UserService
from app.domain.services.base.validation import ValidationService
from app.infrastructure.repositories.example import ExampleRepository


class ExampleService:
    def __init__(self):
        self.example_repository = ExampleRepository()
        self.context_service = ContextService()
        self.task_service = TaskService()
        self.round_service = RoundService()
        self.round_user_example_info = RoundUserExampleInfoService()
        self.user_service = UserService()
        self.validation_service = ValidationService()

    def create_example(
        self,
        context_id: int,
        user_id: int,
        model_wrong: int,
        model_endpoint_name: str,
        input_json: Json,
        output_json: Json,
        metadata: Json,
        tag: str,
    ) -> dict:
        return self.example_repository.create_example(
            context_id,
            user_id,
            model_wrong,
            model_endpoint_name,
            input_json,
            output_json,
            metadata,
            tag,
        )

    def create_example_and_increment_counters(
        self,
        context_id: int,
        user_id: int,
        model_wrong: int,
        model_endpoint_name: str,
        input_json: Json,
        output_json: Json,
        metadata: Json,
        tag: str,
        round_id: int,
        task_id: int,
    ) -> dict:
        new_sample_info = self.create_example(
            context_id,
            user_id,
            model_wrong,
            model_endpoint_name,
            input_json,
            output_json,
            metadata,
            tag,
        )
        self.user_service.increment_examples_created(user_id)
        self.round_service.increment_counter_examples_collected(round_id, task_id)
        self.context_service.increment_counter_total_samples_and_update_date(context_id)
        self.task_service.update_last_activity_date(task_id)
        real_round_id = self.context_service.get_real_round_id(context_id)
        self.round_user_example_info.increment_counter_examples_submitted(
            real_round_id, user_id
        )
        if model_wrong:
            self.round_service.increment_counter_examples_fooled(round_id, task_id)
            self.round_user_example_info.increment_counter_examples_fooled(
                real_round_id, user_id
            )
            self.user_service.increment_examples_fooled(user_id)
        return new_sample_info["id"]

    def get_example_to_validate(
        self,
        real_round_id: int,
        user_id: int,
        num_matching_validations: int,
        validate_non_fooling: bool,
        task_id: int,
    ) -> dict:
        example_necessary_info = {}
        example_to_validate = self.example_repository.get_example_to_validate(
            real_round_id, user_id, num_matching_validations, validate_non_fooling
        )

        example_info = example_to_validate[0].__dict__
        example_necessary_info["example_id"] = example_info["id"]
        example_necessary_info["user_id"] = user_id
        example_necessary_info["task_id"] = task_id
        context_info = example_to_validate[1].__dict__
        metadata_json = json.loads(example_info["metadata_json"])
        input_json = json.loads(example_info["input_json"])
        context_info = json.loads(context_info["context_json"])
        example_necessary_info["context_info"] = {
            **input_json,
            **context_info,
            **metadata_json,
        }
        return example_necessary_info

    def validate_example(
        self,
        example_id: int,
        user_id: int,
        label: str,
        mode: str,
        metadata_json: dict,
        task_id: int,
        validate_non_fooling: bool,
    ):
        self.validation_service.create_validation(
            example_id, user_id, label, mode, metadata_json
        )
        self.task_service.update_last_activity_date(task_id)
        self.example_repository.increment_counter_total_verified(example_id)
        self.user_service.increment_examples_verified(user_id)
        self.example_repository.mark_as_verified(example_id)
        if label == "correct":
            self.example_repository.increment_counter_total_correct(example_id)
            self.user_service.increment_examples_verified_correct(user_id)
            if not validate_non_fooling:
                self.user_service.increment_examples_verified_correct_fooled(user_id)
        elif label == "incorrect":
            self.example_repository.increment_counter_total_incorrect(example_id)
            if not validate_non_fooling:
                self.user_service.increment_examples_verified_incorrect_fooled(user_id)
        elif label == "flag":
            self.example_repository.increment_counter_total_flagged(example_id)
        if not validate_non_fooling:
            self.round_service.increment_counter_examples_verified_fooled(task_id)

    def get_validate_configuration(self, task_id: int) -> dict:
        task_config = self.task_service.get_task_info_by_task_id(task_id)
        config_yaml = yaml.safe_load(task_config.config_yaml)
        context_info = {
            "validation_user_input": config_yaml.get("validation_user_input"),
            "validation_context": config_yaml.get("validation_context"),
        }
        return context_info

    def partially_creation_example_generative(
        self,
        example_info: dict,
        context_id: int,
        user_id: int,
        tag: str,
        round_id: int,
        task_id: int,
    ) -> str:
        return self.create_example_and_increment_counters(
            context_id,
            user_id,
            False,
            None,
            json.dumps(example_info),
            json.dumps({}),
            json.dumps({}),
            tag,
            round_id,
            task_id,
        )

    def update_creation_example_by_creation_id(
        self,
        model_input: dict,
        context_id: int,
        user_id: int,
        tag: str,
        round_id: int,
        task_id: int,
        sandbox_mode: bool,
    ) -> str:
        if not sandbox_mode:
            return self.example_service.create_example_and_increment_counters(
                context_id,
                user_id,
                False,
                "",
                json.dumps(model_input),
                "",
                {},
                tag,
                round_id,
                task_id,
            )
