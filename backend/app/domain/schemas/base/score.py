# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import Optional

from pydantic import BaseModel


class GetCsvScore(BaseModel):
    task_id: int
    round_id: Optional[int] = None
