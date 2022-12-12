# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from typing import Optional

from fastapi import Form
from pydantic import BaseModel


class CreateExampleRequest(BaseModel):
    model_url: str
    sample: dict


class BatchCreateExampleRequest(BaseModel):
    model_url: str = Form(...)
    context_id: int = Form(...)
    user_id: int = Form(...)
    round_id: int = Form(...)
    task_id: int = Form(...)
    tag: Optional[str] = Form(...)
