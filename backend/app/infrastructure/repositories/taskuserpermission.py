# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from sqlalchemy import and_

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

    def get_task_permissions_by_user_id(self, user_id: int):
        instances = (
            self.session.query(self.model).filter(self.model.uid == user_id).all()
        )
        return [
            self.instance_converter.instance_to_dict(instance) for instance in instances
        ]

    def get_task_owners(self, task_id: int):
        instances = (
            self.session.query(self.model)
            .filter(self.model.tid == task_id)
            .filter(self.model.type == "owner")
            .all()
        )
        return [
            self.instance_converter.instance_to_dict(instance) for instance in instances
        ]

    def delete_task_user_permission(self, task_id: int, user_id: int, type: str):
        self.session.query(self.model).filter(
            and_(
                self.model.uid == user_id,
                self.model.type == type,
                self.model.tid == task_id,
            )
        ).delete()
        with self.session as session:
            session.commit()

    def create_user_task_permission(
        self, task_id: int, user_id: int, permission_type: str
    ):
        return self.add({"tid": task_id, "uid": user_id, "type": permission_type})
