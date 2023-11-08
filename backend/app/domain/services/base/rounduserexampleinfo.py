# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import datetime

import yaml

from app.infrastructure.repositories.round import RoundRepository
from app.infrastructure.repositories.rounduserexampleinfo import (
    RoundUserExampleInfoRepository,
)
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.user import UserRepository


class RoundUserExampleInfoService:
    def __init__(self):
        self.rounds_user_example_info_repository = RoundUserExampleInfoRepository()
        self.round_repository = RoundRepository()
        self.task_repository = TaskRepository()
        self.user_repository = UserRepository()

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

    def still_allowed_to_submit(self, round_id: int, user_id: int):
        get_last_date_used = self.get_last_date_used(round_id, user_id)[0]
        if not get_last_date_used:
            self.create_first_entry_for_day(round_id, user_id)
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
        task_id = self.round_repository.get_task_id_by_round_id(round_id)[0]
        max_amount_examples_on_a_day = (
            self.task_repository.get_max_amount_examples_on_a_day(task_id)[0]
        )
        return amounts_examples_created_today < max_amount_examples_on_a_day

    def get_counter_examples_submitted(self, round_id: int, user_id: int):
        return self.rounds_user_example_info_repository.get_counter_examples_submitted(
            round_id, user_id
        )[0]

    def reset_counter_examples_submitted(self, round_id: int, user_id: int):
        self.rounds_user_example_info_repository.reset_counter_examples_submitted(
            round_id, user_id
        )

    def number_of_examples_created(self, round_id: int, user_id: int):
        number_of_examples_created = (
            self.rounds_user_example_info_repository.number_of_examples_created(
                round_id, user_id
            )
        )
        if number_of_examples_created is None:
            return 0
        return number_of_examples_created

    def redirect_to_third_party_provider(
        self, task_id: int, user_id: int, round_id: int
    ):
        user_email = self.user_repository.get_user_email(user_id)[0]
        print(user_email.split("@")[1])
        if user_email.split("@")[1] == "amazonturk.com":
            number_of_examples_created = (
                self.rounds_user_example_info_repository.number_of_examples_created(
                    round_id, user_id
                )
            )
            if number_of_examples_created is None:
                number_of_examples_created = 0
            task_info = self.task_repository.get_task_info_by_task_id(task_id).__dict__
            task_configuration = yaml.load(
                task_info.get("config_yaml"), yaml.SafeLoader
            )
            required_number_of_examples = task_configuration["external_validator"][
                "required_number_of_examples"
            ]
            redirect_url = task_configuration["external_validator"]["url"]
            if number_of_examples_created == required_number_of_examples:
                return redirect_url
