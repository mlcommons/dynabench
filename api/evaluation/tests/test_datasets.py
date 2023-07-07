# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import pickle

from datasets import load_datasets


def test_all_dataset_are_pickable(monkeypatch):
    datasets = load_datasets()
    for name, dataset in datasets.items():
        pickle.dumps(dataset)
