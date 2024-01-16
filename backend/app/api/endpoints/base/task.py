# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter

from app.domain.schemas.base.task import (
    CheckSignConsentRequest,
    GetDynaboardInfoByTaskIdRequest,
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


@router.post("/check_sign_consent", response_model={})
async def check_sign_consent(model: CheckSignConsentRequest):
    return TaskService().check_sign_consent(model.task_id, model.user_id)


@router.post("/update_config_yaml", response_model={})
async def update_config_yaml(model: UpdateYamlConfiguration):
    return TaskService().update_config_yaml(model.task_id, model.config_yaml)


@router.get("/allow_update_dynalab_submissions/{task_id}/{user_id}", response_model={})
async def allow_update_dynalab_submissions(task_id: int, user_id: int):
    return TaskService().allow_update_dynalab_submissions(task_id, user_id)
