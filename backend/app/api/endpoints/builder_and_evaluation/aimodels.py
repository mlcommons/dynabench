# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.services.builder_and_evaluation.aimodels import AIModels


router = APIRouter()


@router.get("/initiate_lambda_models")
def initiate_lambda_models() -> None:
    return AIModels().initiate_lambda_models()
