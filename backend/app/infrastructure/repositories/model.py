# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sqlalchemy.sql import func

from app.infrastructure.models.models import Model
from app.infrastructure.repositories.abstract import AbstractRepository


class ModelRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Model)

    def get_model_in_the_loop(self, task_id: int) -> dict:
        models_in_the_loop = (
            self.session.query(self.model.light_model)
            .filter(self.model.tid == task_id, self.model.is_in_the_loop == 1)
            .order_by(func.random())
            .first()
        )
        return models_in_the_loop
