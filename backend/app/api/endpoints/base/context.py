# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.schemas.base.context import GetContextRequest
from app.domain.services.base.context import ContextService


router = APIRouter()


@router.post("/get_context", response_model={})
async def get_context(model: GetContextRequest):
    context = ContextService().get_context(model.task_id, model.method, model.tags)
    return context
