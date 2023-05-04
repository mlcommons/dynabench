# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.schemas.base.example import (
    GetExampleRequest,
    PartiallyCreationExampleGenerativeRequest,
    UpdateCreationExampleGenerativeRequest,
    ValidateExampleRequest,
)
from app.domain.services.base.example import ExampleService


router = APIRouter()


@router.post("/get_example_to_validate")
def get_example_to_validate(model: GetExampleRequest):
    return ExampleService().get_example_to_validate(
        model.real_round_id,
        model.user_id,
        model.num_matching_validations,
        model.validate_non_fooling,
        model.task_id,
    )


@router.get("/get_validate_configuration")
def get_validate_configuration(task_id: int):
    return ExampleService().get_validate_configuration(task_id)


@router.post("/validate_example")
def validate_example(model: ValidateExampleRequest):
    return ExampleService().validate_example(
        model.example_id,
        model.user_id,
        model.label,
        model.mode,
        model.metadata_json,
        model.task_id,
        model.validate_non_fooling,
    )


@router.post("/partial_creation_generative_example", response_model={})
def partial_creation_generative_example(
    model: PartiallyCreationExampleGenerativeRequest,
):
    return ExampleService().partial_creation_generative_example(
        model.example_info,
        model.context_id,
        model.user_id,
        model.tag,
        model.round_id,
        model.task_id,
    )


@router.post("/update_creation_generative_example_by_example_id", response_model={})
def update_creation_generative_example_by_example_id(
    model: UpdateCreationExampleGenerativeRequest,
):
    return ExampleService().update_creation_generative_example_by_example_id(
        model.example_id, model.example_info, model.metadata_json
    )
