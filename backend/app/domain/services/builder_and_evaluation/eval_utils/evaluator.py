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


def format_data_for_evaluation(
    predictions: list, labels: list, tags: bool = False
) -> dict:
    target_ids = [x["id"] for x in labels]
    target_labels_dict = {t["id"]: t["answer"] for t in labels}  # labels
    target_labels = [target_labels_dict[ids] for ids in target_ids]

    prediction_labels_dict = {p["id"]: p["pred"] for p in predictions}  # predictions
    prediction_labels = [prediction_labels_dict[ids] for ids in target_ids]
    assert len(prediction_labels) == len(target_labels)
    predictions = []
    labels = []
    for ids, target_label in target_labels_dict.items():
        predictions.append(prediction_labels_dict[ids])
        labels.append(target_label)
    if tags:
        target_tags_dict = {t["id"]: t["tags"] for t in labels}
        target_tags = [target_tags_dict[ids] for ids in target_ids]
        return (
            predictions,
            labels,
            target_tags,
            prediction_labels_dict,
            target_labels_dict,
            target_tags_dict,
        )
    else:
        return predictions, labels


def evaluate(metric: str, formatted_predictions: list, formatted_labels: list) -> dict:
    """
    Evaluates a list of predictions against a list of labels
    using a metric included in the metrics_dictionary.
    """

    (
        predictions,
        labels,
        target_tags,
        prediction_labels_dict,
        target_labels_dict,
        target_tags_dict,
    ) = format_data_for_evaluation(formatted_predictions, formatted_labels, tags=True)
    perf, perf_dict = _compute_metric(metric, predictions, labels)
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
                examples_by_tag.setdefault(tag, []).append((ids, pred, target_label))

        perf_by_tag_tuple_dict = {}
        for k, examples in examples_by_tag.items():
            ids, pred, target_label = list(zip(*examples))
            perf_by_tag_tuple_dict[k] = _compute_metric(metric, pred, target_label)

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


def evaluation_without_tags(metric: str, predictions: list, labels: list) -> dict:
    predictions, labels = format_data_for_evaluation(predictions, labels, tags=False)
    perf, perf_dict = _compute_metric(metric, predictions, labels)
    score_obj = {}
    score_obj["perf"] = perf
    score_obj["perf_std"] = perf_dict.get("perf_std", None)
    score_obj["pretty_perf"] = str(perf) + " %"
    score_obj["metadata_json"] = perf_dict
    return score_obj


def evaluate_delta_metrics(
    metric: str,
    grouped_predictions: list,
    grouped_robusts: list,
    grouped_fairs: list,
    list_delta_metrics: list,
) -> list:

    """
    Calculates the delta metric given a perturb prefix,
    comparing original predictions with robust and fair
    predictions  #Strong assumption is not having to
    calculate alternative metrics from the yaml one.
    """
    delta_metrics = {}

    perturb_prefixes = [metric["type"] for metric in list_delta_metrics]

    for prefix in perturb_prefixes:
        if prefix == "robustness":
            delta_metric = _compute_delta_metrics(
                metric, grouped_robusts, grouped_predictions, prefix
            )
            delta_metrics["robustness"] = delta_metric.get("robustness")
        else:
            delta_metric = _compute_delta_metrics(
                metric, grouped_fairs, grouped_predictions, prefix
            )
            delta_metrics["fairness"] = delta_metric.get("fairness")
    return delta_metrics


def _compute_metric(metric: str, predictions: list, targets: list) -> tuple:
    metric_result = eval_metrics_dict[metric](predictions, targets)
    if isinstance(metric_result, dict):
        score_dict = metric_result
    else:
        score_dict = {metric: metric_result}
    return score_dict[metric], score_dict


def _compute_delta_metrics(
    metric: str, grouped_predictions: list, grouped_labels: list, perturb_prefix: str
) -> dict:
    """
    predictions: a list of list of predictions. If computing robustness,
    predictions must be concatenated by id.
    targets: a list of labels
    """
    perf_metric = eval_metrics_dict[metric]
    delta_metrics_scores = {
        perturb_prefix: delta_metrics_dict[perturb_prefix](
            grouped_predictions, grouped_labels, perf_metric
        )
    }
    return delta_metrics_scores
