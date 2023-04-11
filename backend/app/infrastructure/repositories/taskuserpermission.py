# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import TaskUserPermission
from app.infrastructure.repositories.abstract import AbstractRepository


class TaskUserPermissionRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(TaskUserPermission)

    def is_task_owner(self, user_id: int, task_id: int) -> bool:
        return (
            self.session.query(self.model)
            .filter(self.model.uid == user_id)
            .filter(self.model.tid == task_id)
            .filter(self.model.type == "owner")
            .first()
        ) is not None
