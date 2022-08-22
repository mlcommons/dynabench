# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from collections import defaultdict


class InputFormatter:
    def __init__(self, config: dict):
        self.config = config
        self.label = config["perf_metric"]["reference_name"]

    def format_labels(self, examples: list) -> list:
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
                "answer": example[self.label],
                "tags": example.get("tags", []),
            }
            formatted_examples.append(formatted_example)

        return formatted_examples

    def format_predictions(self, examples: list) -> list:
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
                "pred": example[self.label],
            }
            formatted_examples.append(formatted_example)

        return formatted_examples

    @staticmethod
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

    @staticmethod
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
