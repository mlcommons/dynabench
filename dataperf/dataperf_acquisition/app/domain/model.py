# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import numpy as np
from sklearn.linear_model import LogisticRegression


class Model:
    def __init__(self) -> None:
        self.initialized = True
        self._model = LogisticRegression(max_iter=3000)

    def train(self, x_train: list, y_train: list):
        self._model.fit(x_train, y_train)

    def score(self, x_test, y_test):
        return self._model.score(x_test, y_test)
