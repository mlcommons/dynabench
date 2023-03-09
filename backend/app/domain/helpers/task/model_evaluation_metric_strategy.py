# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from abc import ABC, abstractmethod


class ModelEvaluationMetricStrategy(ABC):
    @abstractmethod
    def model_evaluation(
        self, prediction: str, ground_truth: str, artifacts: dict = {}
    ) -> object:
        pass


class ExactMatch(ModelEvaluationMetricStrategy):
    def model_evaluation(
        self, prediction: str, ground_truth: str, artifacts: dict = {}
    ) -> int:
        return int(prediction != ground_truth)


class StringF1(ModelEvaluationMetricStrategy):
    def model_evaluation(
        self, prediction: str, ground_truth: str, artifacts: dict = {}
    ) -> int:
        from transformers.data.metrics.squad_metrics import compute_f1

        return int(compute_f1(prediction, ground_truth) < artifacts["threshold"])
