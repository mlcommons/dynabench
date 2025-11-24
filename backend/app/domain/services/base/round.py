# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.round import RoundRepository


class RoundService:
    def __init__(self):
        self.round_repository = RoundRepository()

    def increment_counter_examples_collected(self, round_id: int):
        self.round_repository.increment_counter_examples_collected(round_id)

    def increment_counter_examples_fooled(self, round_id: int):
        self.round_repository.increment_counter_examples_fooled(round_id)

    def increment_counter_examples_verified_fooled(self, round_id: int, task_id: int):
        self.round_repository.increment_counter_examples_verified_fooled(
            round_id, task_id
        )

    def get_examples_collected_per_round(self, round_id: int, task_id: int):
        return self.round_repository.get_examples_collected_per_round(
            round_id, task_id
        ).total_collected

    def get_rounds_by_task_id(self, task_id: int):
        rounds = self.round_repository.get_rounds_by_task_id(task_id)
        rounds_dicts = []
        for round_instance in rounds:
            rounds_dicts.append(
                self.round_repository.instance_converter.instance_to_dict(
                    round_instance
                )
            )
        rounds_dicts.sort(key=lambda r: r["rid"])
        return rounds_dicts
