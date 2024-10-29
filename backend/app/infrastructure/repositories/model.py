# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sqlalchemy.orm import aliased
from sqlalchemy.sql import func

from app.infrastructure.models.models import (
    ChallengesTypes,
    Dataset,
    Model,
    Score,
    Task,
    User,
)
from app.infrastructure.repositories.abstract import AbstractRepository


class ModelRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Model)

    def get_model_info_by_id(self, model_id: int) -> dict:
        instance = (
            self.session.query(self.model).filter(self.model.id == model_id).one()
        )
        return self.instance_converter.instance_to_dict(instance)

    def get_model_in_the_loop(self, task_id: int) -> dict:
        models_in_the_loop = (
            self.session.query(self.model.light_model)
            .filter(self.model.tid == task_id, self.model.is_in_the_loop == 1)
            .order_by(func.random())
            .first()
        )
        return models_in_the_loop

    def update_light_model(self, id: int, light_model: str) -> None:
        with self.session as session:
            instance = session.query(self.model).filter(self.model.id == id).first()
            light_model = f"{light_model}/model/single_evaluation"
            instance.light_model = light_model
            instance.is_in_the_loop = 0
            session.flush()
            session.commit()

    def update_model_status(self, id: int) -> None:
        with self.session as session:
            instance = session.query(self.model).filter(self.model.id == id).first()
            instance.deployment_status = "deployed"
            instance.is_published = 0
            session.flush()
            session.commit()

    def get_lambda_models(self) -> list:
        models = (
            self.session.query(self.model)
            .filter(self.model.light_model.is_not(None), self.model.is_in_the_loop == 1)
            .all()
        )
        return models

    def create_new_model(
        self,
        task_id: int,
        user_id: int,
        model_name: str,
        shortname: str,
        longdesc: str,
        desc: str,
        languages: str,
        license: str,
        params: str,
        deployment_status: str,
        secret: str,
    ) -> dict:
        model = self.model(
            tid=task_id,
            uid=user_id,
            name=model_name,
            shortname=shortname,
            longdesc=longdesc,
            desc=desc,
            languages=languages,
            license=license,
            params=params,
            deployment_status=deployment_status,
            secret=secret,
        )
        with self.session as session:
            session.add(model)
            session.flush()
            session.commit()
            return model.__dict__

    def get_active_models_by_task_id(self, task_id: int) -> list:
        models = (
            self.session.query(self.model)
            .filter(
                self.model.tid == task_id,
                self.model.is_published == 1,
            )
            .all()
        )
        return models

    def get_model_name_by_id(self, id: int) -> str:
        return self.session.query(self.model.name).filter(self.model.id == id).first()

    def get_user_id_by_model_id(self, id: int) -> int:
        return self.session.query(self.model.uid).filter(self.model.id == id).first()

    def get_amount_of_models_by_task(self, task_id: int) -> int:
        return (
            self.session.query(self.model)
            .filter(
                self.model.tid == task_id,
                self.model.is_published == 1,
                self.model.deployment_status == "deployed",
            )
            .count()
        )

    def get_task_id_by_model_id(self, model_id: int) -> int:
        return (
            self.session.query(self.model.tid).filter(self.model.id == model_id).first()
        )

    def update_published_status(self, model_id: int):
        with self.session as session:
            instance = (
                session.query(self.model).filter(self.model.id == model_id).first()
            )
            instance.is_published = (
                0
                if instance.is_published == 1
                else 1
                if instance.is_published == 0
                else instance.is_published
            )
            session.flush()
            session.commit()

    def get_models_by_user_id(self, user_id: int) -> list:
        return (
            self.session.query(
                Model.id,
                Model.name,
                Model.is_published,
                Model.upload_datetime,
                ChallengesTypes.name.label("community"),
                Task.name.label("task"),
                func.avg(Score.perf).label("score"),
            )
            .join(Task, Task.id == self.model.tid)
            .join(ChallengesTypes, ChallengesTypes.id == Task.challenge_type)
            .join(Score, Score.mid == self.model.id)
            .filter(self.model.uid == user_id)
            .group_by(self.model.id)
            .order_by(self.model.id.desc())
            .all()
        )

    def get_active_tasks_by_user_id(self, user_id):
        return (
            self.session.query(self.model.tid)
            .filter(self.model.uid == user_id)
            .distinct()
            .all()
        )

    def get_total_models_by_user_id(self, user_id):
        return self.session.query(self.model).filter(self.model.uid == user_id).count()

    def delete_model(self, model_id: int):
        with self.session as session:
            session.query(Score).filter(Score.mid == model_id).delete()
            session.query(self.model).filter(self.model.id == model_id).delete()
            session.flush()
            session.commit()

    def get_all_model_info_by_id(self, model_id: int):
        valid_datasets = (
            self.session.query(Dataset.id)
            .join(Model, Model.tid == Dataset.tid)
            .join(Task, Task.id == Model.tid)
            .filter(Dataset.access_type == "scoring")
            .filter(Dataset.tid == Task.id)
            .filter(Model.id == model_id)
            .all()
        )
        has_scores = self.session.query(Score.mid).filter(Score.mid == model_id).all()
        query = (
            self.session.query(
                Model.id,
                Model.name,
                Model.desc,
                Model.longdesc,
                Model.params,
                Model.languages,
                Model.license,
                Model.source_url,
                Model.light_model,
                Model.deployment_status,
                Model.is_in_the_loop,
                Model.is_published,
                Model.upload_datetime,
                ChallengesTypes.name.label("community"),
                Task.name.label("task"),
                func.coalesce(func.avg(Score.perf), 0).label("score"),
            )
            .join(Task, Task.id == self.model.tid)
            .join(ChallengesTypes, ChallengesTypes.id == Task.challenge_type)
            .outerjoin(Score, Score.mid == self.model.id)
            .filter(self.model.id == model_id)
            .group_by(self.model.id)
        )
        if len(has_scores) != 0:
            query = query.filter(Score.did.in_([item[0] for item in valid_datasets]))
        return query.one()

    def update_model_info(
        self,
        model_id: int,
        name: str,
        desc: str,
        longdesc: str,
        params: float,
        languages: str,
        license: str,
        source_url: str,
    ):
        with self.session as session:
            (
                session.query(self.model)
                .filter(self.model.id == model_id)
                .update(
                    {
                        "name": name,
                        "desc": desc,
                        "longdesc": longdesc,
                        "params": params,
                        "languages": languages,
                        "license": license,
                        "source_url": source_url,
                    }
                )
            )
            session.flush()
            return session.commit()

    def download_model_results(self, task_id: int):
        m = aliased(Model)
        s = aliased(Score)
        u = aliased(User)
        t = aliased(Task)
        d = aliased(Dataset)

        query = (
            self.session.query(
                m.id.label("model_id"),
                m.name.label("model_name"),
                m.shortname,
                m.upload_datetime,
                m.is_published,
                t.name.label("task_name"),
                s.id.label("score_id"),
                s.perf.label("performance"),
                s.metadata_json,
                u.id.label("user_id"),
                u.username,
                u.email,
                d.id.label("dataset_id"),
                d.name.label("dataset_name"),
            )
            .join(s, m.id == s.mid)
            .join(u, m.uid == u.id)
            .join(t, m.tid == t.id)
            .join(d, s.did == d.id)
            .filter(m.tid == task_id)
            .all()
        )
        return query

    def get_amount_of_models_uploaded_in_hr_diff(
        self, task_id: int, user_id: int, hr_diff: int
    ):
        # hr_diff is in hours
        return (
            self.session.query(func.count(self.model.id))
            .filter(
                self.model.tid == task_id,
                self.model.uid == user_id,
                func.timediff(func.now(), self.model.upload_datetime)
                < f"0:{hr_diff}:0",
            )
            .scalar()
        )
