# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Dataset
from app.infrastructure.repositories.abstract import AbstractRepository


class DatasetRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Dataset)

    def get_scoring_datasets(self, task_id: int, round_id: int) -> dict:
        instances = self.session.query(self.model).filter(
            (self.model.access_type == "scoring")
            & (self.model.tid == task_id)
            & (self.model.rid == round_id)
        )
        return instances
