# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json

import yaml
from fastapi import HTTPException

from app.infrastructure.repositories.context import ContextRepository
from app.infrastructure.repositories.round import RoundRepository
from app.infrastructure.repositories.task import TaskRepository


class ContextService:
    def __init__(self):
        self.context_repository = ContextRepository()
        self.round_repository = RoundRepository()
        self.task_repository = TaskRepository()

    def increment_counter_total_samples_and_update_date(self, context_id: int) -> None:
        self.context_repository.increment_counter_total_samples_and_update_date(
            context_id
        )

    def get_real_round_id(self, context_id: int) -> int:
        return self.context_repository.get_real_round_id(context_id)

    def get_context(
        self,
        task_id: int,
        method: str,
        tags=None,
    ):
        """Get a context for annotation

        Args:
            method (str, optional): How to choose the context. Possible options are:
            1. 'uniform': selects at random from possible contexts
            2. 'least_fooled': selects contexts that least fool the model
            3. 'least_used': selects contexts that have been annotated the least
            Defaults to 'least_used'.
        Raises:
            HTTPException: There are no contexts available
        Returns:
            list: A list of context objects, each of which has different attributes.
        """
        task_config = self.task_repository.get_task_info_by_task_id(task_id)
        try:
            context_info = self._get_context_info(task_config)
        except AttributeError:
            raise HTTPException(
                500,
                f"Task with id = {task_id} has no configuration setup",
            )

        round_id = task_config.cur_round
        real_round_id = self.round_repository.get_round_info_by_round_and_task(
            task_id, round_id
        ).id

        if method == "uniform":
            context = self.context_repository.get_random(real_round_id, tags)
        elif method == "least_used":
            context = self.context_repository.get_least_used(real_round_id, tags)
        elif method == "least_fooled":
            context = self.context_repository.get_least_fooled(real_round_id, tags)
        if not context:
            raise HTTPException(500, f"No contexts available ({real_round_id})")

        return {
            "context_info": context_info,
            "current_context": json.loads(context.context_json),
            "context_id": context.id,
            "real_round_id": context.r_realid,
            "tags": tags,
        }

    def _get_context_info(self, task_config) -> dict:
        config_yaml = yaml.safe_load(task_config.config_yaml)
        context_info = {
            "goal": config_yaml.get("goal"),
            "context": config_yaml.get("context"),
            "input": config_yaml.get("input"),
        }
        return context_info
