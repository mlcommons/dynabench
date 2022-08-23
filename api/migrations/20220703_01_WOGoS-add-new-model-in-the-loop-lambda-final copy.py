# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add log access type to datasets.
"""

from yoyo import step


__depends__ = {"20220703_01_WOGoS-add-column-for-light-models"}
steps = [
    step(
        """
        ALTER TABLE dynabench.models
        ADD COLUMN light_model VARCHAR(500) NULL AFTER endpoint_name
        """
    ),
]
