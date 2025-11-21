# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Badge, User
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
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {self.model.total_fooled: self.model.total_fooled + 1}
            )
            session.commit()

    def increment_model_submitted_count(self, user_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {self.model.models_submitted: self.model.models_submitted + 1}
            )
            session.commit()

    def decrement_model_submitted_count(self, user_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {self.model.models_submitted: self.model.models_submitted - 1}
            )
            session.commit()

    def get_user_email(self, user_id: int) -> str:
        return (
            self.session.query(self.model.email)
            .filter(self.model.id == user_id)
            .first()
        )

    def get_user_name_by_id(self, user_id: int) -> str:
        return (
            self.session.query(self.model.username)
            .filter(self.model.id == user_id)
            .first()
        )

    def get_is_admin(self, user_id: int) -> bool:
        return (
            self.session.query(self.model.admin)
            .filter(self.model.id == user_id)
            .filter(self.model.admin == 1)
            .first()
        ) is not None

    def increment_examples_verified(self, user_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {self.model.examples_verified: self.model.examples_verified + 1}
            )
            session.commit()

    def increment_examples_verified_correct(self, user_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {
                    self.model.examples_verified_correct: self.model.examples_verified_correct
                    + 1
                }
            )
            session.commit()

    def increment_examples_verified_correct_fooled(self, user_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {self.model.total_verified_fooled: self.model.total_verified_fooled + 1}
            )
            session.commit()

    def increment_examples_verified_incorrect_fooled(self, user_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {
                    self.model.total_verified_not_correct_fooled: self.model.total_verified_not_correct_fooled
                    + 1
                }
            )
            session.commit()

    def increment_examples_created(self, user_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == user_id).update(
                {self.model.examples_submitted: self.model.examples_submitted + 1}
            )
            session.commit()

    def get_badges_by_user_id(self, user_id: int) -> dict:
        badges = self.session.query(Badge).filter(Badge.uid == user_id).all()
        return self.instance_converter.instance_to_dict(badges)

    def get_info_by_user_id(self, user_id: int) -> dict:
        return self.session.query(self.model).filter(self.model.id == user_id).first()

    def download_users_info(self):
        return self.session.query(
            self.model.id, self.model.email, self.model.username
        ).all()

    def get_user_by_username(self, username: str):
        return (
            self.session.query(self.model)
            .filter(self.model.username == username)
            .first()
        )
