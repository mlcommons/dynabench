# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import datetime
import io
import json
import os
import zipfile

import boto3
import requests
import yaml
from fastapi.encoders import jsonable_encoder
from pydantic import Json

from app.domain.helpers.transform_data_objects import CustomJSONEncoder
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
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")

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

    def increment_counter_examples_submitted(
        self,
        round_id: int,
        user_id: int,
        context_id: int,
        task_id: int,
        model_wrong: int,
    ):
        self.user_service.increment_examples_created(user_id)
        self.round_service.increment_counter_examples_collected(round_id)
        self.context_service.increment_counter_total_samples_and_update_date(context_id)
        self.task_service.update_last_activity_date(task_id)
        self.round_user_example_info.increment_counter_examples_submitted(
            round_id, user_id
        )
        last_update_examples = self.round_user_example_info.get_last_date_used(
            round_id, user_id
        )
        if last_update_examples != datetime.date.today():
            self.round_user_example_info.create_first_entry_for_day(round_id, user_id)
        else:
            self.round_user_example_info.increment_counter_examples_submitted_today(
                round_id, user_id
            )
        if model_wrong:
            self.round_service.increment_counter_examples_fooled(round_id)
            self.round_user_example_info.increment_counter_examples_fooled(
                round_id, user_id
            )
            self.user_service.increment_examples_fooled(user_id)

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
        amount_necessary_examples: int = -1,
        url_external_provider: str = None,
        provider_artifacts: dict = None,
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
        self.increment_counter_examples_submitted(
            round_id, user_id, context_id, task_id, model_wrong
        )
        amount_examples_submitted = (
            self.round_user_example_info.get_counter_examples_submitted(
                round_id, user_id
            )
        )
        print("amount_examples_submitted", amount_examples_submitted)
        print("amount_necessary_examples", amount_necessary_examples)
        if amount_examples_submitted == amount_necessary_examples:
            requests.post(url_external_provider, json=provider_artifacts)
            self.round_user_example_info.reset_counter_examples_submitted(
                round_id, user_id
            )
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
        if validate_non_fooling:
            example_to_validate = self.example_repository.get_example_to_validate(
                real_round_id, user_id, num_matching_validations
            )
        else:
            example_to_validate = (
                self.example_repository.get_example_to_validate_fooling(
                    real_round_id, user_id, num_matching_validations
                )
            )
        example_info = example_to_validate[0].__dict__
        example_necessary_info["example_id"] = example_info["id"]
        example_necessary_info["user_id"] = user_id
        example_necessary_info["task_id"] = task_id
        context_info = example_to_validate[1].__dict__
        metadata_json = (
            json.loads(example_info["metadata_json"])
            if example_info["metadata_json"]
            else {}
        )
        input_json = (
            json.loads(example_info["input_json"]) if example_info["input_json"] else {}
        )
        context_info = (
            json.loads(context_info["context_json"])
            if context_info["context_json"]
            else {}
        )
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
        round_id: int,
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
            self.round_service.increment_counter_examples_verified_fooled(
                task_id, round_id
            )

    def get_validate_configuration(self, task_id: int) -> dict:
        task_config = self.task_service.get_task_info_by_task_id(task_id)
        config_yaml = yaml.safe_load(task_config.config_yaml)
        context_info = {
            "validation_user_input": config_yaml.get("validation_user_input"),
            "validation_context": config_yaml.get("validation_context"),
        }
        return context_info

    def partial_creation_generative_example(
        self,
        example_info: dict,
        context_id: int,
        user_id: int,
        tag: str,
        round_id: int,
        task_id: int,
    ) -> str:
        try:
            return self.create_example(
                context_id,
                user_id,
                False,
                None,
                json.dumps(example_info),
                json.dumps({}),
                json.dumps({}),
                tag,
            )
        except Exception as e:
            return str(e)

    def update_creation_generative_example_by_example_id(
        self,
        example_id: int,
        model_input: dict,
        metadata: dict,
        round_id: int,
        user_id: int,
        context_id: int,
        task_id: int,
        model_wrong: int,
    ) -> str:
        self.increment_counter_examples_submitted(
            round_id, user_id, context_id, task_id, model_wrong
        )
        return self.example_repository.update_creation_generative_example_by_example_id(
            example_id, json.dumps(model_input), json.dumps(metadata)
        )

    def download_all_created_examples(self, task_id: int) -> dict:
        examples_data = self.example_repository.download_all_created_examples(task_id)
        examples_data_list = []
        for example in examples_data:
            example_necessary_info = {}
            example_info = example[0].__dict__
            example_necessary_info["example_info"] = example_info
            example_necessary_info["context_info"] = example[1].__dict__
            examples_data_list.append(example_necessary_info)
        return json.dumps(examples_data_list, cls=CustomJSONEncoder)

    def download_created_examples_user(
        self, task_id: int, user_id: int, amount: int
    ) -> dict:
        if user_id:
            examples_data = self.example_repository.download_created_examples_user(
                task_id, user_id, amount
            )
            examples_data_list = []
            for example in examples_data:
                example_necessary_info = {}
                example_info = example[0].__dict__
                example_necessary_info["example_id"] = example_info["id"]
                example_necessary_info["user_id"] = user_id
                example_necessary_info["task_id"] = task_id
                context_info = example[1].__dict__
                metadata_json = (
                    json.loads(example_info["metadata_json"])
                    if example_info["metadata_json"]
                    else {}
                )
                input_json = (
                    json.loads(example_info["input_json"])
                    if example_info["input_json"]
                    else {}
                )
                context_info = (
                    json.loads(context_info["context_json"])
                    if context_info["context_json"]
                    else {}
                )
                example_necessary_info["context_info"] = {
                    **input_json,
                    **context_info,
                    **metadata_json,
                }
                examples_data_list.append(example_necessary_info)
            return examples_data_list
        else:
            examples_data = self.example_repository.download_all_created_examples(
                task_id
            )
        python_list = [jsonable_encoder(obj) for obj in examples_data]
        json_string = json.dumps(python_list)
        return json_string

    def download_additional_data(self, folder_direction: str) -> dict:
        bucket_name = folder_direction.split("/")[0]
        folder_path = "/".join(folder_direction.split("/")[1:])
        in_memory_zip = io.BytesIO()
        with zipfile.ZipFile(in_memory_zip, mode="w") as zf:
            for obj in self.s3.list_objects_v2(Bucket=bucket_name, Prefix=folder_path)[
                "Contents"
            ]:
                key = obj["Key"]
                response = self.s3.get_object(Bucket=bucket_name, Key=key)
                file_content = response["Body"].read()
                zf.writestr(key, file_content)
        # Upload the zip file to S3
        zip_key = f"{folder_path}/extra_info.zip"
        in_memory_zip.seek(0)
        self.s3.upload_fileobj(in_memory_zip, bucket_name, zip_key)
        presigned_url = self.s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket_name, "Key": zip_key},
            ExpiresIn=3600,
        )
        return presigned_url

    def convert_s3_image_to_base_64(self, image_name: str, bucket_name: str) -> str:
        image = self.s3.get_object(Bucket=bucket_name, Key=image_name)
        image_content = image["Body"].read()
        return base64.b64encode(image_content).decode("utf-8")
