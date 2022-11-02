# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import numpy as np
from sklearn.linear_model import LogisticRegression


class Model:
    def __init__(self):
        self.initialized = True
        self._model = LogisticRegression(random_state=0)

    def train(self, x_train: list, y_train: list):
        x_train = np.array(x_train)
        self._model.fit(x_train, y_train)

    def predict(self, x_test):
        return self._model.predict(x_test)
