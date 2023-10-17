# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sqlalchemy.sql import func, text

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

    def get_maximun_principal_score_by_task(self, task_id: int, datasets: list):
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

    def get_downstream_scores(self, dataset_id: int, model_id: int):
        return (
            self.session.query(Score)
            .filter(Score.did == dataset_id)
            .filter(Score.mid == model_id)
            .all()
        )

    def check_if_model_has_all_scoring_datasets(
        self, model_id: int, scoring_datasets: list
    ) -> bool:
        return self.session.query(func.count(Score.did.distinct())).filter(
            Score.mid == model_id
        ).filter(Score.did.in_(scoring_datasets)).scalar() == len(scoring_datasets)

    def fix_matthews_correlation(self, model_id: int):
        sql = text(
            """
            UPDATE dynabench.scores
            SET metadata_json = JSON_SET(
                metadata_json,
                '$.new_accuracy',
                CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.matthews_correlation'))
                AS DECIMAL(18, 9))
            )
            WHERE JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.matthews_correlation'))
            IS NOT NULL AND mid = :model_id
        """
        )
        self.session.execute(sql, {"model_id": model_id})
        self.session.commit()

    def fix_f1_score(self, model_id: int):
        sql = text(
            """
            UPDATE dynabench.scores
            SET metadata_json = JSON_SET(
                metadata_json,
                '$.new_accuracy',
                CAST(JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.f1'))
                AS DECIMAL(18, 9))
            )
            WHERE JSON_UNQUOTE(JSON_EXTRACT(metadata_json, '$.f1'))
            IS NOT NULL AND mid = :model_id
        """
        )
        self.session.execute(sql, {"model_id": model_id})
        self.session.commit()
