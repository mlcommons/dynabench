# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from datetime import datetime as Time
from typing import List, Optional

from pydantic import BaseModel


class UserBadges(BaseModel):
    id: int
    name: str
    awarded: Time
    uid: int
    metadata_json: Optional[str] = None


class UserInfoBadges(BaseModel):
    id: int
    email: str
    username: str
    examples_created: Optional[int] = None
    examples_verified: Optional[int] = None
    examples_verified_correct: Optional[int] = None
    examples_verified_correct_fooled: Optional[int] = None
    examples_verified_incorrect_fooled: Optional[int] = None
    examples_fooled: Optional[int] = None
    badges: List[UserBadges] = []
