# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import functools
import subprocess
from datetime import datetime
from pathlib import Path

import numpy as np
import sacrebleu
import sentencepiece
from sklearn.metrics import (
    accuracy_score,
    auc,
    balanced_accuracy_score,
    f1_score,
    matthews_corrcoef,
    roc_curve,
)

from app.domain.services.builder_and_evaluation.eval_utils.instance_property import (
    instance_property,
)

from .vqa_accuracy import VQAEval


# perf functions. propose to move to dynalab


# eval_metrics, take predictions and targets as input
def get_dataperf_f1(predictions: list, targets: list):
    """
    Here, predictions can be a list of lists of acceptable multilabel lists, instead
    of just a list of multilabel lists. This is helpful for stochastic models, where we
    also want to report a standard deviation over the model outputs.
    """

    if not isinstance(predictions[0], list):
        predictions = [[pred] for pred in predictions]

    tag_f1_scores = {}
    tag_results = {}

    for tags in targets:
        for tag in tags:
            tag_results[tag] = {"t": [], "p": []}
            tag_f1_scores[tag] = []

    iterations = len(predictions[0])
    mean_f1s = []
    for iteration in range(iterations):
        for tag in tag_results:
            tag_results[tag] = {"t": [], "p": []}
        for p, t in zip([pred[iteration] for pred in predictions], targets):
            for tag in tag_results.keys():
                if tag in p:
                    tag_results[tag]["p"].append(1)
                else:
                    tag_results[tag]["p"].append(0)

                if tag in t:
                    tag_results[tag]["t"].append(1)
                else:
                    tag_results[tag]["t"].append(0)
        f1_sum = 0
        for tag in tag_results.keys():
            f1 = f1_score(tag_results[tag]["t"], tag_results[tag]["p"], average="micro")
            f1_sum += f1
            tag_f1_scores[tag].append(f1)

        mean_f1s.append(f1_sum / len(tag_results.keys()))

    perf_by_tag = []
    for tag, f1s in tag_f1_scores.items():
        mean = float(np.mean(f1s)) * 100
        std = float(np.std(f1s * 100))
        perf_by_tag.append(
            {
                "tag": tag,
                "pretty_perf": str(round(mean, 2)) + " %",
                "perf": round(mean, 2),
                "perf_std": round(std, 2) if len(predictions[0]) > 1 else None,
                "perf_dict": {"dataperf_f1": round(mean, 2)},
            }
        )
    mean_mean_f1s = float(np.mean(mean_f1s)) * 100
    return {
        "dataperf_f1": round(mean_mean_f1s, 2),
        "perf": round(mean_mean_f1s, 2),
        "perf_std": round(float(np.std(mean_f1s * 100)), 2)
        if len(predictions[0]) > 1
        else None,
        "perf_by_tag": perf_by_tag,
    }


def get_dataperf_f1_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Dataperf F1",
        "utility_direction": 1,
        "offset": 0,
    }


def get_accuracy(predictions: list, targets: list):
    """
    Here, t can be a list of acceptable labels, instead of just one label. This is
    helpful if an evaluation dataset has fewer classes than a model was trained with.
    For example, say we want an nli model trained with contraditction, entailment,
    neutral labels to be evaluated on a dataset with entailment, not-entailment labels.
    """

    def equality(p, t):
        if isinstance(t, list):
            return p in t
        elif isinstance(t, str):
            return p == t
        else:
            raise TypeError("t must be a list of strings or a string")

    acc = sum([equality(p, t) for p, t in zip(predictions, targets)]) / len(targets)
    return round(acc * 100, 2)


def get_dataperf_auc(predictions, labels):
    fpt, tpr, thresholds = roc_curve(labels, predictions)
    return auc(fpt, tpr)


def get_dataperf_auc_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "AUC",
        "utility_direction": 1,
        "offset": 0,
    }


def get_dataperf_balanced_accuracy(predictions, labels):
    score = balanced_accuracy_score(labels, predictions)
    return score


def get_dataperf_balanced_accuracy_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Balanced Accuracy",
        "utility_direction": 1,
        "offset": 0,
    }


def get_chrf_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Balanced Accuracy",
        "utility_direction": 1,
        "offset": 0,
    }


def get_kullback_leibler_divergence_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Kullback-Leibler Divergence",
        "utility_direction": -1,
        "offset": 0,
    }


def get_standard_LID_accuracy_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Accuracy",
        "utility_direction": 1,
        "offset": 0,
    }


def get_CER_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "CER",
        "utility_direction": -1,
        "offset": 0,
    }


def get_STD_CER_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "STD CER",
        "utility_direction": -1,
        "offset": 0,
    }


def get_CER_15_WORSE_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "CER_15_WORST",
        "utility_direction": -1,
        "offset": 0,
    }


def get_dialect_LID_Accuracy_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Dialect Accuracy",
        "utility_direction": 1,
        "offset": 0,
    }


def get_dialect_CER_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Dialect CER",
        "utility_direction": -1,
        "offset": 0,
    }


def get_chrf_pp(predictions: list, targets: list):
    """Chrf++ metric.

    Note: word_order=2 is important otherwise we only get chrf
    """
    chrf = sacrebleu.corpus_chrf(predictions, [targets], word_order=2)
    return chrf.score


def get_chrf_pp_meta(task=None):
    return {"unit": "", "pretty_name": "ᴄʜʀF++", "utility_direction": 1, "offset": 0}


def get_dataperf_fraction_of_fixes(required_fixes, total_fixes):
    fraction_of_fixes = required_fixes / total_fixes
    return fraction_of_fixes


def get_dataperf_fraction_of_fixes_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Fraction of fixes",
        "utility_direction": -1,
        "offset": 0,
    }


def get_accuracy_meta(task=None):
    return {"unit": "%", "pretty_name": "Accuracy", "utility_direction": 1, "offset": 0}


def get_new_accuracy_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Performance",
        "utility_direction": 1,
        "offset": 0,
    }


def get_matthews_correlation_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Matthews's Correlation",
        "utility_direction": 1,
        "offset": 0,
    }


def get_vqa_accuracy(predictions: list, targets: list):
    """
    prediction format: [
        0, 1, 2, 3, 4
    ]
    target format: [
        [0, 0, 0, 1, 2, 3, 4, 5, 6, 7],
        [1, 1, 1, 1, 2, 3, 4, 5, 6, 7],
        [2, 2, 2, 1, 2, 3, 4, 5, 6, 7],
        [3, 3, 3, 1, 2, 3, 4, 5, 6, 7],
        [4, 4, 4, 1, 2, 3, 4, 5, 6, 7],
    ]

    (where each digit represents an answer)

    Target format can also be the same as the prediction format (in this case it is
    assumed that there is only one answer, not a list of answers)
    """
    vqa_eval = VQAEval()
    acc_vqa = [
        vqa_eval(list(t) if isinstance(t, str) else t, p)
        for p, t in zip(predictions, targets)
    ]
    return round(100 * float(sum(acc_vqa)) / len(acc_vqa), vqa_eval.n)


def get_vqa_accuracy_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "VQA Accuracy",
        "utility_direction": 1,
        "offset": 0,
    }


def get_macro_f1(predictions: list, targets: list):
    macro_f1 = f1_score(targets, predictions, average="macro")
    return round(float(macro_f1) * 100, 2)


def get_macro_f1_meta(task=None):
    return {"unit": "%", "pretty_name": "Macro F1", "utility_direction": 1, "offset": 0}


def get_f1(predictions: list, targets: list):
    return f1_score(targets, predictions, average="binary", pos_label="1")


def get_f1_meta(task=None):
    return {"unit": "%", "pretty_name": "F1", "utility_direction": 1, "offset": 0}


def get_squad_f1(predictions: list, targets: list):
    """
    Here, t can be a list of acceptable answers, instead of just one answer. There
    are often multiple acceptable answers to questions, as evidenced in the squad
    dataset. If t is a list of acceptable answers instead of just one answer, then
    the f1 of p and each item in t is computed, and the max f1 is used, per the
    squad evaluation standard.
    """
    from transformers.data.metrics.squad_metrics import compute_f1

    def squad_f1_loop(t, p):
        if isinstance(t, list):
            if len(t) == 0:
                # Per the squad evaluation script
                t = [""]
            return max([compute_f1(t_answer, p) for t_answer in t])
        elif isinstance(t, str):
            return compute_f1(t, p)
        else:
            raise TypeError("t must be a list of strings or a string")

    f1 = sum([squad_f1_loop(t, p) for p, t in zip(predictions, targets)]) / len(targets)
    return round(f1 * 100, 2)


def get_squad_f1_meta(task=None):
    return {"unit": "%", "pretty_name": "QA F1", "utility_direction": 1, "offset": 0}


def get_new_accuracy(predictions: list, targets: list):
    accuracy = accuracy_score(targets, predictions)
    return accuracy


def get_matthews_correlation(predictions: list, targets: list):
    mcc = matthews_corrcoef(targets, predictions)
    return mcc


# TODO: split into different functions for fairness and robustness.
def get_unperturbed_percent(predictions: dict, targets: dict, metric_function):
    total_unperturbed_weights, total = 0, 0
    for target in targets:
        if target in predictions:
            total_unperturbed_weights += metric_function(
                predictions[target], [targets[target]] * len(predictions[target])
            )
            total += 1
    return round(total_unperturbed_weights / total, 2)


def get_fairness_meta(task=None):
    return {"unit": "%", "pretty_name": "Fairness", "utility_direction": 1, "offset": 0}


def get_robustness_meta(task=None):
    return {
        "unit": "%",
        "pretty_name": "Robustness",
        "utility_direction": 1,
        "offset": 0,
    }


# sacrebleu evaluation
def get_bleu(predictions: list, targets: list):
    bleu = sacrebleu.corpus_bleu(predictions, [targets])
    return bleu.score


def get_chrf(predictions: list, targets: list):
    chrf = sacrebleu.corpus_chrf(predictions, [targets])
    return chrf.score


def get_bleu_meta(task=None):
    return {"unit": "", "pretty_name": "BLEU", "utility_direction": 1, "offset": 0}


SPM_URL = (
    "https://dl.fbaipublicfiles.com/fairseq/models/flores/sacrebleu_tokenizer_spm.model"
)
SPM_PATH = Path(__file__).parent / "sentencepiece.bpe.model"


@functools.lru_cache()
def get_spm_model():
    if not SPM_PATH.exists():
        subprocess.check_call(["wget", SPM_URL, "-O", str(SPM_PATH)])
    spm = sentencepiece.SentencePieceProcessor()
    assert spm.Load(str(SPM_PATH)), f"Couldn't load spm model from {SPM_PATH}"
    return spm


def sp_tokenize(spm, sentence: str) -> str:
    words = spm.EncodeAsPieces(sentence.strip())
    return " ".join(words)


def get_sp_bleu(predictions: list, targets: list):
    spm = get_spm_model()
    spm_pred = [sp_tokenize(spm, pred) for pred in predictions]
    spm_targets = [sp_tokenize(spm, tgt) for tgt in targets]
    bleu = sacrebleu.corpus_bleu(spm_pred, [spm_targets], force=True)
    return bleu.score


def get_sp_bleu_meta(task=None):
    return {"unit": "", "pretty_name": "sp-BLEU", "utility_direction": 1, "offset": 0}


# job_metrics, takes raw job and dataset as input
def get_memory_utilization(job, dataset):
    mem = (
        sum(job.aws_metrics["MemoryUtilization"])
        / 100
        * instance_property[dataset.task["instance_type"]]["memory_gb"]
    )
    return round(mem, 2)


def get_memory_utilization_meta(task):
    return {
        "unit": "GiB",
        "pretty_name": "Memory",
        "utility_direction": -1,
        "offset": instance_property[task["instance_type"]]["memory_gb"],
    }


def get_examples_per_second(job, dataset, decen=False):
    n_examples = None
    if decen:
        n_examples = dataset.get_n_examples
        transform_start_time = datetime.strptime(
            job.status["TransformStartTime"], "%Y-%m-%d %H:%M:%S.%f%z"
        )
        transform_end_time = datetime.strptime(
            job.status["TransformEndTime"], "%Y-%m-%d %H:%M:%S.%f%z"
        )
        eps = n_examples / (transform_end_time - transform_start_time).total_seconds()
    else:
        n_examples = dataset.get_n_examples()
        eps = (
            n_examples
            / (
                job.status["TransformEndTime"] - job.status["TransformStartTime"]
            ).total_seconds()
        )

    return round(eps, 2)


def get_examples_per_second_meta(task):
    return {
        "unit": "examples/second",
        "pretty_name": "Throughput",
        "utility_direction": 1,
        "offset": 0,
    }
