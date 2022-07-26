# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.api.schemas.model import ModelSingleInput
from app.domain.model import ModelController
from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def hello():
    model = ModelController()
    text = model.single_evaluation("I hate lambda")
    return {"message": text}


@router.post("/single_evaluation")
async def single_evaluation(data: ModelSingleInput):
    model = ModelController()
    text = model.single_evaluation(data.context, data.hypothesis)
    return {"message": text}
