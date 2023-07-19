# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, WebSocket

from app.domain.schemas.base.context import (
    GetContextRequest,
    GetGenerativeContextRequest,
)
from app.domain.services.base.context import ContextService


router = APIRouter()


@router.post("/get_context", response_model={})
async def get_context(model: GetContextRequest):
    context = ContextService().get_context(model.task_id, model.method, model.tags)
    return context


@router.get("/get_context_configuration")
async def get_context_configuration(task_id: int):
    context_config = ContextService().get_context_configuration(task_id=task_id)
    return context_config


@router.websocket("/ws")
async def websocket_generative_context(websocket: WebSocket):
    await websocket.accept()
    model_info = await websocket.receive_json()
    model_info = dict(model_info)
    for _ in range(4):
        data = ContextService().get_generative_contexts(
            model_info["type"], model_info["artifacts"]
        )
        await websocket.send_json(data)
    await websocket.close()


@router.post("/get_generative_contexts")
async def get_generative_contexts(model: GetGenerativeContextRequest):
    image_list = ContextService().get_generative_contexts(model.type, model.artifacts)
    return image_list
