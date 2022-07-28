# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter
from pydantic import BaseModel

from app.domain.builder import Builder


class ModelSingleInput(BaseModel):
    text: str


router = APIRouter()


@router.get("/")
async def hello():
    model = Builder()
    api = model.heavy_evaluation()
    return {"api": api}


@router.post("/test")
async def test():
    model = Builder()
    api = model.principal()
    return {"api": api}
