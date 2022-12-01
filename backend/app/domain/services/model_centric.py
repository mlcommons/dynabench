# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
import json

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
        return response.json()

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

    def evaluate_model_in_the_loop(self, prediction: str, ground_truth: str) -> int:
        return int(prediction != ground_truth)

    def batch_prediction(
        self,
        model_url: str,
        context_id: int,
        user_id: int,
        round_id: int,
        task_id: int,
        metadata: Json,
        tag: str,
        batch_samples: UploadFile,
    ) -> dict:
        batch_samples_data = load_json_lines(batch_samples.file)
        predictions = []
        for example in batch_samples_data:
            prediction = self.single_model_prediction(model_url, example)
            model_wrong = self.evaluate_model_in_the_loop(
                prediction["label"], example["label"]
            )
            prediction["model_wrong"] = model_wrong
            self.create_example(
                context_id,
                user_id,
                model_wrong,
                model_url,
                json.dumps(example),
                json.dumps(prediction),
                metadata,
                tag,
                round_id,
                task_id,
            )
            predictions.append(prediction)
        csv_location = transform_list_to_csv(predictions, batch_samples.filename)
        return csv_location
