# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter

from app.domain.services.base.model import ModelService


router = APIRouter()


@router.get("/get_amount_of_models_by_task/{task_id}", response_model=int)
def get_amount_of_models_by_task(task_id: int):
    return ModelService().get_amount_of_models_by_task(task_id)
