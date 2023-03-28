# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from sqlalchemy.sql import func

from app.infrastructure.models.models import Model
from app.infrastructure.repositories.abstract import AbstractRepository


class ModelRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Model)

    def get_model_info_by_id(self, model_id: int) -> dict:
        instance = (
            self.session.query(self.model).filter(self.model.id == model_id).one()
        )
        instance = self.instance_converter.instance_to_dict(instance)
        return instance

    def get_model_in_the_loop(self, task_id: int) -> dict:
        models_in_the_loop = (
            self.session.query(self.model.light_model)
            .filter(self.model.tid == task_id, self.model.is_in_the_loop == 1)
            .order_by(func.random())
            .first()
        )
        return models_in_the_loop

    def update_light_model(self, id: int, light_model: str) -> None:
        instance = self.session.query(self.model).filter(self.model.id == id).first()
        light_model = f"{light_model}/model/single_evaluation"
        instance.light_model = light_model
        instance.is_in_the_loop = 0
        self.session.flush()
        self.session.commit()

    def update_model_status(self, id: int) -> None:
        instance = self.session.query(self.model).filter(self.model.id == id).first()
        instance.deployment_status = "deployed"
        instance.is_published = 0
        self.session.flush()
        self.session.commit()

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
        self.session.add(model)
        self.session.flush()
        self.session.commit()
        return model.__dict__

    def get_active_models_by_task_id(self, task_id: int) -> list:
        models = (
            self.session.query(self.model)
            .filter(
                self.model.tid == task_id,
                self.model.is_published == 1,
                self.model.deployment_status == "deployed",
            )
            .all()
        )
        return models

    def get_model_name_by_id(self, id: int) -> str:
        return self.session.query(self.model.name).filter(self.model.id == id).first()

    def get_user_id_by_model_id(self, id: int) -> int:
        return self.session.query(self.model.uid).filter(self.model.id == id).first()

    def get_amount_of_models_per_task(self, task_id: int) -> int:
        return (
            self.session.query(self.model)
            .filter(self.model.tid == task_id, self.model.is_published == 1)
            .count()
        )
