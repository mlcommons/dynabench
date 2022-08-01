# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.eval_utils.metrics import *


# all eval_metrics takes predictions and targets as input, and output a metric number
eval_metrics_dict = {
    "accuracy": get_accuracy,
    "macro_f1": get_macro_f1,
    "squad_f1": get_squad_f1,
    "bleu": get_bleu,
    "sp_bleu": get_sp_bleu,
    "vqa_accuracy": get_vqa_accuracy,
    "dataperf_f1": get_dataperf_f1,
}

delta_metrics_dict = {
    "fairness": get_unperturbed_percent,
    "robustness": get_unperturbed_percent,
}

job_metrics_dict = {
    "memory_utilization": get_memory_utilization,
    "examples_per_second": get_examples_per_second,
}

meta_metrics_dict = {
    "accuracy": get_accuracy_meta,
    "macro_f1": get_macro_f1_meta,
    "squad_f1": get_squad_f1_meta,
    "bleu": get_bleu_meta,
    "sp_bleu": get_sp_bleu_meta,
    "memory_utilization": get_memory_utilization_meta,
    "examples_per_second": get_examples_per_second_meta,
    "fairness": get_fairness_meta,
    "robustness": get_robustness_meta,
    "vqa_accuracy": get_vqa_accuracy_meta,
    "dataperf_f1": get_dataperf_f1_meta,
}
