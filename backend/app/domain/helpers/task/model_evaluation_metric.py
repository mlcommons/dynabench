# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.


def exact_match(prediction: str, ground_truth: str) -> int:
    return int(prediction != ground_truth)


def string_f1(
    prediction: str, ground_truth: str, evaluation_artifacts: dict = {}
) -> int:
    from transformers.data.metrics.squad_metrics import compute_f1

    return int(compute_f1(prediction, ground_truth) < evaluation_artifacts["threshold"])


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

    def evaluate_model(self) -> int:
        if self.model_evaluation_metric == "exact_match":
            return exact_match(self.prediction, self.ground_truth)
        elif self.model_evaluation_metric == "string_f1":
            return string_f1(
                self.prediction, self.ground_truth, self.evaluation_artifacts
            )
        else:
            raise ValueError("Invalid model_evaluation_metric")
