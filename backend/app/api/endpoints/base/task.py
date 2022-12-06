# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import APIRouter

# from app.api.schemas.task import GetTaskInfoByCodeResponse, GetTaskInfoByIdResponse
from app.domain.services.base.task import TaskService


router = APIRouter()


@router.get("/get_active_tasks_with_round_info", response_model={})
def get_active_tasks_with_round_info():
    return TaskService().get_active_tasks_with_round_info()


@router.get(
    "/get_task_with_round_and_dataset_info_by_task_id/{task_id}", response_model={}
)
def get_task_with_round_and_dataset_info_by_task_id(task_id: int):
    return TaskService().get_task_with_round_and_dataset_info_by_task_id(task_id)


@router.get(
    "/get_task_with_round_and_dataset_info_by_task_code/{task_code}", response_model={}
)
def get_task_with_round_and_dataset_info_by_task_code(task_code: str):
    return TaskService().get_task_with_round_and_dataset_info_by_task_code(task_code)
