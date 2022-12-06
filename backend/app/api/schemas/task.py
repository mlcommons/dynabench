# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from pydantic import BaseModel


class GetTaskInfoByIdResponse(BaseModel):
    task_id: int


class GetTaskInfoByCodeResponse(BaseModel):
    task_code: str
