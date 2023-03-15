# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import numpy as np
import sklearn.ensemble
import sklearn.linear_model
import sklearn.svm
from sklearn.metrics import balanced_accuracy_score, confusion_matrix, f1_score


class Model:
    def __init__(self):
        self.initialized = True
        self._model = sklearn.ensemble.VotingClassifier(
            estimators=[
                ("svm", sklearn.svm.SVC(probability=True, random_state=42)),
                ("lr", sklearn.linear_model.LogisticRegression(random_state=42)),
            ],
            voting="soft",
            weights=None,
        )

    def train(self, x_train: list, y_train: list):
        self._model.fit(x_train, y_train)

    def predict(self, x_test):
        return self._model.predict(x_test)

    def evaluate(self, eval_y, pred_y):
        return balanced_accuracy_score(eval_y, pred_y)
