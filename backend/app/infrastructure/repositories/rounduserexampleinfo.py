# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import datetime

from app.infrastructure.models.models import RoundUserExampleInfo
from app.infrastructure.repositories.abstract import AbstractRepository


class RoundUserExampleInfoRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(RoundUserExampleInfo)

    def verify_user_and_round_exist(self, user_id: int, round_id: int) -> bool:
        return (
            self.session.query(self.model)
            .filter((self.model.r_realid == round_id) & (self.model.uid == user_id))
            .count()
            > 0
        )

    def create_user_and_round_example_info(self, round_id: int, user_id: int) -> None:
        self.session.add(
            self.model(
                r_realid=round_id,
                uid=user_id,
                examples_submitted=0,
                total_fooled=0,
                total_verified_not_correct_fooled=0,
            )
        )
        self.session.flush()
        self.session.commit()

    def increment_counter_examples_submitted(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update({self.model.examples_submitted: self.model.examples_submitted + 1})
        self.session.flush()
        self.session.commit()

    def increment_counter_examples_fooled(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update({self.model.total_fooled: self.model.total_fooled + 1})
        self.session.flush()
        self.session.commit()

    def increment_examples_submitted_today(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update(
            {
                self.model.amount_examples_on_a_day: self.model.amount_examples_on_a_day
                + 1
            }
        )
        self.session.flush()
        self.session.commit()

    def amounts_examples_created_today(self, round_id: int, user_id: int):
        return (
            self.session.query(self.model.amount_examples_on_a_day)
            .filter(
                (self.model.r_realid == round_id)
                & (self.model.uid == user_id)
                & (
                    self.model.last_used
                    == datetime.date.today() + datetime.timedelta(days=1)
                )
            )
            .first()
        )

    def get_last_date_used(self, round_id: int, user_id: int):
        return (
            self.session.query(self.model.last_used)
            .filter((self.model.r_realid == round_id) & (self.model.uid == user_id))
            .first()
        )

    def update_last_used_and_counter(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update(
            {
                self.model.last_used: datetime.date.today(),
                self.model.amount_examples_on_a_day: 0,
            }
        )
        self.session.flush()
        self.session.commit()

    def create_first_entry_for_day(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update(
            {
                self.model.amount_examples_on_a_day: 1,
                self.model.last_used: datetime.date.today(),
            }
        )
        self.session.flush()
        self.session.commit()

    def get_counter_examples_submitted(self, round_id: int, user_id: int):
        return (
            self.session.query(self.model.examples_submitted)
            .filter((self.model.r_realid == round_id) & (self.model.uid == user_id))
            .first()
        )

    def reset_counter_examples_submitted(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update({self.model.examples_submitted: 0})
        self.session.flush()
        self.session.commit()

    def number_of_examples_created(self, round_id: int, user_id: int):
        return (
            self.session.query(self.model.examples_submitted)
            .filter((self.model.r_realid == round_id) & (self.model.uid == user_id))
            .first()
        )[0]
