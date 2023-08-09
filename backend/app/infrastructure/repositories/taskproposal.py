# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import TaskProposal
from app.infrastructure.repositories.abstract import AbstractRepository


class TaskProposalRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(TaskProposal)

    def add_task_proposal(
        self, user_id: int, task_code: str, name: str, desc: str, longdesc: str
    ):
        return self.add(
            {
                "uid": user_id,
                "task_code": task_code,
                "name": name,
                "desc": desc,
                "longdesc": longdesc,
            }
        )
