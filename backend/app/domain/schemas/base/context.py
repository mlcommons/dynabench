# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import Optional

from pydantic import BaseModel


class GetContextRequest(BaseModel):
    task_id: int
    method: str = "least_used"
    tags: Optional[str] = None
    need_context: Optional[bool] = False


class GetGenerativeContextRequest(BaseModel):
    type: str
    artifacts: dict


class GetFilterContext(BaseModel):
    real_round_id: int
    filters: dict


class GetRandomContext(BaseModel):
    key_name: str
    key_value: str
    real_round_id: int
