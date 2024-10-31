# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Round
from app.infrastructure.repositories.abstract import AbstractRepository


class RoundRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Round)

    def get_round_info_by_round_and_task(self, task_id: int, round_id: int):
        round_info = (
            self.session.query(self.model)
            .filter((self.model.tid == task_id) & (self.model.rid == round_id))
            .first()
        )
        return round_info

    def increment_counter_examples_collected(self, round_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == round_id).update(
                {self.model.total_collected: self.model.total_collected + 1}
            )
            session.flush()
            session.commit()

    def increment_counter_examples_fooled(self, round_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == round_id).update(
                {self.model.total_fooled: self.model.total_fooled + 1}
            )
            session.flush()
            session.commit()

    def increment_counter_examples_verified_fooled(self, round_id: int, task_id: int):
        with self.session as session:
            session.query(self.model).filter(
                (self.model.rid == round_id) & (self.model.tid == task_id)
            ).update(
                {self.model.total_verified_fooled: self.model.total_verified_fooled + 1}
            )
            session.flush()
            session.commit()

    def get_task_id_by_round_id(self, round_id: int):
        return (
            self.session.query(self.model.tid).filter(self.model.id == round_id).first()
        )

    def get_examples_collected_per_round(self, round_id: int, task_id: int):
        return (
            self.session.query(self.model.total_collected)
            .filter((self.model.rid == round_id) & (self.model.tid == task_id))
            .first()
        )
