# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Response

from app.domain.schemas.base.example import (
    ConvertS3ImageToBase64Request,
    CreateExampleRequest,
    DownloadAdditionalDataExamplesRequest,
    DownloadAllExamplesRequest,
    DownloadExamplesRequest,
    GetExampleRequest,
    PartialCreationExampleRequest,
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
        model.round_id,
    )


@router.post("/partial_creation_generative_example", response_model={})
def partial_creation_generative_example(
    model: PartialCreationExampleRequest,
):
    return ExampleService().partial_creation_generative_example(
        model.example_info,
        model.context_id,
        model.user_id,
        model.tag,
        model.round_id,
        model.task_id,
    )


@router.post("/create_example", response_model={})
def create_example(
    model: CreateExampleRequest,
):
    return ExampleService().create_example(
        model.context_id,
        model.user_id,
        model.model_wrong,
        model.model_endpoint_name,
        model.input_json,
        model.output_json,
        model.metadata,
        model.tag,
    )


@router.post("/update_creation_generative_example_by_example_id", response_model={})
def update_creation_generative_example_by_example_id(
    model: UpdateCreationExampleGenerativeRequest,
):
    return ExampleService().update_creation_generative_example_by_example_id(
        model.example_id,
        model.example_info,
        model.metadata_json,
        model.round_id,
        model.user_id,
        model.context_id,
        model.task_id,
        model.model_wrong,
    )


@router.post("/download_all_created_examples", response_model={})
def download_all_created_examples(
    model: DownloadAllExamplesRequest,
):
    examples = ExampleService().download_all_created_examples(model.task_id)
    return Response(
        content=examples,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="data.json"'},
    )


@router.post("/download_created_examples_user", response_model={})
def download_created_examples_user(
    model: DownloadExamplesRequest,
):
    return ExampleService().download_created_examples_user(
        model.task_id, model.user_id, model.amount
    )


@router.post("/download_additional_data", response_model={})
def download_additional_data(
    model: DownloadAdditionalDataExamplesRequest,
):
    return ExampleService().download_additional_data(model.folder_direction)


@router.post("/convert_s3_image_to_base_64", response_model={})
def convert_s3_image_to_base_64(
    model: ConvertS3ImageToBase64Request,
):
    return ExampleService().convert_s3_image_to_base_64(
        model.image_name, model.bucket_name
    )
