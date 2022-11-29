# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.context import ContextRepository


class ContextService:
    def __init__(self):
        self.context_repository = ContextRepository()

    def increment_total_samples_and_update_date(self, context_id: int) -> None:
        self.context_repository.increment_total_samples_and_update_date(context_id)

    def get_real_round_id(self, context_id: int) -> int:
        return self.context_repository.get_real_round_id(context_id)
