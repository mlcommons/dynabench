# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import List

from fastapi import APIRouter, Depends, Request

from app.api.middleware.authentication import validate_access_token
from app.domain.auth.authentication import LoginService
from app.domain.schemas.base.round import RoundResponse
from app.domain.services.base.round import RoundService


router = APIRouter()


@router.get("/get_examples_collected_per_round/{round_id}-{task_id}")
def get_examples_collected_per_round(round_id: int, task_id: int):
    return RoundService().get_examples_collected_per_round(round_id, task_id)


@router.get("/get_all_task_rounds/{task_id}", response_model=List[RoundResponse])
async def get_all_rounds(
    task_id: int, request: Request, token_payload=Depends(validate_access_token)
):
    if not LoginService().is_admin_or_owner(task_id, request):
        raise PermissionError("Unauthorized access to get rounds.")
    return RoundService().get_rounds_by_task_id(task_id)
