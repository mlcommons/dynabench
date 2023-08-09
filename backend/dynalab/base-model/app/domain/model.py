# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


class ModelController:
    def __init__(self) -> None:
        self.initialized = True

    def single_evaluation(self, text: str) -> dict:
        response = dict()
        response["output_text"] = text
        return response
