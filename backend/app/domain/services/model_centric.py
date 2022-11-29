# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
import requests
from fastapi import UploadFile
from pydantic import Json

from app.domain.helpers.transform_data_objects import (
    load_json_lines,
    transform_list_to_csv,
)
from app.domain.services.base.context import ContextService
from app.domain.services.base.example import ExampleService
from app.domain.services.base.round import RoundService
from app.domain.services.base.rounduserexampleinfo import RoundUserExampleInfo
from app.domain.services.base.task import TaskService
from app.domain.services.base.user import UserService


class ModelCentricService:
    def __init__(self) -> None:
        self.example_service = ExampleService()
        self.round_service = RoundService()
        self.context_service = ContextService()
        self.task_service = TaskService()
        self.round_user_example_info = RoundUserExampleInfo()
        self.user_service = UserService()

    def single_model_prediction(self, model_url: str, sample: dict) -> str:
        response = requests.post(model_url, json=sample)
        return response.text

    def batch_prediction(self, model_url: str, batch_samples: UploadFile) -> dict:
        batch_samples_data = load_json_lines(batch_samples.file)
        predictions = []
        for example in batch_samples_data:
            prediction = self.single_model_prediction(model_url, example)
            predictions.append(prediction)
        csv_location = transform_list_to_csv(predictions, batch_samples.filename)
        return csv_location

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
        self.task_service.update_last_activity_date(task_id)
        real_round_id = self.context_service.get_real_round_id(context_id)
        self.round_user_example_info.increment_counter_examples_submitted(
            user_id, real_round_id
        )
        if model_wrong:
            self.round_service.increment_counter_examples_fooled(round_id, task_id)
            self.round_user_example_info.increment_counter_examples_fooled(
                user_id, real_round_id
            )
            self.user_service.increment_examples_fooled(user_id)
        return {"message": "Example created successfully"}
