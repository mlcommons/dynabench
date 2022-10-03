# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import numpy as np
from appraiser import Appraiser
from classifier import LogisticClassifier as Classifier


class CustomAppraiser(Appraiser):
    def __init__(self) -> None:
        super().__init__()
        self.name = "my_debug"
        # The classifier can be accessed by self.clf.
        # e.g., self.clf.fit(train_X, train_y)
        # train_X has the shape (N, D) where N:=# samples, D:=# dimensions (2048)
        # train_y has the shape (N, 1)
        self.clf = Classifier()

    def fit(self, train_X, train_y, val_X, val_y):
        """
        Fit your appraiser with the noisy training and validation data.
        """
        # (train_X.shape) -> (N, D)
        # (train_y.shape) -> (N, 1)
        # (val_X.shape) -> (N', D)
        # (val_y.shape) -> (N', 1)

        self.shape = train_X.shape[0]
        self.sample = np.random.choice(self.shape, self.shape, replace=False)

    def propose(self, budget):
        """
        Return the indices to the first :budget samples,
        which you want the benchmark to fix.
        """
        return self.sample[:budget]
