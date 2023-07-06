# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.

import sys


sys.path.append("../api")  # noqa
# TODO: find a way not to comment the follow imports to skip linter
from datasets.common import BaseDataset  # isort:skip
from datasets.mt import flores  # isort:skip


def load_datasets():
    from models.dataset import DatasetModel
    from models.task import TaskModel

    dm = DatasetModel()
    datasets = dm.list()

    tm = TaskModel()
    tasks = tm.list()

    task_dict = dict()
    for task in tasks:
        task_dict[task["id"]] = task

    datasets_dict = {
        "flores101-full-dev": flores.Flores101FullDev(),
        "flores101-full-devtest": flores.Flores101FullDevTest(),
        "flores101-full-test": flores.Flores101FullTest(),
        "flores101-small1-dev": flores.Flores101Small1Dev(),
        "flores101-small1-devtest": flores.Flores101Small1DevTest(),
        "flores101-small1-test": flores.Flores101Small1Test(),
        "flores101-small2-dev": flores.Flores101Small2Dev(),
        "flores101-small2-devtest": flores.Flores101Small2DevTest(),
        "flores101-small2-test": flores.Flores101Small2Test(),
    }

    for dataset in datasets:
        rid, tid = dataset.pop("rid"), dataset.pop("tid")
        del dataset["id"], dataset["desc"]
        if dataset["name"] not in datasets_dict:
            datasets_dict[dataset["name"]] = BaseDataset(
                round_id=rid, task_code=task_dict[tid]["task_code"], **dataset
            )

    return datasets_dict
