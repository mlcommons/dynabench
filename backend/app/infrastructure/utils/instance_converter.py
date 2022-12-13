# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Base


class ORMInstanceConverter:
    def instance_to_dict(self, instance):
        """
        Converts an ORM instance or list of instances into a dictionary
        or list of dictionaries respectively.
        """
        if isinstance(instance, (list, tuple)):
            return self._instance_list_to_dict(instance)
        return self._single_instance_to_dict(instance)

    def _single_instance_to_dict(self, instance):
        # If instance is not an ORM entity it must be
        # a string, integer or a normal data type
        # hence we do not have to convert it further
        if not isinstance(instance, Base):
            return instance
        dictionary = {
            column: self.instance_to_dict(value)
            for column, value in instance.__dict__.items()
            if not column.startswith("_")  # Filter out internal use attributes
        }
        return dictionary

    def _instance_list_to_dict(self, instances: list):
        dict_rows = [self.instance_to_dict(instance) for instance in instances]
        return dict_rows
