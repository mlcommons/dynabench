# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from typing import Optional

from fastapi import File, UploadFile
from pydantic import BaseModel

from app.domain.schemas.utils.parsing_data import form_body


class ModelInTheLoopRequest(BaseModel):
    task_id: int


class ModelInTheLoopResponse(BaseModel):
    light_model: str


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
