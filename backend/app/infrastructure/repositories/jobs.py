# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Jobs
from app.infrastructure.repositories.abstract import AbstractRepository

import json

class JobRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Jobs)
    
    def metadata_exists(self, model: dict):
        model = json.dumps(model)
        self.session.query(self.model).filter(self.model.job_metadata == model).first()

    def create_registry(self, model: dict):
        model = json.dumps(model)
        self.session.add(self.model(job_metadata=model))
        self.session.commit()
    
    def remove_registry(self, model: dict):
        model = json.dumps(model)
        self.session.query(self.model).filter(self.model.job_metadata == model).delete()
        self.session.commit()
