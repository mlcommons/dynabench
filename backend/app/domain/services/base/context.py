# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import json
import os
import random
import time

import boto3
import yaml
from fastapi import HTTPException
from worker.tasks import generate_images

from app.domain.services.base.historical_data import HistoricalDataService
from app.domain.services.base.jobs import JobService
from app.domain.services.base.task import TaskService
from app.domain.services.utils.llm import (
    AlephAlphaProvider,
    AnthropicProvider,
    CohereProvider,
    GoogleProvider,
    HuggingFaceAPIProvider,
    HuggingFaceProvider,
    OpenAIProvider,
    ReplicateProvider,
)
from app.domain.services.utils.multi_generator import LLMGenerator
from app.infrastructure.repositories.context import ContextRepository
from app.infrastructure.repositories.round import RoundRepository


class ContextService:
    def __init__(self):
        self.jobs_service = JobService()
        self.context_repository = ContextRepository()
        self.round_repository = RoundRepository()
        self.historical_data_service = HistoricalDataService()
        self.task_service = TaskService()
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.dataperf_bucket = os.getenv("AWS_S3_DATAPERF_BUCKET")
        self.llm_providers = [
            HuggingFaceProvider(),
            OpenAIProvider(),
            AnthropicProvider(),
            CohereProvider(),
            AlephAlphaProvider(),
            GoogleProvider(),
            ReplicateProvider(),
            HuggingFaceAPIProvider(),
        ]

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

    async def get_nibbler_contexts(
        self,
        prompt: str,
        user_id: int,
        num_images: int,
        models: list,
        endpoint: str,
        prompt_already_exists_for_user: bool,
        prompt_with_more_than_one_hundred: bool,
        task_id: int,
    ) -> dict:
        images = []
        prompt_already_exists_for_user = (
            self.historical_data_service.check_if_historical_data_exists(
                task_id, user_id, prompt
            )
        )
        print("Prompt already exists for user", prompt_already_exists_for_user)
        if prompt_already_exists_for_user:
            print("Prompt already exists for user")
            # Download the images from the s3 bucket
            key = f"adversarial-nibbler/{prompt}/{user_id}"
            objects = self.s3.list_objects_v2(Bucket=self.dataperf_bucket, Prefix=key)
            if "Contents" in objects:
                if len(objects["Contents"]) > 4:
                    for obj in objects["Contents"]:
                        image_id = obj["Key"].split("/")[-1].split(".")[0]
                        image = self.s3.get_object(
                            Bucket=self.dataperf_bucket, Key=obj["Key"]
                        )
                        image_bytes = image["Body"].read()
                        image = base64.b64encode(image_bytes).decode("utf-8")
                        new_dict = {
                            "image": image,
                            "id": image_id,
                        }
                        images.append(new_dict)
                return images
        if prompt_with_more_than_one_hundred:
            print("Prompt with less than 100 images")
            key = f"adversarial-nibbler/{prompt}"
            objects = self.s3.list_objects_v2(Bucket=self.dataperf_bucket, Prefix=key)
            users = []
            if "Contents" in objects:
                users = [obj["Key"] for obj in objects["Contents"]]
                users = list({item.split("/")[2] for item in users})
            print(f"Users are {users}")
            random_user = random.choice(users)
            print(f"Random user is {random_user}")
            key = f"adversarial-nibbler/{prompt}/{random_user}"
            objects = self.s3.list_objects_v2(Bucket=self.dataperf_bucket, Prefix=key)
            if "Contents" in objects:
                for obj in objects["Contents"]:
                    image_id = obj["Key"].split("/")[-1].split(".")[0]
                    image = self.s3.get_object(
                        Bucket=self.dataperf_bucket, Key=obj["Key"]
                    )
                    image_bytes = image["Body"].read()
                    image = base64.b64encode(image_bytes).decode("utf-8")
                    new_dict = {
                        "image": image,
                        "id": image_id,
                    }
                    images.append(new_dict)
            return images
        print("generating new images")
        self.jobs_service.create_registry({"prompt": prompt, "user_id": user_id})
        generate_images.delay(prompt, num_images, models, endpoint, user_id)
        queue_position = self.jobs_service.determine_queue_position(
            {"prompt": prompt, "user_id": user_id}
        )
        return {
            "message": "Images are being generated",
            "queue_position": queue_position["queue_position"],
            "all_positions": queue_position["all_positions"],
        }

    async def get_perdi_contexts(
        self, prompt: str, number_of_samples: int, models: dict
    ) -> list:
        all_models = [
            {provider: model}
            for provider, provider_data in models.items()
            for model_data in provider_data
            for model in [model_data]
        ]
        random.shuffle(all_models)
        selected_models = all_models[:number_of_samples]
        print("Selected models were", selected_models)
        multigenerator = LLMGenerator()
        start = time.time()
        all_artifacts = await multigenerator.generate_all_texts(
            prompt, selected_models, is_conversational=False
        )
        print(f"Time to generate texts: {time.time() - start}")
        all_answers = []
        for id, artifact in enumerate(all_artifacts):
            answer = {
                "id": id,
                "text": artifact["text"],
                "model_name": artifact["artifacts"],
                "provider": artifact["provider_name"],
            }
            all_answers.append(answer)
        return all_answers

    async def generate_images_stream(self, model_info):
        yield self.get_generative_contexts(model_info["type"], model_info["artifacts"])

    async def get_generative_contexts(self, type: str, artifacts: dict) -> dict:
        if type == "nibbler":
            exists = self.jobs_service.metadata_exists(
                {"prompt": artifacts["prompt"], "user_id": artifacts["user_id"]}
            )
            print("Exists is", exists)
            if exists:
                queue_data = self.jobs_service.determine_queue_position(
                    {"prompt": artifacts["prompt"], "user_id": artifacts["user_id"]}
                )
                print("Queue data is", queue_data)
                return queue_data
            return await self.get_nibbler_contexts(
                prompt=artifacts["prompt"],
                user_id=artifacts["user_id"],
                models=artifacts["model"],
                endpoint=artifacts["model"],
                prompt_already_exists_for_user=artifacts[
                    "prompt_already_exists_for_user"
                ],
                prompt_with_more_than_one_hundred=artifacts[
                    "prompt_with_more_than_one_hundred"
                ],
                num_images=artifacts.get("num_images", 12),
                task_id=artifacts.get("task_id", 59),
            )
        elif type == "perdi":
            return await self.get_perdi_contexts(
                prompt=artifacts["prompt"],
                number_of_samples=artifacts["number_of_samples"],
                models=artifacts["providers"],
            )

    def get_filter_context(self, real_round_id: int, filters: dict) -> dict:
        contexts = self.context_repository.get_context_by_real_round_id(real_round_id)
        contexts = [json.loads(context.context_json) for context in contexts]
        filter_contexts = []
        for context in contexts:
            for key, value in filters.items():
                if context.get(key).lower() == value.lower():
                    filter_contexts.append(context)
        return random.choice(filter_contexts)

    def get_contexts_from_s3(self, artifacts: dict):
        artifacts = artifacts["artifacts"]
        task_code = self.task_service.get_task_code_by_task_id(artifacts["task_id"])[0]
        file_name = f"Top_{artifacts['country']}-{artifacts['language']}_Concepts.json"
        key = f"{task_code}/{file_name}"
        obj = self.s3.get_object(Bucket=self.dataperf_bucket, Key=key)
        body = obj["Body"].read()
        return json.loads(body)

    def save_contexts_to_s3(
        self, file, task_id, language, country, description, category, concept
    ):
        task_code = self.task_service.get_task_code_by_task_id(task_id)[0]
        random_id = random.randint(0, 100000)
        file_name = f"{description}-{random_id}.jpeg"
        key = f"{task_code}/{country}/{language}/{category}/{concept}/{file_name}"
        file.file.seek(0)
        self.s3.put_object(Bucket=self.dataperf_bucket, Key=key, Body=file.file)
        return key
