# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.helpers.task.model_evaluation_metrics.model_evaluation_metric_strategy import (
    ModelEvaluationMetricStrategy,
)


class ExactMatch(ModelEvaluationMetricStrategy):
    def model_evaluation(
        self, prediction: str, ground_truth: str, artifacts: dict = {}
    ) -> int:
        return int(prediction != ground_truth)
