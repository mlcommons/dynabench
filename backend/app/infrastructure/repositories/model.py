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

    def get_model_in_the_loop(self, task_id: int) -> dict:
        models_in_the_loop = (
            self.session.query(self.model.light_model)
            .filter(self.model.tid == task_id, self.model.is_in_the_loop == 1)
            .order_by(func.random())
            .first()
        )
        return models_in_the_loop

    def update_light_model(self, id: int, light_model: str) -> dict:
        instance = self.session.query(self.model).filter(self.model.id == id).first()
        light_model = f"{light_model}/model/single_evaluation"
        instance.light_model = light_model
        instance.deployment_status = "deployed"
        instance.is_publish = 0
        instance.is_in_the_loop = 0
        self.session.flush()
        self.session.commit()
        return

    def get_lambda_models(self) -> list:
        models = (
            self.session.query(self.model)
            .filter(self.model.light_model is not None)
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
