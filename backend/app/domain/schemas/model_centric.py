# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from typing import Optional

from fastapi import File, UploadFile
from pydantic import BaseModel

from app.domain.schemas.utils.parsing_data import form_body


class CreateExampleRequest(BaseModel):
    model_url: str
    sample: dict


@form_body
class BatchCreateExampleRequest(BaseModel):
    model_url: str
    context_id: int
    user_id: int
    round_id: int
    task_id: int
    tag: Optional[str]
    file: UploadFile = File(...)
