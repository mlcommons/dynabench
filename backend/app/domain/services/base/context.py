# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import HTTPException

from app.infrastructure.repositories.context import ContextRepository
from app.infrastructure.repositories.round import RoundRepository


class ContextService:
    def __init__(self):
        self.context_repository = ContextRepository()
        self.round_repository = RoundRepository()

    def increment_counter_total_samples_and_update_date(self, context_id: int) -> None:
        self.context_repository.increment_counter_total_samples_and_update_date(
            context_id
        )

    def get_real_round_id(self, context_id: int) -> int:
        return self.context_repository.get_real_round_id(context_id)

    def get_contexts(
        self, tid: int, rid: int, method: str = "least_used", n: int = 1, tags=None
    ):
        """Get a context for annotation

        Args:
            tid (int): The ID of the task
            rid (int): The ID of the current round being run
            method (str, optional): How to choose the context. Possible options are:
            1. 'uniform': selects at random from possible contexts
            2. 'least_fooled': selects contexts that least fool the model
            3. 'least_used': selects contexts that have been annotated the least
            Defaults to 'least_used'.
            n (int, optional): How many contexts to bring. Defaults to 1.
            tags (_type_, optional): _description_. Defaults to None.

        Raises:
            HTTPException: There are no contexts available

        Returns:
            list: A list of context objects, each of which has different attributes.
        """

        real_round_id = self.round_repository.get_round_info_by_round_and_task(
            tid, rid
        ).id
        print("This is the method", method)
        if method == "uniform":
            context = self.context_repository.get_random(real_round_id, n)
        elif method == "least_used":
            context = self.context_repository.get_least_used(real_round_id, n)
        elif method == "least_fooled":
            context = self.context_repository.get_least_fooled(real_round_id, n)
        if not context:
            raise HTTPException(500, f"No contexts available ({real_round_id})")
        return context
