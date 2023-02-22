# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.services.base.context import ContextService


router = APIRouter()


@router.get("/get_context", response_model={})
async def get_context(task_id: int, method: str = "least_used", tags=None):
    context = ContextService().get_context(task_id, method, tags)
    return context
