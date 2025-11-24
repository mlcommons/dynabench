# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel


class RoundResponse(BaseModel):
    id: int
    tid: int
    rid: int
    url: Optional[str]
    desc: Optional[str]
    longdesc: Optional[str]
    total_fooled: int
    total_verified_fooled: int
    total_collected: int
    total_time_spent: Optional[time]
    start_datetime: Optional[datetime]
    end_datetime: Optional[datetime]
