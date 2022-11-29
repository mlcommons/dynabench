# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.round import RoundRepository


class RoundService:
    def __init__(self):
        self.round_repository = RoundRepository()

    def increment_counter_examples_collected(self, round_id: int, task_id: int):
        self.round_repository.increment_counter_examples_collected(round_id, task_id)

    def increment_counter_examples_fooled(self, round_id: int, task_id: int):
        self.round_repository.increment_counter_examples_fooled(round_id, task_id)
