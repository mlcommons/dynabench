# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.services.builder_and_evaluation.evaluation import Evaluation
from app.infrastructure.repositories.dataset import DatasetRepository
from app.infrastructure.repositories.model import ModelRepository
from app.infrastructure.repositories.round import RoundRepository
from app.infrastructure.repositories.score import ScoreRepository
from app.infrastructure.repositories.task import TaskRepository


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
def get_model_id_and_task_code(task_code: str):
    task = TaskRepository()
    return task.get_model_id_and_task_code(task_code)


@router.get("/get_scoring_datasets")
def get_scoring_datasets(task_id: int):
    dataset = DatasetRepository()
    return dataset.get_scoring_datasets(task_id)


@router.get("/get_round_info_by_round_and_task")
def get_round_info_by_round_and_task(task_id: int, round_id: int):
    rounds = RoundRepository()
    return rounds.get_round_info_by_round_and_task(task_id, round_id)


@router.post("/descentralized_scores")
def post_descentralized_scores(scores: dict):
    score = ScoreRepository()
    return score.add(scores)


@router.get("/get_by_id")
def get_by_id(id: int):
    task = TaskRepository()
    return task.get_by_id(id)


@router.post("/update_light_model")
def update_light_model(params):
    model = ModelRepository()
    model.update_light_model(params["model_id"], params["url_light_model"])


@router.post("/post_dataperf_response")
def post_dataperf_response(response: {}):
    evaluation = Evaluation()
    score = evaluation.evaluate_dataperf_decentralized(response.response)
    return score
