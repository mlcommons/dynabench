# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import hashlib
import json
import os

import openai
import requests
import yaml
from fastapi import HTTPException

from app.domain.services.base.task import TaskService
from app.infrastructure.repositories.context import ContextRepository
from app.infrastructure.repositories.round import RoundRepository


class ContextService:
    def __init__(self):
        self.context_repository = ContextRepository()
        self.round_repository = RoundRepository()
        self.task_service = TaskService()

    def increment_counter_total_samples_and_update_date(self, context_id: int) -> None:
        self.context_repository.increment_counter_total_samples_and_update_date(
            context_id
        )

    def get_real_round_id(self, context_id: int) -> int:
        return self.context_repository.get_real_round_id(context_id)

    def get_context(
        self,
        task_id: int,
        method: str,
        tags=None,
    ):
        """Get a context for annotation

        Args:
            method (str, optional): How to choose the context. Possible options are:
            1. 'uniform': selects at random from possible contexts
            2. 'least_fooled': selects contexts that least fool the model
            3. 'least_used': selects contexts that have been annotated the least
            Defaults to 'least_used'.
        Raises:
            HTTPException: There are no contexts available
        Returns:
            list: A list of context objects, each of which has different attributes.
        """
        task_config = self.task_service.get_task_info_by_task_id(task_id)
        try:
            self.get_context_configuration(task_id)
        except AttributeError:
            raise HTTPException(
                500,
                f"Task with id = {task_id} has no configuration setup",
            )

        round_id = task_config.cur_round
        real_round_id = self.round_repository.get_round_info_by_round_and_task(
            task_id, round_id
        ).id

        if method == "uniform":
            context = self.context_repository.get_random(real_round_id, tags)
        elif method == "least_used":
            context = self.context_repository.get_least_used(real_round_id, tags)
        elif method == "least_fooled":
            context = self.context_repository.get_least_fooled(real_round_id, tags)
        if not context:
            raise HTTPException(500, f"No contexts available ({real_round_id})")

        return {
            "current_context": json.loads(context.context_json),
            "context_id": context.id,
            "real_round_id": context.r_realid,
            "tags": tags,
        }

    def get_context_configuration(self, task_id) -> dict:
        task_config = self.task_service.get_task_info_by_task_id(task_id)
        config_yaml = yaml.safe_load(task_config.config_yaml)
        context_info = {
            "goal": config_yaml.get("goal"),
            "context": config_yaml.get("context"),
            "user_input": config_yaml.get("user_input"),
            "model_input": config_yaml.get("model_input"),
            "response_fields": config_yaml.get("response_fields"),
            "model_output": config_yaml.get("model_output"),
            "model_evaluation_metric": config_yaml.get("model_evaluation_metric"),
        }
        return context_info

    def get_nibbler_contexts(self, prompt: str, endpoint: str) -> dict:
        print(prompt)
        context_config = self.task_service.get_task_info_by_task_id(45)
        res = requests.post(
            context_config.lambda_model,
            json={
                "model": "runwayml-stable-diffusion-v1-5",
                "prompt": prompt,
                "n": 9,
                "steps": 20,
            },
            headers={"Authorization": "Bearer ", "User-Agent": ""},
        )
        if res.status_code == 200:
            image_response = res.json()["output"]["choices"]
        else:
            openai.api_key = os.getenv("OPENAI")
            response = openai.Image.create(
                prompt=prompt, n=9, size="256x256", response_format="b64_json"
            )
            image_response = response["data"][0]["b64_json"]
        image_list = []
        for i in image_response:
            new_dict = {
                "image": i["image_base64"],
                "id": hashlib.md5(i["image_base64"].encode()).hexdigest(),
            }
            image_list.append(new_dict)

        return image_list

    def get_generative_contexts(self, type: str, artifacts: dict) -> dict:
        if type == "nibbler":
            return self.get_nibbler_contexts(artifacts["prompt"], artifacts["endpoint"])
