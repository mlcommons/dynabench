# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Jobs
from app.infrastructure.repositories.abstract import AbstractRepository


class JobRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Jobs)

    def metadata_exists(self, model: dict):
        exists = (
            self.session.query(self.model)
            .filter(self.model.prompt == model["prompt"])
            .filter(self.model.user_id == model["user_id"])
            .first()
        )
        return exists is not None

    def create_registry(self, model: dict):
        job = {"prompt": model["prompt"], "user_id": model["user_id"]}
        new_instance = self.model(**job)
        with self.session as session:
            session.add(new_instance)
            session.commit()

    def determine_queue_position(self, model: dict):
        my_position = (
            self.session.query(self.model)
            .filter(self.model.prompt == model["prompt"])
            .filter(self.model.user_id == model["user_id"])
            .first()
        )
        queue_position = (
            self.session.query(self.model)
            .filter(self.model.id < my_position.id)
            .count()
            + 1
        )
        all_positions = self.session.query(self.model).count()
        return {"queue_position": queue_position, "all_positions": all_positions}

    def remove_registry(self, model: dict):
        with self.session as session:
            session.query(self.model).filter(
                self.model.prompt == model["prompt"]
            ).filter(self.model.user_id == model["user_id"]).delete()
            session.flush()
            session.commit()
