# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.services.builder_and_evaluation.eval_utils.metrics import (
    get_accuracy,
    get_accuracy_meta,
    get_anaphor_agreement,
    get_argument_structure,
    get_binding,
    get_bleu,
    get_bleu_meta,
    get_chrf_pp_meta,
    get_control_raising,
    get_dataperf_auc,
    get_dataperf_auc_meta,
    get_dataperf_balanced_accuracy,
    get_dataperf_balanced_accuracy_meta,
    get_dataperf_f1,
    get_dataperf_f1_meta,
    get_dataperf_fraction_of_fixes,
    get_dataperf_fraction_of_fixes_meta,
    get_determiner_noun_agreement,
    get_ellipsis,
    get_examples_per_second,
    get_examples_per_second_meta,
    get_fairness_meta,
    get_filler_gap,
    get_irregular_forms,
    get_island_effects,
    get_macro_f1,
    get_macro_f1_meta,
    get_matthews_corrcoef,
    get_memory_utilization,
    get_memory_utilization_meta,
    get_new_accuracy,
    get_npi_licensing,
    get_quantifiers,
    get_robustness_meta,
    get_sp_bleu,
    get_sp_bleu_meta,
    get_squad_f1,
    get_squad_f1_meta,
    get_subject_verb_agreement,
    get_unperturbed_percent,
    get_vqa_accuracy,
    get_vqa_accuracy_meta,
)


# all eval_metrics takes predictions and targets as input, and output a metric number
eval_metrics_dict = {
    "accuracy": get_accuracy,
    "macro_f1": get_macro_f1,
    "squad_f1": get_squad_f1,
    "bleu": get_bleu,
    "sp_bleu": get_sp_bleu,
    "vqa_accuracy": get_vqa_accuracy,
    "dataperf_f1": get_dataperf_f1,
    "dataperf_auc": get_dataperf_auc,
    "dataperf_fraction_of_fixes": get_dataperf_fraction_of_fixes,
    "dataperf_balanced_accuracy": get_dataperf_balanced_accuracy,
    "matthews_corrcoef": get_matthews_corrcoef,
    "new_accuracy": get_new_accuracy,
    "anaphor_agreement": get_anaphor_agreement,
    "argument_structure": get_argument_structure,
    "binding": get_binding,
    "control_raising": get_control_raising,
    "determiner_noun_agreement": get_determiner_noun_agreement,
    "ellipsis": get_ellipsis,
    "filler_gap": get_filler_gap,
    "irregular_forms": get_irregular_forms,
    "island_effects": get_island_effects,
    "npi_licensing": get_npi_licensing,
    "quantifiers": get_quantifiers,
    "subject_verb_agreement": get_subject_verb_agreement,
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
