# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter, BackgroundTasks, Depends
from fastapi.responses import FileResponse

from app.domain.schemas.base.model import (
    BatchCreateExampleRequest,
    ModelInTheLoopRequest,
    ModelInTheLoopResponse,
    ModelPredictionPerDatasetRequest,
    SingleModelEvaluationRequest,
    SingleModelEvaluationResponse,
    UploadModelToS3AndEvaluateRequest,
)
from app.domain.services.base.model import ModelService


router = APIRouter()


@router.post(
    "/single_model_prediction_submit", response_model=SingleModelEvaluationResponse
)
def single_model_prediction_submit(model: SingleModelEvaluationRequest):
    return ModelService().single_model_prediction_submit(
        model.model_url,
        model.model_input,
        model.context_id,
        model.user_id,
        model.tag,
        model.round_id,
        model.task_id,
        model.sandbox_mode,
    )


@router.post("/batch_prediction", response_class=FileResponse)
async def batch_prediction(
    background_tasks: BackgroundTasks,
    model: BatchCreateExampleRequest = Depends(BatchCreateExampleRequest),
):
    model_centric_service = ModelService()
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


@router.post("/get_model_in_the_loop", response_model=ModelInTheLoopResponse)
async def get_model_in_the_loop(model: ModelInTheLoopRequest):
    return ModelService().get_model_in_the_loop(model.task_id)


@router.post("/upload_model_to_s3_and_evaluate")
async def upload_model_to_s3_and_evaluate(
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


@router.get("/initiate_lambda_models")
def initiate_lambda_models() -> None:
    return ModelService().initiate_lambda_models()


@router.post("/get_model_prediction_per_dataset")
def get_model_prediction_per_dataset(model: ModelPredictionPerDatasetRequest):
    return ModelService().get_model_prediction_per_dataset(
        model.user_id, model.model_id, model.dataset_id
    )
