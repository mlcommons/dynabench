# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.api.schemas.model import ModelSingleInput, ModelSingleOutput
from app.domain.model import ModelController
from fastapi import APIRouter


router = APIRouter()


@router.post("/single_evaluation", response_model=ModelSingleOutput)
async def single_evaluation(data: ModelSingleInput):
    model = ModelController()
    answer = model.single_evaluation(data.input_text)
    return answer