# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel


class AddTaskProposalRequest(BaseModel):
    user_id: int
    task_code: str
    name: str
    desc: str
    longdesc: str
