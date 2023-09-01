# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.services.base.score import ScoreService


router = APIRouter()


@router.get("/get_maximun_principal_score_by_task/{task_id}", response_model={})
async def get_maximun_principal_score_by_task(task_id: int):
    return ScoreService().get_maximun_principal_score_by_task(task_id)


@router.get("/read_users_score_csv/{task_id}", response_model={})
async def read_users_score_csv(task_id: int):
    return ScoreService().read_users_score_csv(task_id)
