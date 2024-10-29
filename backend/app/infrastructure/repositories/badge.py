# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Badge
from app.infrastructure.repositories.abstract import AbstractRepository


class BadgeRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Badge)

    def add_badge(self, user_id: int, name: str) -> None:
        model = self.model(uid=user_id, name=name)
        with self.session as session:
            session.add(model)
            session.flush()
            session.commit()
