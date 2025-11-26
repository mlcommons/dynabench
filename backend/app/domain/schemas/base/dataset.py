# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from typing import Optional

from pydantic import BaseModel


class UpdateDatasetInfo(BaseModel):
    access_type: str
    log_access_type: Optional[str] = None
    longdesc: Optional[str] = None
    rid: Optional[int] = 0
    source_url: Optional[str] = None
