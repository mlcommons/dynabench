# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.schemas.base.task_proposals import AddTaskProposalRequest
from app.domain.services.base.task_proposals import TaskProposalService


router = APIRouter()


@router.get("/validate_no_duplicate_task_code/{task_code}", response_model={})
async def validate_no_duplicate_task_code(task_code: str):
    return TaskProposalService().validate_no_duplicate_task_code(task_code)


@router.post("/add_task_proposal", response_model={})
async def add_task_proposal(model: AddTaskProposalRequest):
    return TaskProposalService().add_task_proposal(
        model.user_id, model.task_code, model.name, model.desc, model.longdesc
    )
