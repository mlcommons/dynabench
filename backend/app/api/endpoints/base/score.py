# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.schemas.base.score import (
    CsvResponseModel,
    GetCsvScore,
    GetLeaderboardMetadata,
    HeavyEvaluationScoresRequest,
)
from app.domain.services.base.score import ScoreService


router = APIRouter()


@router.get("/get_maximun_principal_score_by_task/{task_id}", response_model={})
async def get_maximun_principal_score_by_task(task_id: int):
    return ScoreService().get_maximun_principal_score_by_task(task_id)


@router.post("/read_users_score_csv/", response_model=CsvResponseModel)
async def read_users_score_csv(model: GetCsvScore):
    return ScoreService().read_users_score_csv(model.task_id, model.round_id)


@router.post("/read_leaderboard_metadata/", response_model={})
async def read_leaderboard_metadata(model: GetLeaderboardMetadata):
    return ScoreService().read_leaderboard_metadata(model.task_id, model.round_id)


@router.post("/heavy_evaluation_scores")
def heavy_evaluation_scores(model: HeavyEvaluationScoresRequest):
    return ScoreService().add_scores_and_update_model(
        model.model_id, model.scores, model.status, model.message
    )
