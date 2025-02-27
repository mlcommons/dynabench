# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import evaluation.metrics.metrics as metrics


# all eval_metrics takes predictions and targets as input, and output a metric number
eval_metrics_dict = {
    "accuracy": metrics.get_accuracy,
    "macro_f1": metrics.get_macro_f1,
    "squad_f1": metrics.get_squad_f1,
    "bleu": metrics.get_bleu,
    "sp_bleu": metrics.get_sp_bleu,
    "chrf_pp": metrics.get_chrf_pp,
    "vqa_accuracy": metrics.get_vqa_accuracy,
    "dataperf_f1": metrics.get_dataperf_f1,
    "dataperf_auc": metrics.get_dataperf_auc,
    "dataperf_fraction_of_fixes": metrics.get_dataperf_fraction_of_fixes,
    "dataperf_balanced_accuracy": metrics.get_dataperf_balanced_accuracy,
    "chrf": metrics.get_chrf,
    "kullback_leibler_divergence": metrics.get_kullback_leibler_divergence,
}

delta_metrics_dict = {
    "fairness": metrics.get_unperturbed_percent,
    "robustness": metrics.get_unperturbed_percent,
}

job_metrics_dict = {
    "memory_utilization": metrics.get_memory_utilization,
    "examples_per_second": metrics.get_examples_per_second,
}

metrics_meta_dict = {
    "accuracy": metrics.get_accuracy_meta,
    "macro_f1": metrics.get_macro_f1_meta,
    "squad_f1": metrics.get_squad_f1_meta,
    "new_accuracy": metrics.get_new_accuracy_meta,
    "bleu": metrics.get_bleu_meta,
    "sp_bleu": metrics.get_sp_bleu_meta,
    "chrf_pp": metrics.get_chrf_pp_meta,
    "memory_utilization": metrics.get_memory_utilization_meta,
    "examples_per_second": metrics.get_examples_per_second_meta,
    "fairness": metrics.get_fairness_meta,
    "robustness": metrics.get_robustness_meta,
    "vqa_accuracy": metrics.get_vqa_accuracy_meta,
    "dataperf_f1": metrics.get_dataperf_f1_meta,
    "dataperf_auc": metrics.get_dataperf_auc_meta,
    "dataperf_fraction_of_fixes": metrics.get_dataperf_fraction_of_fixes_meta,
    "dataperf_balanced_accuracy": metrics.get_dataperf_balanced_accuracy_meta,
    "chrf": metrics.get_chrf_meta,
    "kullback_leibler_divergence": metrics.get_kullback_leibler_divergence_meta,
    "Standard_LangID_Accuracy": metrics.get_standard_LID_accuracy_meta,
    "Standard_CER": metrics.get_CER_meta,
    "Standard_STD_CER": metrics.get_STD_CER_meta,
    "Standard_CER_15_WORSE": metrics.get_CER_15_WORSE_meta,
    "Dialect_LangID_Accuracy": metrics.get_dialect_LID_Accuracy_meta,
    "Dialect_CER": metrics.get_dialect_CER_meta,
}
