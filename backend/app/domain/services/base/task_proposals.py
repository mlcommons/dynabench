# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.helpers.email import EmailHelper
from app.infrastructure.repositories.task import TaskRepository
from app.infrastructure.repositories.taskproposal import TaskProposalRepository
from app.infrastructure.repositories.user import UserRepository


class TaskProposalService:
    def __init__(self):
        self.task_proposal_repository = TaskProposalRepository()
        self.user_repository = UserRepository()
        self.task_repository = TaskRepository()
        self.email_helper = EmailHelper()

    def validate_no_duplicate_task_code(self, task_code: str):
        return (
            False
            if self.task_repository.validate_no_duplicate_task_code(task_code)
            is not None
            else True
        )

    def add_task_proposal(
        self, user_id: int, task_code: str, name: str, desc: str, longdesc: str
    ):
        user_email = self.user_repository.get_user_email(user_id)[0]
        self.email_helper.send(
            contact=user_email,
            cc_contact="dynabench-site@mlcommons.org",
            template_name="task_proposal_update.txt",
            msg_dict={"name": name, "code": task_code, "desc": longdesc},
            subject=f"Proposal for task {task_code}",
        )
        self.email_helper.send(
            contact="juan.ciro@factored.ai",
            cc_contact="dynabench-site@mlcommons.org",
            template_name="task_proposal_update.txt",
            msg_dict={"name": name, "code": task_code, "desc": longdesc},
            subject=f"Proposal for task {task_code}",
        )
        task_code = f"{task_code}-{user_id}"
        return self.task_proposal_repository.add_task_proposal(
            user_id, task_code, name, desc, longdesc
        )
