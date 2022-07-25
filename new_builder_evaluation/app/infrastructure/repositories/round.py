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
