# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from sqlalchemy import case, func

from app.infrastructure.models.models import Context, Example
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

    def get_random(self, real_round_id: int, n: int = 1, tags=None):
        instance = (
            self.session.query(self.model)
            .filter(self.model.r_realid == real_round_id)
            .order_by(func.rand())
            .limit(n)
            .all()
        )
        return instance

    def get_least_used(self, real_round_id: int, n: int = 1, tags=None):
        instance = (
            self.session.query(self.model)
            .filter(self.model.r_realid == real_round_id)
            .order_by(self.model.total_used.asc(), func.rand())
            .limit(n)
            .all()
        )
        return instance

    def get_least_fooled(self, real_round_id: int, n: int = 1, tags=None):
        query = (
            self.session.query(self.model)
            .join(Example, self.model.id == Example.cid, isouter=True)
            .filter(self.model.r_realid == real_round_id)
        )

        query = (
            query.group_by(self.model.id)
            .order_by(
                func.sum(case(value=Example.model_wrong, whens={1: 1}, else_=0)),
                func.rand(),
            )
            .with_entities(self.model)
        )

        return query.limit(n).all()

    def get_validation_failed(self, real_round_id: int, n: int = 1, tags=None):
        return None
