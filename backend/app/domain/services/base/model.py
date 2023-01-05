# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import secrets

import boto3
import requests
from fastapi import UploadFile

from app.domain.helpers.email import EmailHelper
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.user import UserRepository


class ModelService:
    def __init__(self):
        self.model_repository = ModelRepository()
        self.task_repository = TaskRepository()
        self.user_repository = UserRepository()
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.email_helper = EmailHelper()

    def get_model_in_the_loop(self, task_id: str) -> str:
        return self.model_repository.get_model_in_the_loop(task_id)

    def upload_model_to_s3_and_evaluate(
        self,
        model_name: str,
        description: str,
        num_paramaters: str,
        languages: str,
        license: str,
        file_name: str,
        user_id: str,
        task_code: str,
        file_to_upload: UploadFile,
    ) -> str:
        file_name = file_name.lower()
        task_id = self.task_repository.get_task_id_by_task_code(task_code)[0]
        user_email = self.user_repository.get_user_email(user_id)[0]
        task_is_decen_task = self.task_repository.get_task_is_decen_task(task_id)[0]
        model = self.model_repository.create_new_model(
            task_id=task_id,
            user_id=user_id,
            model_name=model_name,
            shortname=model_name,
            longdesc=description,
            desc=description,
            languages=languages,
            license=license,
            params=num_paramaters,
            deployment_status="uploaded",
            secret=secrets.token_hex(),
        )
        self.user_repository.increment_model_submitted_count(user_id)
        if task_is_decen_task:
            model_path = f"models/{task_code}/{user_id}-{file_name}"
            self.s3.put_object(
                Body=file_to_upload.file,
                Bucket="dynabench-challenge",
                Key=model_path,
                ContentType=file_to_upload.content_type,
            )
            decentralize_host = os.getenv("DECENTRALIZED_HOST")
            endpoint = "/builder_evaluation/evaluation/initialize_model_evaluation"
            url = f"{decentralize_host}{endpoint}"
            requests.post(
                url,
                json={
                    "task_code": task_code,
                    "s3_url": model_path,
                    "model_id": model["id"],
                    "user_id": user_id,
                },
            )
            self.email_helper.send(
                contact=user_email,
                cc_contact="dynabench-site@mlcommons.org",
                template_name="model_upload_successful.txt",
                msg_dict={"name": model_name},
                subject=f"Model {model_name} upload succeeded.",
            )
        else:
            model_path = f"models/{task_code}/{user_id}-{file_name}"
            self.s3.put_object(
                Body=file_to_upload.file,
                Bucket=os.getenv("AWS_S3_BUCKET"),
                Key=model_path,
                ContentType=file_to_upload.content_type,
            )
            centralize_host = os.getenv("CENTRALIZED_HOST")
            endpoint = "/builder_evaluation/evaluation/initialize_model_evaluation"
            url = f"{centralize_host}{endpoint}"
            requests.post(
                url,
                json={
                    "task_code": task_code,
                    "s3_url": model_path,
                    "model_id": model["id"],
                    "user_id": user_id,
                },
            )
            self.email_helper.send(
                contact=user_email,
                cc_contact="dynabench-site@mlcommons.org",
                template_name="model_upload_successful.txt",
                msg_dict={"name": model_name},
                subject=f"Model {model_name} upload succeeded.",
            )
        return "Model evaluate successfully"
