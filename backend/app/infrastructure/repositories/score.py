# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sqlalchemy.sql import func

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

    def get_scores_by_dataset_and_model_id(self, dataset_id: int, model_id: int):
        return (
            self.session.query(Score)
            .filter(Score.did == dataset_id)
            .filter(Score.mid == model_id)
            .all()
        )

    def get_maximun_principal_score_per_task(self, task_id: int, datasets: list):
        return (
            self.session.query(Model.name, func.avg(Score.perf).label("perf"))
            .filter(Score.did.in_(datasets))
            .filter(Score.mid == Model.id)
            .filter(Model.tid == task_id)
            .filter(Model.is_published)
            .group_by(Model.id)
            .order_by(func.avg(Score.perf).desc())
            .first()
        )
