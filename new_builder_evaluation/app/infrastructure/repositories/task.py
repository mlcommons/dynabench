# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Task
from app.infrastructure.repositories.abstract import AbstractRepository


class TaskRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Task)

    def get_model_id_and_task_code(self, task):
        instance = (
            self.session.query(self.model)
            .filter((self.model.id == task) | (self.model.task_code == task))
            .first()
        )
        return instance
