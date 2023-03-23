# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.services.builder_and_evaluation.eval_utils.metrics_dicts import (
    delta_metrics_dict,
    eval_metrics_dict,
)


class Evaluator:
    def __init__(self, config: dict):
        self.config = config
        self.metric = config["perf_metric"]["type"]
        self.metric_func = eval_metrics_dict[self.metric]

    def evaluate(self, formatted_predictions: list, formatted_labels: list) -> dict:
        """
        Evaluates a list of predictions against a list of labels
        using a metric included in the metrics_dictionary.
        """
        target_ids = [x["id"] for x in formatted_labels]
        target_labels_dict = {t["id"]: t["answer"] for t in formatted_labels}  # labels
        target_labels = [target_labels_dict[ids] for ids in target_ids]
        target_tags_dict = {t["id"]: t["tags"] for t in formatted_labels}
        target_tags = [target_tags_dict[ids] for ids in target_ids]

        prediction_labels_dict = {
            p["id"]: p["pred"] for p in formatted_predictions
        }  # predictions
        prediction_labels = [prediction_labels_dict[ids] for ids in target_ids]
        assert len(prediction_labels) == len(target_labels)

        predictions = []
        labels = []
        for ids, target_label in target_labels_dict.items():
            predictions.append(prediction_labels_dict[ids])
            labels.append(target_label)

        perf, perf_dict = self._compute_metric(predictions, labels)

        score_obj = {}
        score_obj["perf"] = perf
        score_obj["perf_std"] = perf_dict.get("perf_std", None)
        score_obj["pretty_perf"] = str(perf) + " %"
        score_obj["metadata_json"] = perf_dict

        if target_tags:

            examples_by_tag = {}
            for ids, pred in prediction_labels_dict.items():
                tags = target_tags_dict[ids]
                target_label = target_labels_dict[ids]
                for tag in tags:
                    examples_by_tag.setdefault(tag, []).append(
                        (ids, pred, target_label)
                    )

            perf_by_tag_tuple_dict = {}
            for k, examples in examples_by_tag.items():
                ids, pred, target_label = list(zip(*examples))
                perf_by_tag_tuple_dict[k] = self._compute_metric(pred, target_label)

            score_obj["metadata_json"]["perf_by_tag"] = score_obj["metadata_json"].get(
                "perf_by_tag", []
            ) + [
                {
                    "tag": tag,
                    "pretty_perf": str(perf) + " %",
                    "perf": perf,
                    "perf_std": perf_dict.get("perf_std", None),
                    "perf_dict": perf_dict,
                }
                for tag, (perf, perf_dict) in perf_by_tag_tuple_dict.items()
            ]

        return score_obj

    def evaluate_delta_metrics(
        self, grouped_predictions: list, grouped_robusts: list, grouped_fairs: list
    ) -> list:

        """
        Calculates the delta metric given a perturb prefix,
        comparing original predictions with robust and fair
        predictions  #Strong assumption is not having to
        calculate alternative metrics from the yaml one.
        """
        delta_metrics = {}

        perturb_prefixes = [metric["type"] for metric in self.config["delta_metrics"]]

        for prefix in perturb_prefixes:
            if prefix == "robustness":
                delta_metric = self._compute_delta_metrics(
                    grouped_predictions, grouped_robusts, prefix
                )
                delta_metrics["robustness"] = delta_metric.get("robustness")
            else:
                delta_metric = self._compute_delta_metrics(
                    grouped_predictions, grouped_fairs, prefix
                )
                return
                delta_metrics["fairness"] = delta_metric.get("fairness")
        return delta_metrics

    def _compute_metric(self, predictions: list, targets: list) -> tuple:
        metric_result = self.metric_func(predictions, targets)
        if isinstance(metric_result, dict):
            score_dict = metric_result
        else:
            score_dict = {self.metric: metric_result}
        return score_dict[self.metric], score_dict

    def _compute_delta_metrics(
        self, grouped_predictions: list, grouped_labels: list, perturb_prefix: str
    ) -> dict:
        """
        predictions: a list of list of predictions. If computing robustness,
        predictions must be concatenated by id.
        targets: a list of labels
        """
        perf_metric = eval_metrics_dict[self.metric]
        delta_metrics_scores = {
            perturb_prefix: delta_metrics_dict[perturb_prefix](
                grouped_predictions, grouped_labels, perf_metric
            )
        }
        return delta_metrics_scores
