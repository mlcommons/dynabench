# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
from collections import defaultdict


def format_labels(label: str, examples: list) -> list:
    """
    Convert the labels to a format expected by Evaluator.
    Can format original labels, as well as robustness and fairness labels.
    {
        "id": <a unique identifier>
        "answer": <the correct label for a given sample>
        "tags": <a list of strings>
    }
    """
    formatted_examples = []

    for example in examples:
        formatted_example = {
            "id": example["uid"],
            "answer": example[label],
            "tags": example.get("tags", []),
        }
        formatted_examples.append(formatted_example)

    return formatted_examples


def format_predictions(label: str, examples: list) -> list:
    """
    Convert the prediction to a format expected by Evaluator.
    Can format original predictions, as well as robustness and fairness predictions.
    {
        "id": <a unique identifier>,
        "pred": <the prediction that will be used to calculate metrics>,
    }
    """
    formatted_examples = []

    for example in examples:
        formatted_example = {
            "id": example["id"],
            "pred": example[label],
        }
        formatted_examples.append(formatted_example)

    return formatted_examples


def load_dataset(path: str):
    data = []
    with open(path) as f:
        for line in f.readlines():
            data.append(json.loads(line))
    return data


def group_predictions(examples: list) -> dict:
    """
    Group predictions with same ID from robustness inference,
    to compute delta metrics.

    """
    grouped_predictions = defaultdict(list)

    for example in examples:
        id = str(example["id"]).split("_")[0]
        grouped_predictions[id].append(example["pred"])

    return grouped_predictions


def group_labels(examples: list) -> dict:
    """
    Group labels with same ID from robustness inference,
    to compute delta metrics.

    """
    final_labels = defaultdict(list)

    for example in examples:
        id = str(example["id"]).split("_")[0]
        final_labels[id] = example["answer"]
    return final_labels


def necessary_format_for_multilingual_evaluation(
    prediction_dict: dict, label: str, gender: str
):
    formated_dict = {}
    list_of_labels = [
        entry[gender] for entry in load_dataset(prediction_dict["dataset"])
    ]
    list_of_predictions = [
        entry[label] for entry in load_dataset(prediction_dict["predictions"])
    ]
    formated_dict["formatted_base_predictions"] = list_of_predictions
    formated_dict["formatted_base_dataset"] = list_of_labels
    return formated_dict, False


def neccesary_format_for_evaluation(prediction_dict: dict, label: str):
    data_dict = {}
    for data_version, data_types in prediction_dict.items():
        for data_type in data_types:
            data_dict[f"{data_version}_{data_type}"] = load_dataset(
                prediction_dict[data_version][data_type]
            )

    perturb_exists = (
        "fairness_predictions" in data_dict or "robustness_predictions" in data_dict
    )
    formatted_dict = {}
    for data_type in data_dict:
        formatted_key = f"formatted_{data_type}"
        grouped_key = f"grouped_{data_type}"
        if "dataset" in data_type:
            formatted_dict[formatted_key] = format_labels(label, data_dict[data_type])
            formatted_dict[grouped_key] = group_labels(formatted_dict[formatted_key])
        elif "predictions" in data_type:
            formatted_dict[formatted_key] = format_predictions(
                label, data_dict[data_type]
            )
            formatted_dict[grouped_key] = group_predictions(
                formatted_dict[formatted_key]
            )
    return formatted_dict, perturb_exists
