# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.jobs import JobRepository


class JobService:
    def __init__(self):
        self.job_repository = JobRepository()

    def metadata_exists(self, model: dict):
        exists = self.job_repository.metadata_exists(model)
        if exists:
            return True
        return False

    def determine_queue_position(self, model: dict):
        return self.job_repository.determine_queue_position(model)

    def create_registry(self, model: dict):
        self.job_repository.create_registry(model)

    def remove_registry(self, model: dict):
        self.job_repository.remove_registry(model)
