# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.dataset import DatasetRepository


class DatasetService:
    def __init__(self):
        self.dataset_repository = DatasetRepository()

    def get_dataset_name_by_id(self, dataset_id: int):
        return self.dataset_repository.get_dataset_name_by_id(dataset_id)

    def get_scoring_datasets_by_task_id(self, task_id: int):
        return self.dataset_repository.get_scoring_datasets_by_task_id(task_id)
