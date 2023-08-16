# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.services.builder_and_evaluation.eval_utils.metrics import (
    get_accuracy,
    get_accuracy_meta,
    get_bleu,
    get_bleu_meta,
    get_chrf_pp_meta,
    get_dataperf_auc,
    get_dataperf_auc_meta,
    get_dataperf_balanced_accuracy,
    get_dataperf_balanced_accuracy_meta,
    get_dataperf_f1,
    get_dataperf_f1_meta,
    get_dataperf_fraction_of_fixes,
    get_dataperf_fraction_of_fixes_meta,
    get_examples_per_second,
    get_examples_per_second_meta,
    get_f1,
    get_f1_meta,
    get_fairness_meta,
    get_macro_f1,
    get_macro_f1_meta,
    get_matthews_correlation,
    get_matthews_correlation_meta,
    get_memory_utilization,
    get_memory_utilization_meta,
    get_new_accuracy,
    get_new_accuracy_meta,
    get_robustness_meta,
    get_sp_bleu,
    get_sp_bleu_meta,
    get_squad_f1,
    get_squad_f1_meta,
    get_unperturbed_percent,
    get_vqa_accuracy,
    get_vqa_accuracy_meta,
)


# all eval_metrics takes predictions and targets as input, and output a metric number
eval_metrics_dict = {
    "accuracy": get_accuracy,
    "f1": get_f1,
    "macro_f1": get_macro_f1,
    "squad_f1": get_squad_f1,
    "bleu": get_bleu,
    "sp_bleu": get_sp_bleu,
    "vqa_accuracy": get_vqa_accuracy,
    "dataperf_f1": get_dataperf_f1,
    "dataperf_auc": get_dataperf_auc,
    "dataperf_fraction_of_fixes": get_dataperf_fraction_of_fixes,
    "dataperf_balanced_accuracy": get_dataperf_balanced_accuracy,
    "new_accuracy": get_new_accuracy,
    "matthews_correlation": get_matthews_correlation,
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
    "new_accuracy": get_new_accuracy_meta,
    "perf": get_accuracy_meta,
    "matthews_correlation": get_matthews_correlation_meta,
    "f1": get_f1_meta,
    "macro_f1": get_macro_f1_meta,
    "squad_f1": get_squad_f1_meta,
    "bleu": get_bleu_meta,
    "sp_bleu": get_sp_bleu_meta,
    "chrf_pp": get_chrf_pp_meta,
    "memory_utilization": get_memory_utilization_meta,
    "examples_per_second": get_examples_per_second_meta,
    "fairness": get_fairness_meta,
    "robustness": get_robustness_meta,
    "vqa_accuracy": get_vqa_accuracy_meta,
    "dataperf_f1": get_dataperf_f1_meta,
    "dataperf_auc": get_dataperf_auc_meta,
    "dataperf_fraction_of_fixes": get_dataperf_fraction_of_fixes_meta,
    "dataperf_balanced_accuracy": get_dataperf_balanced_accuracy_meta,
}
