# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sqlalchemy.sql.expression import func

from app.infrastructure.models.models import ChallengesTypes, Round, Task
from app.infrastructure.repositories.abstract import AbstractRepository


class TaskRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Task)

    def get_task_id_by_task_code(self, task_code: str):
        return (
            self.session.query(self.model.id)
            .filter(self.model.task_code == task_code)
            .first()
        )

    def get_task_code_by_task_id(self, task_id: int):
        return (
            self.session.query(self.model.task_code)
            .filter(self.model.id == task_id)
            .first()
        )

    def get_model_id_and_task_code(self, task):
        instance = (
            self.session.query(self.model).filter(self.model.task_code == task).first()
        )
        return instance

    def update_last_activity_date(self, task_id: int):
        self.session.query(self.model).filter(self.model.id == task_id).update({})
        self.session.commit()

    def get_active_tasks_with_round_info(self):
        return (
            self.session.query(self.model, Round, ChallengesTypes)
            .join(
                Round,
                (Round.tid == self.model.id) & (Round.rid == self.model.cur_round),
            )
            .join(ChallengesTypes, ChallengesTypes.id == self.model.challenge_type)
            .filter(self.model.hidden.is_(False))
            .order_by(func.random())
            .all()
        )

    def get_task_with_round_info_by_task_id(self, task_id: int):
        return (
            self.session.query(self.model, Round, ChallengesTypes)
            .join(
                Round,
                (Round.tid == self.model.id) & (Round.rid == self.model.cur_round),
            )
            .join(ChallengesTypes, ChallengesTypes.id == self.model.challenge_type)
            .filter(self.model.id == task_id)
            .first()
        )

    def get_task_info_by_task_id(self, task_id: int):
        return self.session.query(self.model).filter(self.model.id == task_id).first()

    def get_unpublished_models_in_leaderboard(self, task_id: int):
        return (
            self.session.query(self.model.unpublished_models_in_leaderboard)
            .filter(self.model.id == task_id)
            .first()
        )

    def get_perf_metric_field_name_by_task_id(self, task_id: int):
        return (
            self.session.query(self.model.perf_metric_field_name)
            .filter(self.model.id == task_id)
            .first()
        )

    def get_active_dataperf_tasks(self):
        return (
            self.session.query(self.model)
            .filter(self.model.hidden.is_(False))
            .filter(self.model.challenge_type == 2)
            .all()
        )

    def get_task_is_decen_task(self, task_id: int):
        return (
            self.session.query(self.model.is_decen_task)
            .filter(self.model.id == task_id)
            .first()
        )
