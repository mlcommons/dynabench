# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Model
from app.infrastructure.repositories.abstract import AbstractRepository


class ModelRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Model)

    def update_light_model(self, id: int, light_model: str) -> dict:
        instance = self.session.query(self.model).filter(self.model.id == id).first()
        instance.light_model = light_model
        self.session.flush()
        self.session.commit()
        return
