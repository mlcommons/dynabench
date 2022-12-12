# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter

from app.domain.schemas.base.model import ModelInTheLoopRequest, ModelInTheLoopResponse
from app.domain.services.base.model import ModelService


router = APIRouter()


@router.post("/get_model_in_the_loop", response_model=ModelInTheLoopResponse)
def get_model_in_the_loop(model: ModelInTheLoopRequest):
    return ModelService().get_model_in_the_loop(model.task_id)
