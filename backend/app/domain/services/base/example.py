# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import Json

from app.infrastructure.repositories.example import ExampleRepository


class ExampleService:
    def __init__(self):
        self.example_repository = ExampleRepository()

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
        self.example_service.create_example(
            context_id,
            user_id,
            model_wrong,
            model_endpoint_name,
            input_json,
            output_json,
            metadata,
            tag,
        )
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
        return {"message": "Example created successfully"}
