# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter
from pydantic import BaseModel

from app.domain.evaluation import Evaluation
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.task import TaskRepository


class ModelSingleInput(BaseModel):
    text: str


router = APIRouter()


@router.get("/")
async def hello():
    model = Evaluation()
    api = model.trigger_sqs()
    return {"api": api}


@router.get("/get_task_configuration")
def get_task_configuration(id: int) -> dict:
    evaluation = Evaluation()
    return evaluation.get_task_configuration(id)


@router.get("/get_model_id_and_task_code")
def get_model_id_and_task_code(task_id: int):
    task = TaskRepository()
    return task.get_model_id_and_task_code(task_id)


@router.get("/get_scoring_datasets")
def get_scoring_datasets(task_id: int, round_id: int):
    dataset = DatasetRepository()
    return dataset.get_scoring_datasets(task_id, round_id)
