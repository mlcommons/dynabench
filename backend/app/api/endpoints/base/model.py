# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter, BackgroundTasks, Depends, File, UploadFile
from fastapi.responses import FileResponse

from app.domain.schemas.base.model import (
    BatchCreateExampleRequest,
    ConversationWithBufferMemoryRequest,
    ModelInTheLoopRequest,
    ModelPredictionPerDatasetRequest,
    SingleModelEvaluationRequest,
    SingleModelEvaluationResponse,
    UpdateModelInfoRequest,
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
        model.model_prediction_label,
        model.model_evaluation_metric_info,
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


@router.post("/get_model_in_the_loop", response_model=str)
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


@router.post("/get_model_prediction_by_dataset")
def get_model_prediction_by_dataset(model: ModelPredictionPerDatasetRequest):
    file_name = ModelService().get_model_prediction_by_dataset(
        model.user_id, model.model_id, model.dataset_id
    )
    return FileResponse(
        "%s" % (file_name),
        filename=file_name,
        headers={"Access-Control-Expose-Headers": "Content-Disposition"},
    )


@router.get("/get_amount_of_models_by_task/{task_id}", response_model=int)
def get_amount_of_models_by_task(task_id: int):
    return ModelService().get_amount_of_models_by_task(task_id)


@router.post("/upload_prediction_to_s3")
def upload_prediction_to_s3(
    user_id: int, task_code: str, model_name: str, predictions: UploadFile = File(...)
):
    return ModelService().upload_prediction_to_s3(
        user_id, task_code, model_name, predictions
    )


@router.post("/conversation_with_buffer_memory")
def conversation_with_buffer_memory(model: ConversationWithBufferMemoryRequest):
    return ModelService().conversation_with_buffer_memory(
        model.history, model.model_name, model.provider, model.prompt, model.num_answers
    )


@router.get("/update_model_status/{model_id}")
def update_model_status(model_id: int):
    return ModelService().update_model_status(model_id)


@router.get("/get_models_by_user_id/{user_id}")
def get_models_by_user_id(user_id: int):
    return ModelService().get_models_by_user_id(user_id)


@router.get("/delete_model/{model_id}")
def delete_model(model_id: int):
    return ModelService().delete_model(model_id)


@router.get("/get_all_model_info_by_id/{model_id}")
def get_all_model_info_by_id(model_id: int):
    return ModelService().get_all_model_info_by_id(model_id)


@router.post("/update_model_info")
def update_model_info(model: UpdateModelInfoRequest):
    return ModelService().update_model_info(
        model.model_id,
        model.name,
        model.desc,
        model.longdesc,
        model.params,
        model.languages,
        model.license,
        model.source_url,
    )
