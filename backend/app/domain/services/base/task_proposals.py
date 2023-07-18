# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.helpers.email import EmailHelper
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.taskproposal import TaskProposalRepository


class TaskProposalService:
    def __init__(self):
        self.task_proposal_repository = TaskProposalRepository()
        self.task_repository = TaskRepository()
        self.email_helper = EmailHelper()

    def validate_no_duplicate_task_code(self, task_code: str):
        return (
            1
            if self.task_repository.validate_no_duplicate_task_code(task_code)
            is not None
            else 0
        )

    def add_task_proposal(
        self, user_id: int, task_code: str, name: str, desc: str, longdesc: str
    ):
        self.email_helper.send(
            contact="juan.ciro@factored.ai",
            cc_contact="dynabench-site@mlcommons.org",
            template_name="task_proposal_update.txt",
            msg_dict={"name": name, "code": task_code, "desc": longdesc},
            subject=f"Proposal for task {task_code}",
        )
        return self.task_proposal_repository.add_task_proposal(
            user_id, task_code, name, desc, longdesc
        )
