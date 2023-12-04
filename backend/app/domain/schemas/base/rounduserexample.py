# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from pydantic import BaseModel


class StillAllowedToSubmit(BaseModel):
    round_id: int
    user_id: int


class AmountExamplesCreatedToday(BaseModel):
    round_id: int
    user_id: int


class IncrementExamplesSubmittedToday(BaseModel):
    round_id: int
    user_id: int


class RedirectThirdPartyProvider(BaseModel):
    task_id: int
    user_id: int
    round_id: int
