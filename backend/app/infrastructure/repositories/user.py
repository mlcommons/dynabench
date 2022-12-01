# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import User
from app.infrastructure.repositories.abstract import AbstractRepository


class UserRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(User)

    def get_by_email(self, email: str) -> dict:
        instance = (
            self.session.query(self.model).filter(self.model.email == email).first()
        )
        instance = self.instance_converter.instance_to_dict(instance)
        return instance

    def create_user(self, email: str, password: str, username: str) -> dict:
        return self.add({"email": email, "password": password, "username": username})

    def increment_examples_fooled(self, user_id: int):
        self.session.query(self.model).filter(self.model.id == user_id).update(
            {self.model.total_fooled: self.model.total_fooled + 1}
        )
        self.session.commit()
