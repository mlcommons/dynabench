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

from app.domain.helpers.s3_helpers import S3Helpers
from app.infrastructure.repositories.dataset import DatasetRepository


class DatasetService:
    def __init__(self):
        self.dataset_repository = DatasetRepository()
        self.s3_helpers = S3Helpers()

    def get_dataset_name_by_id(self, dataset_id: int):
        return self.dataset_repository.get_dataset_name_by_id(dataset_id)

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
