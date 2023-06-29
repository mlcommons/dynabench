# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import datetime

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
        self.rounds_user_example_info_repository.increment_counter_examples_fooled(
            round_id, user_id
        )

    def increment_counter_examples_submitted_today(self, round_id: int, user_id: int):
        self.rounds_user_example_info_repository.increment_examples_submitted_today(
            round_id, user_id
        )

    def amounts_examples_created_today(self, round_id: int, user_id: int):
        return self.rounds_user_example_info_repository.amounts_examples_created_today(
            round_id, user_id
        ) or [0]

    def get_last_date_used(self, round_id: int, user_id: int):
        return self.rounds_user_example_info_repository.get_last_date_used(
            round_id, user_id
        ) or [datetime.date(1, 1, 1)]

    def create_first_entry_for_day(self, round_id: int, user_id: int):
        self.rounds_user_example_info_repository.create_first_entry_for_day(
            round_id, user_id
        )

    def still_allowed_to_submit(
        self, round_id: int, user_id: int, max_amount_examples_on_a_day: int
    ):
        get_last_date_used = self.get_last_date_used(round_id, user_id)[0]
        if get_last_date_used < datetime.date.today():
            self.rounds_user_example_info_repository.update_last_used_and_counter(
                round_id, user_id
            )
        amounts_examples_created_today = self.amounts_examples_created_today(
            round_id, user_id
        )[0]
        if not amounts_examples_created_today:
            amounts_examples_created_today = 0
        return amounts_examples_created_today < max_amount_examples_on_a_day
