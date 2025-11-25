# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import csv
import hashlib
import json
import random
from io import StringIO

import jsonlines
from fastapi import File

from app.domain.auth.authentication import LoginService
from app.domain.helpers.s3_helpers import S3Helpers
from app.domain.schemas.base.dataset import UpdateDatasetInfo
from app.infrastructure.models.models import AccessTypeEnum, LogAccessTypeEnum
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.score import ScoreRepository
from app.infrastructure.repositories.task import TaskRepository


class DatasetService:
    def __init__(self):
        self.dataset_repository = DatasetRepository()
        self.score_repository = ScoreRepository()
        self.task_repository = TaskRepository()
        self.s3_helpers = S3Helpers()

    def get_dataset_name_by_id(self, dataset_id: int):
        return self.dataset_repository.get_dataset_name_by_id(dataset_id)

    def get_dataset_has_downstream(self, dataset_id: int):
        return self.dataset_repository.get_dataset_has_downstream(dataset_id)

    def get_scoring_datasets_by_task_id(self, task_id: int):
        return self.dataset_repository.get_scoring_datasets_by_task_id(task_id)

    def create_dataset_in_db(self, task_id: int, dataset_name: str, access_type: str):
        return self.dataset_repository.create_dataset_in_db(
            task_id, dataset_name, access_type
        )

    def upload_dataset(
        self, task_id: int, task_code: str, dataset_name: str, dataset: File
    ):
        contents = dataset.file.read().decode("utf-8")
        csv_file = StringIO(contents)
        jsonl_data = []
        csv_reader = csv.DictReader(csv_file)
        for row in csv_reader:
            uid = hashlib.md5(json.dumps(row).encode()).hexdigest()
            row["uid"] = uid
            jsonl_data.append(row)
        jsonl_file = StringIO()
        jsonl_writer = jsonlines.Writer(jsonl_file)
        jsonl_writer.write_all(jsonl_data)
        jsonl_writer.close()
        random_id = str(random.randint(1, 10000))
        dataset_name = f"{dataset_name}-{task_code}-{random_id}"
        self.create_dataset_in_db(task_id, dataset_name, "hidden")
        # Get the JSONL data as a string
        jsonl_contents = jsonl_file.getvalue()
        self.s3_helpers.upload_file_to_s3(
            jsonl_contents.encode("utf-8"), f"datasets/{task_code}/{dataset_name}.jsonl"
        )
        return "Dataset uploaded successfully"

    def get_datasets_by_task_id(self, task_id: int):
        datasets_list = []
        datasets = self.dataset_repository.get_datasets_by_task_id(task_id)
        if datasets:
            for dataset in datasets:
                datasets_list.append(dataset.__dict__)
        return datasets_list

    def get_dataset_info_by_name(self):
        return [enum.name for enum in AccessTypeEnum]

    def get_log_access_types(self):
        return [enum.name for enum in LogAccessTypeEnum]

    def update_dataset_access_type(
        self, dataset_id: int, request, model: UpdateDatasetInfo
    ):
        dataset = self.dataset_repository.get_dataset_info_by_id(dataset_id)
        if not LoginService().is_admin_or_owner(dataset["tid"], request):
            raise PermissionError("Unauthorized access to update models in the loop.")
        data = model.__dict__
        for field in data.keys():
            if field not in (
                "longdesc",
                "rid",
                "source_url",
                "access_type",
                "log_access_type",
            ):
                raise ValueError(f"Invalid field: {field}")
        self.dataset_repository.update_dataset_info(dataset_id, data)
        return {"success": "ok"}

    def delete_dataset(self, dataset_id: int, request):
        dataset = self.dataset_repository.get_dataset_info_by_id(dataset_id)
        if not LoginService().is_admin_or_owner(dataset["tid"], request):
            raise PermissionError("Unauthorized access to delete dataset.")
        scores_to_delete = self.score_repository.get_scores_for_dataset(dataset_id)

        for score in scores_to_delete:
            score_dict = score.__dict__
            self.score_repository.hide(score_dict["id"])

        self.dataset_repository.hide_dataset(dataset_id)
        return {"success": "ok"}
