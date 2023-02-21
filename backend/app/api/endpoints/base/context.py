# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.services.base.context import ContextService


router = APIRouter()


@router.get("/get_contexts", response_model={})
async def get_contexts(task_id: int, round_id: int, method: str, n: int, tags=None):
    a = ContextService().get_contexts(task_id, round_id, method, n, tags)
    return a[0].context_json
