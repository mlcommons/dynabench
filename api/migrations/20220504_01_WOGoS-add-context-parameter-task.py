# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add log access type to datasets.
"""

from yoyo import step


__depends__ = {"20220119_01_WOGoS-add-log-access-type"}

steps = [
    step(
        """
        ALTER TABLE dynabench.tasks ADD context varchar(20) DEFAULT 'min';
        """,
        "ALTER TABLE dynabench.tasks DROP context",
    ),
]
