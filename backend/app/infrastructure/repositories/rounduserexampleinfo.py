# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

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
        self.session.commit()

    def increment_counter_examples_submitted(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update({self.model.examples_submitted: self.model.examples_submitted + 1})
        self.session.commit()

    def increment_counter_examples_fooled(self, round_id: int, user_id: int):
        self.session.query(self.model).filter(
            (self.model.r_realid == round_id) & (self.model.uid == user_id)
        ).update({self.model.total_fooled: self.model.total_fooled + 1})
        self.session.commit()
