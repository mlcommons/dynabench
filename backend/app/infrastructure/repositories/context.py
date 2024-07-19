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

    def get_random(self, real_round_id: int, tags=None):
        instance = (
            self.session.query(self.model)
            .filter(self.model.r_realid == real_round_id)
            .order_by(func.rand())
            .first()
        )
        return instance

    def get_least_used(self, real_round_id: int, tags=None):
        instance = (
            self.session.query(self.model)
            .filter(self.model.r_realid == real_round_id)
            .order_by(self.model.total_used.asc(), func.rand())
            .first()
        )
        return instance

    def get_least_fooled(self, real_round_id: int, tags=None):
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

        return query.first()

    def get_validation_failed(self, real_round_id: int, tags=None):
        return None

    def get_context_by_real_round_id(self, real_round_id: int):
        return (
            self.session.query(self.model.context_json)
            .filter(self.model.r_realid == real_round_id)
            .all()
        )

    def get_context_by_key_value_in_contextjson(self, search_name: str, search_value: str):
        return (
            self.session.query(self.model)
            .filter(func.json_extract(self.model.context_json, search_name).like(search_value))
            .all()
        )
