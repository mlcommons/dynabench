# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.task import TaskRepository


class TaskService:
    def __init__(self):
        self.task_repository = TaskRepository()
        self.dataset_repository = DatasetRepository()

    def update_last_activity_date(self, task_id: int):
        self.task_repository.update_last_activity_date(task_id)

    def get_active_tasks_with_round_info(self):
        tasks_and_round_info = self.task_repository.get_active_tasks_with_round_info()
        tasks = [
            task_and_round_info["Task"].__dict__
            for task_and_round_info in tasks_and_round_info
        ]
        rounds = [
            task_and_round_info["Round"].__dict__
            for task_and_round_info in tasks_and_round_info
        ]
        for i, round in enumerate(rounds):
            tasks[i]["round"] = dict(round)
        return tasks

    def get_task_with_round_and_dataset_info_by_task_id(self, task_id: int):
        task_and_round_info = self.task_repository.get_task_with_round_info_by_task_id(
            task_id
        )
        task = task_and_round_info["Task"].__dict__
        task["round"] = task_and_round_info["Round"].__dict__
        # datasets = self.dataset_repository.get_datasets_by_task_id(task_id)

        return task

    def get_task_with_round_and_dataset_info_by_task_code(self, task_code: str):
        task_and_round_info = (
            self.task_repository.get_task_with_round_info_by_task_code(task_code)
        )
        task = task_and_round_info["Task"].__dict__
        task["round"] = task_and_round_info["Round"].__dict__
        # datasets = self.dataset_repository.get_datasets_by_task_id(task["id"])

        return task
