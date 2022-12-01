# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Context
from app.infrastructure.repositories.abstract import AbstractRepository


class ContextRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Context)

    def increment_counter_total_samples_and_update_date(self, context_id: int) -> None:
        self.session.query(self.model).filter(self.model.id == context_id).update(
            {self.model.total_used: self.model.total_used + 1}
        )
        self.session.commit()

    def get_real_round_id(self, context_id: int) -> int:
        instance = (
            self.session.query(self.model.r_realid)
            .filter(self.model.id == context_id)
            .first()
        )
        return instance.r_realid
