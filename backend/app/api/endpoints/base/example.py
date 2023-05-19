# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Response

from app.domain.schemas.base.example import (
    DownloadAdditionalDataExamplesRequest,
    DownloadAllExamplesRequest,
    DownloadExamplesRequest,
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


@router.post("/download_all_created_examples", response_model={})
def download_all_created_examples(
    model: DownloadAllExamplesRequest,
):
    import json
    from datetime import datetime

    from fastapi.responses import StreamingResponse
    from sqlalchemy.orm.state import InstanceState

    class CustomJSONEncoder(json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, InstanceState):
                return None  # Skip serializing the problematic object
            return super().default(obj)

    examples = ExampleService().download_all_created_examples(model.task_id)

    def json_lines_generator(examples):
        for item in examples:
            yield json.dumps(item, cls=CustomJSONEncoder) + "\n"

    return StreamingResponse(
        content=json_lines_generator(examples),
        media_type="application/json-lines",
        headers={"Content-Disposition": 'attachment; filename="data.jsonl"'},
    )


@router.post("/download_created_examples_user", response_model={})
def download_created_examples_user(
    model: DownloadExamplesRequest,
):
    return ExampleService().download_created_examples_user(model.task_id, model.user_id)


@router.post("/download_additional_data", response_model={})
def download_additional_data(
    model: DownloadAdditionalDataExamplesRequest,
):
    zip_file = ExampleService().download_additional_data(model.bucket_name)
    return Response(
        content=zip_file,
        headers={
            "Content-Disposition": "attachment; filename=files.zip",
            "Content-Type": "application/zip",
        },
    )
