# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.example import ExampleRepository
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.user import UserRepository
from app.infrastructure.repositories.validation import ValidationRepository


class UserService:
    def __init__(self):
        self.user_repository = UserRepository()
        self.example_repository = ExampleRepository()
        self.validation_repository = ValidationRepository()
        self.model_repository = ModelRepository()

    def increment_examples_fooled(self, user_id: int):
        self.user_repository.increment_examples_fooled(user_id)

    def increment_examples_verified(self, user_id: int):
        self.user_repository.increment_examples_verified(user_id)

    def increment_examples_verified_correct(self, user_id: int):
        self.user_repository.increment_examples_verified_correct(user_id)

    def increment_examples_verified_correct_fooled(self, user_id: int):
        self.user_repository.increment_examples_verified_correct_fooled(user_id)

    def increment_examples_verified_incorrect_fooled(self, user_id: int):
        self.user_repository.increment_examples_verified_incorrect_fooled(user_id)

    def increment_examples_created(self, user_id: int):
        self.user_repository.increment_examples_created(user_id)

    def get_user_name_by_id(self, user_id: int):
        return self.user_repository.get_user_name_by_id(user_id)

    def get_by_email(self, email: str):
        return self.user_repository.get_by_email(email)

    def create_user(self, email: str, password: str, username: str):
        return self.user_repository.create_user(email, password, username)

    def get_is_admin(self, user_id: int):
        return self.user_repository.get_is_admin(user_id)

    def get_user_with_badges(self, user_id: int):
        user_info = self.user_repository.get_info_per_user_id(user_id).__dict__
        badges = self.user_repository.get_badges_per_user_id(user_id)
        user_info["badges"] = [badge for badge in badges]
        return user_info

    def get_stats_per_user_id(self, user_id: int):
        stats_per_user = {}
        stats_per_user[
            "total_examples"
        ] = self.example_repository.get_total_examples_per_user_id(user_id)
        stats_per_user[
            "total_validations"
        ] = self.validation_repository.get_total_validations_per_user_id(user_id)
        stats_per_user[
            "total_models"
        ] = self.model_repository.get_total_models_per_user_id(user_id)
        stats_per_user[
            "model_fooling_rate"
        ] = self.example_repository.get_model_fooling_rate_per_user_id(user_id)
        return stats_per_user
