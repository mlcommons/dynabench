# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.rounduserexampleinfo import (
    RoundUserExampleInfoRepository,
)


class RoundUserExampleInfoService:
    def __init__(self):
        self.rounds_user_example_info_repository = RoundUserExampleInfoRepository()

    def verify_user_and_round(self, user_id: int, round_id: int):
        return self.rounds_user_example_info_repository.verify_user_and_round_exist(
            user_id, round_id
        )

    def increment_counter_examples_submitted(self, round_id: int, user_id: int):
        if not self.verify_user_and_round(user_id, round_id):
            self.rounds_user_example_info_repository.create_user_and_round_example_info(
                round_id,
                user_id,
            )
        self.rounds_user_example_info_repository.increment_counter_examples_submitted(
            round_id, user_id
        )

    def increment_counter_examples_fooled(self, round_id: int, user_id: int):
        if not self.verify_user_and_round(user_id, round_id):
            self.rounds_user_example_info_repository.create_user_and_round_example_info(
                round_id, user_id
            )
        self.rounds_user_example_info_repository.increment_counter_examples_fooled(
            round_id, user_id
        )
