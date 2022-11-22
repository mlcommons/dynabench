# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.connection import Connection
from app.infrastructure.utils.instance_converter import ORMInstanceConverter


class AbstractRepository:
    def __init__(self, model) -> None:
        self.connection = Connection()
        self.session = self.connection.session
        self.model = model
        self.instance_converter = ORMInstanceConverter()
        self.rollback = self.session.rollback()

    def get_all(self):
        instances = self.session.query(self.model).all()
        return instances

    def add(self, instance_dict: dict):
        new_instance = self.model(**instance_dict)
        self.session.add(new_instance)
        self.session.commit()
        new_instance = self.instance_converter.instance_to_dict(new_instance)
        return new_instance

    def get_by_id(self, id: int) -> dict:
        instance = self.session.query(self.model).get(id)
        instance = self.instance_converter.instance_to_dict(instance)
        return instance
