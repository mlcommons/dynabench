# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.services.builder_and_evaluation.evaluation_decentralized import (
    Evaluation,
)


router = APIRouter()


@router.get("/")
async def hello():
    model = Evaluation()
    api = model.trigger_sqs()
    return {"api": api}
