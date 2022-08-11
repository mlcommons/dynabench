# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import Dict, Optional

import constants as c
from pyspark.sql import DataFrame
from sklearn.base import BaseEstimator
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score


def get_trained_classifier(
    df: DataFrame,
    clf: Optional[BaseEstimator] = LogisticRegression(random_state=c.RANDOM_SEED),
) -> BaseEstimator:

    df = df.select(c.LABEL_COL, c.EMB_COL).toPandas()
    X = df[c.EMB_COL].values.tolist()
    y = df[c.LABEL_COL].values.tolist()

    return clf.fit(X, y)


def score_classifier(df: DataFrame, clf: BaseEstimator) -> Dict[str, float]:
    df = df.select(c.LABEL_COL, c.EMB_COL).toPandas()
    X = df[c.EMB_COL].values.tolist()
    y = df[c.LABEL_COL].values.tolist()
    y_pred = clf.predict(X).tolist()

    scores = {}
    scores["accuracy"] = accuracy_score(y, y_pred)
    scores["recall"] = recall_score(y, y_pred, pos_label="1")
    scores["precision"] = precision_score(y, y_pred, pos_label="1")
    scores["f1"] = f1_score(y, y_pred, pos_label="1")
    return scores
