# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Dataset, Model, Score, User
from app.infrastructure.repositories.abstract import AbstractRepository


class ScoreRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Score)

    def get_scores_users_dataset_and_model_by_task_id(
        self,
        task_id: int,
        ordered_datasets_id: list,
        unpublished_models_in_leaderboard: bool,
    ):
        query = (
            self.session.query(Score, User, Dataset, Model)
            .join(Dataset, Dataset.id == Score.did)
            .join(Model, Score.mid == Model.id)
            .join(User, User.id == Model.uid)
            .filter(Model.tid == task_id)
            .filter(Score.did.in_(ordered_datasets_id))
        )
        if unpublished_models_in_leaderboard:
            query = query.filter(Model.is_published)
        return query.all()
