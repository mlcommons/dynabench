# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter
from fastapi.exceptions import HTTPException

from app.domain.schemas.base.historical_data import (
    DeleteHistoricalDataRequest,
    GetHistoricalDataRequest,
    GetSaveHistoricalDataRequest,
)
from app.domain.services.base.historical_data import HistoricalDataService


router = APIRouter()


@router.post("/get_historical_data_by_task_and_user")
async def get_historical_data_by_task_and_user(model: GetHistoricalDataRequest):
    return HistoricalDataService().get_historical_data_by_task_and_user(
        model.task_id, model.user_id
    )


@router.post("/save_historical_data")
async def save_historical_data(model: GetSaveHistoricalDataRequest):
    history = HistoricalDataService().save_historical_data(
        model.task_id, model.user_id, model.data
    )
    if history:
        return history
    else:
        raise HTTPException(
            status_code=400, detail="Historical data already exists for this task"
        )


@router.post("/delete_historical_data")
async def delete_historical_data(model: DeleteHistoricalDataRequest):
    return HistoricalDataService().delete_historical_data(model.task_id, model.user_id)
