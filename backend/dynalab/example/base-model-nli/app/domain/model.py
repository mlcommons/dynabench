# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import random


class ModelController:
    def __init__(self) -> None:
        self.initialized = True

    def single_evaluation(self, context, hypothesis):
        response = dict()
        response["label"] = {0: "entailed", 1: "contradictory", 2: "neutral"}[
            int(random.uniform(0, 1))
        ]
        response["prob"] = {
            "entailed": float(random.uniform(0, 1)),
            "contradictory": float(random.uniform(0, 1)),
            "neutral": float(random.uniform(0, 1)),
        }
        return response
