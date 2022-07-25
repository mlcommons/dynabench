# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
import functools

import requests

from app import utils
from app.infrastructure.models.models import Task
from app.infrastructure.repositories.abstract import AbstractRepository


class TaskRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Task)

    def get_by_id_or_code(self, task):
        instance = (
            self.session.query(self.model)
            .filter((self.model.id == task) | (self.model.task_code == task))
            .first()
        )
        return instance


class DecenTaskRepository:
    def get_by_id(self, task):
        return self.get_by_id_or_code(task)

    @functools.lru_cache()
    def get_by_id_or_code(self, task):
        assert task
        r = utils.dynabench_get(f"tasks/{task}")
        j = r.json()
        assert "error" not in j, f"Task not found {task}"
        task = utils.dotdict(j)
        task.task_id = task.id
        return task
