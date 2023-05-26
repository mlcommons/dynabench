# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from pydantic import BaseModel


class StillAllowedToSubmit(BaseModel):
    round_id: int
    user_id: int
    max_amount_examples_on_a_day: int


class AmountExamplesCreatedToday(BaseModel):
    round_id: int
    user_id: int
