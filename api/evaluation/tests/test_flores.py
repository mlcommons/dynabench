# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json

import datasets.mt.flores
import sacrebleu
from datasets.mt.flores import Flores101Base, Flores101Small1Dev, compute_averages

from metrics import metrics


DATASET = Flores101Small1Dev()


def mk_sample(
    id: int,
    sourceLanguage: str,
    targetLanguage: str,
    sourceText: str,
    translatedText: str,
    answer: str,
):
    """Creates the prediction and target dicts"""
    gold_sample = {
        "uid": f"{id}-{sourceLanguage}-{targetLanguage}-unittest",
        "sourceLanguage": sourceLanguage,
        "targetLanguage": targetLanguage,
        "sourceText": sourceText,
        "targetText": answer,
        "signed": "0123456789abcdef",
    }
    target_sample = DATASET.label_field_converter(gold_sample)

    pred_sample = {
        "id": gold_sample["uid"],
        "sourceLanguage": gold_sample["sourceLanguage"],
        "targetLanguage": gold_sample["targetLanguage"],
        "sourceText": gold_sample["sourceText"],
        "translatedText": translatedText,
        "signed": gold_sample["signed"],
    }
    return pred_sample, target_sample


def test_eval():
    prediction, target = mk_sample(
        id=0,
        sourceLanguage="hu_HU",
        targetLanguage="et_EE",
        sourceText="Hétfőn a Stanford Egyetem Orvostudományi Kara bejelentette egy.",
        translatedText="Esmaspäeval teatasid Stanfordi ülikooli meditsiinikooli.",
        answer="Esmaspäeval teatasid Stanfordi leiutasid uue diagnostilise",
    )
    sp_bleu = metrics.get_sp_bleu([prediction["translatedText"]], [target["answer"]])

    result = DATASET.eval([prediction], [target])
    assert sp_bleu == result["perf"]
    scores = json.loads(result["metadata_json"])
    print(result["metadata_json"])
    assert scores["sp_bleu"] == sp_bleu

    score = next((s for s in scores["perf_by_tag"] if s["tag"] == "hu_HU-et_EE"), None)
    assert score
    assert score["perf_dict"]["sp_bleu"] == sp_bleu


def test_corpus_bleu():

    pred_ru_en_0, tgt_ru_en_0 = mk_sample(
        id=0,
        sourceLanguage="rus",
        targetLanguage="eng",
        sourceText="А Б В Г Д Е Ё",
        translatedText="A B B G D E yo",
        answer="A B V G D E yo",
    )

    pred_ru_en_1, tgt_ru_en_1 = mk_sample(
        id=1,
        sourceLanguage="rus",
        targetLanguage="eng",
        sourceText="К Л М Н О П Р С Т",
        translatedText="K L M N O P R S T",
        answer="K L M N O P R S T",
    )

    pred_en_ru_0, tgt_en_ru_0 = mk_sample(
        id=0,
        sourceLanguage="eng",
        targetLanguage="rus",
        sourceText="А Б В Г Д Е Ё",
        translatedText="A B B G D E",
        answer="A B V G D E",
    )

    ru_en_bleu = sacrebleu.corpus_bleu(
        [p["translatedText"] for p in [pred_ru_en_0, pred_ru_en_1]],
        [[t["answer"] for t in [tgt_ru_en_0, tgt_ru_en_1]]],
    )
    en_ru_bleu = sacrebleu.corpus_bleu(
        [pred_en_ru_0["translatedText"]], [[tgt_en_ru_0["answer"]]]
    )

    result = DATASET.eval(
        [pred_ru_en_0, pred_ru_en_1, pred_en_ru_0],
        [tgt_ru_en_0, tgt_ru_en_1, tgt_en_ru_0],
    )
    scores = json.loads(result["metadata_json"])
    ru_en_score = next(
        (s for s in scores["perf_by_tag"] if s["tag"] == "rus-eng"), None
    )
    assert ru_en_score["perf_dict"]["sp_bleu"] == ru_en_bleu.score
    en_ru_score = next(
        (s for s in scores["perf_by_tag"] if s["tag"] == "eng-rus"), None
    )
    assert en_ru_score["perf_dict"]["sp_bleu"] == en_ru_bleu.score

    fixed_result = compute_averages("sp_bleu", scores["perf_by_tag"])
    assert fixed_result["perf"] == (ru_en_bleu.score + en_ru_bleu.score) / 2


def test_compute_averages():
    # Dumped and simplified from the SQL database for a small1 model.
    metrics = {
        "sp_bleu": 28.207333333333338,
        "perf_by_tag": [
            {
                "tag": "eng-est",
                "pretty_perf": "28.4",
                "perf": 28.43,
                "perf_dict": {"sp_bleu": 28.43},
            },
            {
                "tag": "eng-hrv",
                "pretty_perf": "27.9",
                "perf": 27.91,
                "perf_dict": {"sp_bleu": 27.91},
            },
            {
                "tag": "est-eng",
                "pretty_perf": "32.5",
                "perf": 32.46,
                "perf_dict": {"sp_bleu": 32.46},
            },
            {
                "tag": "est-hrv",
                "pretty_perf": "24.7",
                "perf": 24.73,
                "perf_dict": {"sp_bleu": 24.73},
            },
            {
                "tag": "hrv-eng",
                "pretty_perf": "32.1",
                "perf": 32.12,
                "perf_dict": {"sp_bleu": 32.12},
            },
            {
                "tag": "hrv-est",
                "pretty_perf": "25.1",
                "perf": 25.12,
                "perf_dict": {"sp_bleu": 25.12},
            },
        ],
    }
    sharded_metrics = compute_averages("sp_bleu", metrics["perf_by_tag"])
    metadata_json = json.loads(sharded_metrics["metadata_json"])

    assert metadata_json.keys() == metrics.keys()
    assert metadata_json.keys() == {"sp_bleu", "perf_by_tag"}
    assert metadata_json["perf_by_tag"] == metrics["perf_by_tag"]
    # Note that the "sp_bleu" is different because compute_averages is
    # correctly computing the average of bleu score per direction, while
    # the old algorithm would put there the bleu score across all directions.


def test_flores_dataset():
    for name in dir(datasets.mt.flores):
        if name == "Flores101Base":
            continue
        dataset_cls = getattr(datasets.mt.flores, name)
        if not isinstance(dataset_cls, Flores101Base):
            continue
