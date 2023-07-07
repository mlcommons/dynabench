# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import hashlib
import json
import multiprocessing
import os
import random

import boto3
import yaml
from fastapi import HTTPException

from app.domain.services.base.task import TaskService
from app.domain.services.utils.constant import black_image, forbidden_image
from app.domain.services.utils.image_generators import (
    OpenAIImageProvider,
    StableDiffusionImageProvider,
)
from app.domain.services.utils.llm import OpenAIProvider
from app.infrastructure.repositories.context import ContextRepository
from app.infrastructure.repositories.round import RoundRepository


class ContextService:
    def __init__(self):
        self.context_repository = ContextRepository()
        self.round_repository = RoundRepository()
        self.task_service = TaskService()
        self.image_providers = [
            StableDiffusionImageProvider(),
            OpenAIImageProvider(),
        ]
        self.llm_provider = OpenAIProvider()
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.dataperf_bucket = os.getenv("AWS_S3_DATAPERF_BUCKET")

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

    def get_nibbler_contexts(
        self, prompt: str, user_id: int, num_images: int, models: list, endpoint: str
    ) -> dict:
        images = []
        for generator in self.image_providers:
            if generator.provider_name() == "openai":
                n = 2
                generated_images = generator.generate_images(
                    prompt, n, models, endpoint
                )
            else:
                n = 8
                with multiprocessing.Pool(2) as p:
                    generated_images = p.starmap(
                        generator.generate_images,
                        [(prompt, n, models, endpoint)] * 2,
                    )
                    p.close()
                    p.join()
                generated_images = [
                    image for sublist in generated_images for image in sublist
                ]
            for image in generated_images:
                image_id = (
                    generator.provider_name()
                    + "_"
                    + prompt
                    + "_"
                    + str(user_id)
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
                        Bucket=self.dataperf_bucket,
                        Key=filename,
                    )
                    images.append(new_dict)
        random.shuffle(images)
        return images

    def get_perdi_contexts(
        self, prompt: str, number_of_samples: int, models: list
    ) -> dict:
        random.shuffle(models)
        all_answers = []
        for id, model in enumerate(models[:number_of_samples]):
            answer = {
                "id": f"perdi_{id + 1}",
                "text": self.llm_provider.generate_text(prompt, model["name"]),
                "model": model["name"],
                "model_letter": chr(ord("A") + id),
                "provider": model["provider"],
                "score": 50,
            }
            all_answers.append(answer)
        return all_answers

    def get_generative_contexts(self, type: str, artifacts: dict) -> dict:
        if type == "nibbler":
            return self.get_nibbler_contexts(
                prompt=artifacts["prompt"],
                user_id=artifacts["user_id"],
                models=artifacts["model"],
                endpoint=artifacts["endpoint"],
                num_images=30,
            )
        elif type == "perdi":
            return self.get_perdi_contexts(
                prompt=artifacts["prompt"],
                number_of_samples=artifacts["number_of_samples"],
                models=artifacts["models"],
            )
