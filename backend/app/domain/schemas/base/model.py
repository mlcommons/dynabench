# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from typing import Optional, Union

from fastapi import File, UploadFile
from pydantic import BaseModel

from app.domain.schemas.utils.parsing_data import form_body


class SingleModelEvaluationRequest(BaseModel):
    model_url: str
    model_input: dict
    context_id: int
    user_id: int
    tag: Optional[str]
    round_id: int
    task_id: int
    sandbox_mode: bool
    model_prediction_label: str
    model_evaluation_metric_info: dict
    model_metadata: Optional[dict]


class SingleModelEvaluationResponse(BaseModel):
    label: Union[str, float]
    input: Union[str, float]
    prediction: str
    probabilities: dict
    fooled: bool


class ModelInTheLoopRequest(BaseModel):
    task_id: int


@form_body
class UploadModelToS3AndEvaluateRequest(BaseModel):
    model_name: Optional[str]
    description: Optional[str]
    num_paramaters: Optional[float]
    languages: Optional[str]
    license: Optional[str]
    file_name: str
    user_id: int
    task_code: str
    file_to_upload: UploadFile = File(...)


@form_body
class BatchCreateExampleRequest(BaseModel):
    model_url: str
    context_id: int
    user_id: int
    round_id: int
    task_id: int
    tag: Optional[str]
    file: UploadFile = File(...)


class ModelPredictionPerDatasetRequest(BaseModel):
    user_id: int
    model_id: int
    dataset_id: int


class ConversationWithBufferMemoryRequest(BaseModel):
    history: dict
    model_name: dict
    provider: str
    prompt: str
    num_answers: int


class UpdateModelInfoRequest(BaseModel):
    model_id: int
    name: Optional[str]
    desc: Optional[str]
    longdesc: Optional[str]
    params: Optional[int]
    languages: Optional[str]
    license: Optional[str]
    source_url: Optional[str] = ""
