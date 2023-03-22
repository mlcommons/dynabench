# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.validation import ValidationRepository


class ValidationService:
    def __init__(self):
        self.validation_repository = ValidationRepository()

    def create_validation(
        self, example_id: int, user_id: int, label: str, mode: str, metadata_json: dict
    ):
        return self.validation_repository.create_validation(
            example_id, user_id, label, mode, metadata_json
        )
