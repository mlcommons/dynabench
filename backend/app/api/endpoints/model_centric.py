# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import FileResponse

from app.api.middleware.verify_token import verify_token
from app.domain.schemas.model_centric import (
    BatchCreateExampleRequest,
    CreateExampleRequest,
)
from app.domain.services.model_centric import ModelCentricService


router = APIRouter(dependencies=[Depends(verify_token)])


@router.post("/single_model_prediction", response_model={})
async def single_model_prediction(model: CreateExampleRequest):
    return ModelCentricService().single_model_prediction(model.model_url, model.sample)


@router.post("/batch_prediction", response_class=FileResponse)
async def batch_prediction(
    background_tasks: BackgroundTasks,
    model: BatchCreateExampleRequest = Depends(BatchCreateExampleRequest),
):
    model_centric_service = ModelCentricService()
    background_tasks.add_task(
        model_centric_service.batch_prediction,
        model.model_url,
        model.context_id,
        model.user_id,
        model.round_id,
        model.task_id,
        {},
        model.tag,
        model.file,
    )
    return {"response": "The model will be evaluated in the background"}
