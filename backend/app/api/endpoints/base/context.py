# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import asyncio
import json

from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from app.domain.schemas.base.context import (
    GetContextRequest,
    GetFilterContext,
    GetGenerativeContextRequest,
    GetRandomContext,
)
from app.domain.services.base.context import ContextService


router = APIRouter()


@router.post("/get_context", response_model={})
async def get_context(model: GetContextRequest):
    context = ContextService().get_context(
        model.task_id, model.method, model.tags, model.need_context
    )
    return context


@router.get("/get_context_configuration")
async def get_context_configuration(task_id: int):
    context_config = ContextService().get_context_configuration(task_id=task_id)
    return context_config


@router.post("/get_generative_contexts")
async def get_generative_contexts(model: dict):
    model = GetGenerativeContextRequest(**model)
    image_list = await ContextService().get_generative_contexts(
        model.type, model.artifacts
    )
    return JSONResponse(content=image_list, headers={"Cache-Control": "private"})


@router.post("/stream")
async def stream_images(model_info: GetGenerativeContextRequest):
    async def event_generator():
        iterations = 0
        model_info.artifacts["num_images"] = 4
        for _ in range(model_info.artifacts["num_batches"]):
            data = await ContextService().get_generative_contexts(
                model_info.type, model_info.artifacts
            )
            if data:
                iterations += 1
                yield json.dumps(data)
            if iterations > 3:
                raise StopIteration("No more data")
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())


@router.post("/get_filter_context")
def get_filter_context(model: GetFilterContext):
    context = ContextService().get_filter_context(model.real_round_id, model.filters)
    return context


@router.post("/get_contexts_from_s3")
def get_contexts_from_s3(artifacts: dict):
    return ContextService().get_contexts_from_s3(artifacts)


@router.post("/save_contexts_to_s3")
def save_contexts_to_s3(
    task_id: int,
    language: str,
    country: str,
    category: str,
    concept: str,
    description: str,
    file: UploadFile = File(...),
):
    return ContextService().save_contexts_to_s3(
        file, task_id, language, country, description, category, concept
    )


@router.post("/get_random_context_from_key_value")
def get_random_context_from_key_value(model: GetRandomContext):
    return ContextService().get_random_context_from_key_value(
        model.key_name,
        model.key_value,
        model.real_round_id,
        model.distinctive,
        model.user_id,
    )


@router.post("/upload_new_contexts")
def upload_new_contexts(
    task_id: int,
    file: UploadFile = File(...),
):
    return ContextService().upload_new_contexts(task_id, file)


@router.get("/get_distinct_context")
def get_distinct_context(user_id: int, round_id: int):
    return ContextService().get_distinct_context(user_id, round_id)
