# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.schemas.base.example import GetExampleRequest
from app.domain.services.base.example import ExampleService


router = APIRouter()


@router.post("/get_example_to_validate")
def get_example_to_validate(model: GetExampleRequest):
    return ExampleService().get_example_to_validate(
        model.real_round_id,
        model.user_id,
        model.num_matching_validations,
        model.validate_non_fooling,
    )


@router.get("/get_validate_configuration")
def get_validate_configuration(task_id: int):
    return ExampleService().get_validate_configuration(task_id)
