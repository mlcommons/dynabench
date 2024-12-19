# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sqlalchemy.sql.expression import func

from app.infrastructure.models.models import (
    ChallengesTypes,
    Context,
    Example,
    Round,
    Task,
    TaskProposal,
)
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

    def get_s3_bucket_by_task_id(self, task_id: int):
        return (
            self.session.query(self.model.s3_bucket)
            .filter(self.model.id == task_id)
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
        with self.session as session:
            session.query(self.model).filter(self.model.id == task_id).update({})
            session.flush()
            session.commit()

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

    def get_task_instructions(self, task_id: int):
        return (
            self.session.query(self.model.general_instructions)
            .filter(self.model.id == task_id)
            .first()
        )

    def update_task_instructions(self, task_id: int, instructions: dict):
        with self.session as session:
            session.query(self.model).filter_by(id=task_id).update(
                {"general_instructions": instructions}
            )
            session.flush()
            session.commit()

    def get_challenges_types(self):
        return self.session.query(ChallengesTypes).all()

    def get_tasks_with_samples_created_by_user(self, user_id: int):
        return (
            self.session.query(self.model.id, self.model.name)
            .join(Round, Round.tid == self.model.id)
            .join(Context, Context.r_realid == Round.id)
            .join(Example, Example.cid == Context.id)
            .filter(Example.uid == user_id)
            .distinct()
            .all()
        )

    def validate_no_duplicate_task_name(self, task_name: str):
        return (
            self.session.query(self.model, TaskProposal)
            .filter(
                self.model.name == task_name.lower()
                or TaskProposal.name == task_name.lower()
            )
            .first()
        )

    def update_config_yaml(self, task_id: int, config_yaml: dict):
        with self.session as session:
            session.query(self.model).filter_by(id=task_id).update(
                {"config_yaml": config_yaml}
            )
            session.flush()
            session.commit()

    def get_s3_bucket_by_task_id(self, task_id: int):
        return (
            self.session.query(self.model.s3_bucket)
            .filter(self.model.id == task_id)
            .first()
        )

    def get_max_amount_examples_on_a_day(self, task_id: int):
        return (
            self.session.query(self.model.max_amount_examples_on_a_day)
            .filter(self.model.id == task_id)
            .first()
        )

    def get_dynalab_threshold(self, task_id: int):
        return (
            self.session.query(self.model.dynalab_threshold)
            .filter(self.model.id == task_id)
            .first()
        )

    def get_dynalab_hr_diff(self, task_id: int):
        return (
            self.session.query(self.model.dynalab_hr_diff)
            .filter(self.model.id == task_id)
            .first()
        )
