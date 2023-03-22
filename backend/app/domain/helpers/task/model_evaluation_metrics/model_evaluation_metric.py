# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import importlib


class ModelEvaluationStrategy:
    def __init__(
        self,
        prediction: str,
        ground_truth: str,
        model_evaluation_metric: str,
        evaluation_artifacts: dict = {},
    ):
        self.prediction = prediction
        self.ground_truth = ground_truth
        self.model_evaluation_metric = model_evaluation_metric
        self.evaluation_artifacts = evaluation_artifacts
        self.ubication = "app.domain.helpers.task.model_evaluation_metrics"

    def evaluate_model(self) -> int:
        module = importlib.import_module(
            f"{self.ubication}.{self.model_evaluation_metric}"
        )
        class_instance = getattr(
            module, self._get_model_evaluation_metric_class_name_()
        )
        if class_instance:
            return class_instance().model_evaluation(
                self.prediction, self.ground_truth, self.evaluation_artifacts
            )
        else:
            raise ValueError("Invalid model_evaluation_metric")

    def _get_model_evaluation_metric_class_name_(self) -> str:
        return "".join([m.title() for m in self.model_evaluation_metric.split("_")])
