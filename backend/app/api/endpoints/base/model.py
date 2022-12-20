# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter, BackgroundTasks, Depends

from app.domain.schemas.base.model import (
    ModelInTheLoopRequest,
    ModelInTheLoopResponse,
    UploadModelToS3AndEvaluateRequest,
)
from app.domain.services.base.model import ModelService


router = APIRouter()


@router.post("/get_model_in_the_loop", response_model=ModelInTheLoopResponse)
def get_model_in_the_loop(model: ModelInTheLoopRequest):
    return ModelService().get_model_in_the_loop(model.task_id)


@router.post("/upload_model_to_s3_and_evaluate")
def upload_model_to_s3_and_evaluate(
    background_tasks: BackgroundTasks,
    model: UploadModelToS3AndEvaluateRequest = Depends(
        UploadModelToS3AndEvaluateRequest
    ),
):
    background_tasks.add_task(
        ModelService().upload_model_to_s3_and_evaluate,
        model.model_name,
        model.description,
        model.num_paramaters,
        model.languages,
        model.license,
        model.file_name,
        model.user_id,
        model.task_code,
        model.file_to_upload,
    )
    return "The model will be evaluated in the background"
