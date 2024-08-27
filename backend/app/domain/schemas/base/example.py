# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import Optional

from pydantic import BaseModel


class GetExampleRequest(BaseModel):
    real_round_id: int
    user_id: int
    num_matching_validations: int
    validate_non_fooling: bool
    task_id: int


class ValidateExampleRequest(BaseModel):
    example_id: int
    user_id: int
    label: str
    mode: str = "user"
    metadata_json: dict
    task_id: int
    validate_non_fooling: bool
    round_id: int


class CreateExampleRequest(BaseModel):
    context_id: int
    user_id: int
    input_json: dict
    model_wrong: Optional[bool] = False
    model_endpoint_name: Optional[str] = None
    output_json: Optional[dict] = None
    metadata: Optional[dict] = None
    tag: Optional[str] = "generative"
    increment_context: Optional[bool] = False
    text: Optional[str] = None
    task_id: Optional[int] = None
    round_id: Optional[int] = None


class PartialCreationExampleRequest(BaseModel):
    example_info: dict
    context_id: int
    user_id: int
    tag: str = "generative"
    round_id: int
    task_id: int


class UpdateCreationExampleGenerativeRequest(BaseModel):
    example_id: int
    example_info: dict
    metadata_json: dict
    round_id: int
    user_id: int
    context_id: int
    task_id: int
    model_wrong: Optional[int] = 0


class DownloadAllExamplesRequest(BaseModel):
    task_id: int


class DownloadExamplesRequest(BaseModel):
    task_id: int
    user_id: Optional[int] = None
    amount: Optional[int] = 5


class DownloadAdditionalDataExamplesRequest(BaseModel):
    folder_direction: str


class ConvertS3ImageToBase64Request(BaseModel):
    image_name: str
    bucket_name: str
