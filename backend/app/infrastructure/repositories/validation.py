# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Context, Example, Round, Validation
from app.infrastructure.repositories.abstract import AbstractRepository


class ValidationRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Validation)

    def create_validation(
        self, example_id: int, user_id: int, label: str, mode: str, metadata_json: dict
    ):
        return self.add(
            {
                "uid": user_id,
                "label": label,
                "mode": mode,
                "metadata_json": str(metadata_json),
                "eid": example_id,
            }
        )

    def get_active_tasks_per_user_id(self, user_id: int):
        return (
            self.session.query(Round.tid)
            .join(Context, Round.id == Context.r_realid)
            .join(Example, Context.id == Example.cid)
            .join(self.model, Example.id == self.model.eid)
            .filter(Validation.uid == user_id)
            .distinct()
            .all()
        )
