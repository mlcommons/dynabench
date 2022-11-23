# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.dataset import DatasetRepository


class DatasetService:
    def __init__(self):
        self.dataset_repository = DatasetRepository()
