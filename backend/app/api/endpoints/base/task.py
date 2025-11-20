# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
import os

from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.domain.schemas.base.task import (
    CheckSignConsentRequest,
    GetDynaboardInfoByTaskIdRequest,
    PreliminaryQuestionsRequest,
    SignInConsentRequest,
    UpdateTaskInstructions,
    UpdateYamlConfiguration,
)
from app.domain.services.base.task import TaskService


router = APIRouter()


@router.get("/get_active_tasks_with_round_info", response_model={})
async def get_active_tasks_with_round_info():
    return TaskService().get_active_tasks_with_round_info()


@router.get("/get_tasks_categories", response_model={})
async def get_tasks_categories():
    return TaskService().get_tasks_categories()


@router.get("/get_task_id_by_task_code/{task_code}", response_model={})
async def get_task_id_by_task_code(task_code: str):
    return TaskService().get_task_id_by_task_code(task_code)


@router.get("/get_task_with_round_info_by_task_id/{task_id}", response_model={})
async def get_task_with_round_info_by_task_id(task_id: int):
    return TaskService().get_task_with_round_info_by_task_id(task_id)


@router.get("/get_order_datasets_by_task_id/{task_id}", response_model={})
async def get_order_datasets_by_task_id(task_id: int):
    return TaskService().get_order_datasets_by_task_id(task_id)


@router.get("/get_order_scoring_datasets_by_task_id/{task_id}", response_model={})
async def get_order_scoring_datasets_by_task_id(task_id: int):
    return TaskService().get_order_scoring_datasets_by_task_id(task_id)


@router.get("/get_order_metrics_by_task_id/{task_id}", response_model={})
async def get_order_metrics_by_task_id(task_id: int):
    return TaskService().get_order_metrics_by_task_id(task_id)


@router.get("/get_active_dataperf_tasks", response_model={})
async def get_active_dataperf_tasks():
    return TaskService().get_active_dataperf_tasks()


@router.get("/get_task_instructions/{task_id}", response_model={})
async def get_task_instructions(task_id: int):
    return TaskService().get_task_instructions(task_id)


@router.post("/update_task_instructions", response_model={})
async def update_task_instructions(model: UpdateTaskInstructions):
    return TaskService().update_task_instructions(model.task_id, model.instructions)


@router.post("/get_dynaboard_info_by_task_id/", response_model={})
async def get_dynaboard_info_by_task_id(model: GetDynaboardInfoByTaskIdRequest):
    return TaskService().get_dynaboard_info_by_task_id(
        model.task_id,
        model.ordered_metric_weights,
        model.ordered_scoring_dataset_weights,
        model.sort_by,
        model.sort_direction,
        model.offset,
        model.limit,
        model.metrics,
        model.filtered,
    )


@router.get("/get_challenges_types", response_model={})
async def get_challenges_types():
    return TaskService().get_challenges_types()


@router.get("/get_tasks_with_samples_created_by_user/{user_id}", response_model={})
async def get_tasks_with_samples_created_by_user(user_id: int):
    return TaskService().get_tasks_with_samples_created_by_user(user_id)


@router.get("/get_active_tasks_by_user_id/{user_id}", response_model={})
async def get_active_tasks_by_user_id(user_id: str):
    return TaskService().get_active_tasks_by_user_id(user_id)


@router.post("/sign_in_consent", response_model={})
async def sign_in_consent(model: SignInConsentRequest):
    return TaskService().sign_in_consent(model.task_id, model.user_id)


@router.post("/save_preliminary_questions", response_model={})
async def save_preliminary_questions(model: PreliminaryQuestionsRequest):
    return TaskService().save_preliminary_questions(
        model.task_id, model.user_id, model.preliminary_questions
    )


@router.post("/check_signed_consent", response_model={})
async def check_signed_consent(model: CheckSignConsentRequest):
    return TaskService().check_signed_consent(model.task_id, model.user_id)


@router.post("/check_preliminary_questions_done", response_model={})
async def check_preliminary_questions_done(model: CheckSignConsentRequest):
    return TaskService().check_preliminary_questions_done(model.task_id, model.user_id)


@router.post("/update_config_yaml", response_model={})
async def update_config_yaml(model: UpdateYamlConfiguration):
    return TaskService().update_config_yaml(model.task_id, model.config_yaml)


@router.get("/allow_update_dynalab_submissions/{task_id}/{user_id}", response_model={})
async def allow_update_dynalab_submissions(task_id: int, user_id: int):
    return TaskService().allow_update_dynalab_submissions(task_id, user_id)


@router.get("/download_logs/{task_id}", response_model={})
async def download_logs(task_id: int):
    log_file = TaskService().download_logs(task_id)
    return FileResponse(
        log_file,
        media_type="application/octet-stream",
        filename=os.path.basename(log_file),
    )


@router.get("/get_random_provider_and_model_info", response_model={})
def get_random_provider_and_model_info(task_id: int, user_id: int):
    return TaskService().get_random_provider_and_model_info(task_id, user_id)


@router.get("/get_task_consent", response_model={})
def get_task_consent(task_id: int):
    return TaskService().get_task_consent(task_id)


@router.get("/all_active")
def get_tasks():
    return TaskService().get_tasks()


@router.get("/round_and_metric_data/{task_code}", response_model={})
def get_task_with_round_and_metric_data(task_code: str):
    return TaskService().get_task_with_round_and_metric_data(task_code)


@router.get("/trends/{task_id}", response_model={})
def get_task_trends(task_id: int):
    return TaskService().get_task_trends(task_id)
