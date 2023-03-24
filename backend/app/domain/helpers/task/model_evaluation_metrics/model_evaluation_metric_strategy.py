# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from abc import ABC, abstractmethod


class ModelEvaluationMetricStrategy(ABC):
    @abstractmethod
    def model_evaluation(
        self, prediction: str, ground_truth: str, artifacts: dict = {}
    ) -> int:
        pass
