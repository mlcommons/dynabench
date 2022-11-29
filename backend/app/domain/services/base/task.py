# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.task import TaskRepository


class TaskService:
    def __init__(self):
        self.task_repository = TaskRepository()

    def update_last_activity_date(self, task_id: int):
        self.task_repository.update_last_activity_date(task_id)
