# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import hashlib
import json
import os
import random

import boto3
import openai
import requests
import yaml
from fastapi import HTTPException

from app.domain.services.base.task import TaskService
from app.domain.services.utils.constant import black_image, forbidden_image
from app.domain.services.utils.image_generators import (
    OpenAIImageProvider,
    StableDiffusionImageProvider,
)
from app.infrastructure.repositories.context import ContextRepository
from app.infrastructure.repositories.round import RoundRepository


class ContextService:
    def __init__(self):
        self.context_repository = ContextRepository()
        self.round_repository = RoundRepository()
        self.task_service = TaskService()
        self.providers = [StableDiffusionImageProvider(), OpenAIImageProvider()]
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")

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
            "required_fields": config_yaml.get("required_fields"),
            "creation_samples_title": config_yaml.get("creation_samples_title"),
        }
        return context_info

    def get_nibbler_contexts(self, prompt: str, num_images: int = 3) -> dict:
        images = []
        for counter in range(2):
            if len(images) == 6:
                break
            else:
                for generator in self.providers:
                    generated_images = generator.generate_images(prompt, 3)
                    for image in generated_images:
                        image_id = (
                            generator.provider_name()
                            + "_"
                            + hashlib.md5(image.encode()).hexdigest()
                        )
                        print(image_id)
                        if black_image in image:
                            new_dict = {
                                "image": forbidden_image,
                                "id": hashlib.md5(forbidden_image.encode()).hexdigest(),
                            }
                            images.append(new_dict)
                        else:
                            new_dict = {
                                "image": image,
                                "id": image_id,
                            }
                            filename = f"adversarial-nibbler/{image_id}.jpeg"
                            self.s3.put_object(
                                Body=base64.b64decode(image),
                                Bucket="dataperf",
                                Key=filename,
                            )
                            images.append(new_dict)
        random.shuffle(images)
        return images

    def get_generative_contexts(self, type: str, artifacts: dict) -> dict:
        if type == "nibbler":
            return self.get_nibbler_contexts(artifacts["prompt"], artifacts["endpoint"])
