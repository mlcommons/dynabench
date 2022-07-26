# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Dataset
from app.infrastructure.repositories.abstract import AbstractRepository


class DatasetRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Dataset)

    def get_scoring_datasets(self, task_id: int) -> dict:
        scoring_datasets = self.session.query(self.model).filter(
            (self.model.access_type == "scoring") & (self.model.tid == task_id)
        )
        jsonl_scoring_datasets = []

        for scoring_dataset in scoring_datasets:
            jsonl_scoring_dataset = {}
            jsonl_scoring_dataset["dataset"] = scoring_dataset.name
            jsonl_scoring_dataset["round_id"] = scoring_dataset.rid
            jsonl_scoring_dataset["dataset_id"] = scoring_dataset.id
            jsonl_scoring_datasets.append(jsonl_scoring_dataset)

        return jsonl_scoring_datasets
