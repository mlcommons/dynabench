# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# flake8: noqa

import logging
import os
import random
import zlib
from multiprocessing import Pool
from typing import Any, Callable, Dict, List, Optional

import augly.text as textaugs
import spacy
from augly.utils import pathmgr
from util import postprocess, preprocess


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("perturb")


class AuglyPerturbation:
    def __init__(
        self,
        perturb_prefix: str,
        seed: Optional[int],
        num_threads: int,
        perturb_fields: List[str],
        ignore_words_fields: List[str],
        skip_ents=True,
    ):
        if skip_ents:
            self.ner = spacy.load("en_core_web_sm")
            self.skip_ents = True
        else:
            self.skip_ents = False
        self.perturb_prefix = perturb_prefix
        self.seed = seed if seed is not None else random.randint(0, 1000)
        random.seed(self.seed)
        self.perturbations = self.get_perturbations()
        self.num_threads = num_threads
        self.perturb_fields = perturb_fields
        self.ignore_words_fields = ignore_words_fields

    def get_names_mapping(self, names: List[str]) -> Dict[str, str]:
        for i, names_i in enumerate(names):
            with pathmgr.open(names_i) as f:
                names[i] = [str(n) for n in f.read().splitlines()]

        # Build random pairs
        name_mapping = {}
        for i in range(len(names)):
            for name in names[i]:
                new_group = i
                while new_group == i:
                    new_group = random.randint(0, len(names) - 1)
                idx = random.randint(0, len(names[new_group]) - 1)
                name_mapping[name] = names[new_group][idx]

        return name_mapping

    def get_perturbations(self) -> List[Callable]:
        pert_cfg = self.get_perturbation_config()
        perturbations = {}
        for perturbation in pert_cfg:
            aug_kwargs = perturbation.copy()
            class_name = aug_kwargs.pop("class")
            transform_name = aug_kwargs.pop("name", None) or class_name
            transform = getattr(textaugs, class_name)(**aug_kwargs)
            perturbations[transform_name] = transform
        return perturbations

    def get_perturbations(self) -> Dict[str, List[Callable]]:
        fdir = "./data/"

        if self.perturb_prefix == "fairness":
            # Fairness perturbations
            return {
                "SwapEthnicGroupNames": [
                    textaugs.ReplaceWords(
                        aug_word_p=1.0,
                        mapping=self.get_names_mapping(
                            [
                                os.path.join(fdir, "api_names.txt"),
                                os.path.join(fdir, "black_names.txt"),
                                os.path.join(fdir, "hispanic_names.txt"),
                                os.path.join(fdir, "white_names.txt"),
                            ]
                        ),
                    )
                ],
                "SwapGenderedNamesAndWords": [
                    textaugs.ReplaceWords(
                        aug_word_p=1.0,
                        mapping=self.get_names_mapping(
                            [
                                os.path.join(fdir, "male_names.txt"),
                                os.path.join(fdir, "female_names.txt"),
                            ]
                        ),
                    ),
                    textaugs.SwapGenderedWords(aug_word_p=1.0),
                ],
            }

        # Robustness perturbations
        return {
            "ChangeCase": [textaugs.ChangeCase(case="upper", cadence=3.0)],
            "Contractions": [textaugs.Contractions(aug_p=1.0)],
            "InsertPunctuationChars": [
                textaugs.InsertPunctuationChars(cadence=10.0, vary_chars=True)
            ],
            "InsertWhitespaceChars": [
                textaugs.InsertWhitespaceChars(cadence=10.0, vary_chars=True)
            ],
            "InsertZeroWidthChars": [
                textaugs.InsertZeroWidthChars(cadence=10.0, vary_chars=True)
            ],
            "ReplaceFunFonts": [textaugs.ReplaceFunFonts(vary_fonts=True)],
            "ReplaceSimilarUnicodeChars": [textaugs.ReplaceSimilarUnicodeChars()],
            "ReplaceUpsideDown": [textaugs.ReplaceUpsideDown(granularity="word")],
            "CharTypos": [textaugs.SimulateTypos(typo_type="charmix")],
            "KeyboardTypos": [textaugs.SimulateTypos(typo_type="keyboard")],
            "MisspellingTypos": [textaugs.SimulateTypos(typo_type="misspelling")],
            "SplitWords": [textaugs.SplitWords()],
        }

    def get_entity_set(self, text: str) -> Optional[List[str]]:
        if self.skip_ents:
            doc = self.ner(text)
            ents = [ent.text for ent in doc.ents]
            return [word for ent in ents for word in ent.split()]
        else:
            return None

    def perturb(self, examples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if self.num_threads == 1:
            perturbed = [self.apply_augmentations(example) for example in examples]
        else:
            with Pool(self.num_threads) as pool:
                perturbed = [
                    el for l in pool.map(self.apply_augmentations, examples) for el in l
                ]

        return perturbed

    def apply_augmentations(self, example: Dict[str, Any]) -> List[Dict[str, Any]]:
        pert = []
        for transform_name in self.perturbations.keys():
            pt_example = self.apply_augmentation(transform_name, example)
            if pt_example is not None:
                pert.append(pt_example)
        return pert

    def apply_augmentation(
        self, transform_name: str, example: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        perturb_example = example.copy()
        perturb_example["input_id"] = example["uid"]
        perturb_example["uid"] = f"{example['uid']}_{transform_name}"
        uid_hash = zlib.adler32(perturb_example["uid"].encode())
        random.seed((self.seed + uid_hash) % 2**32)
        transforms = self.perturbations[transform_name]

        changed = False
        for key in self.perturb_fields:
            ignore_words = []
            for ignore_field in self.ignore_words_fields:
                ignore_words = (
                    [example[ignore_field]]
                    if isinstance(ignore_words, str)
                    else example[ignore_field]
                )
                ignore_words.extend(ignore_words)
            if key in example:
                field_changed = self.call_transforms(
                    example, perturb_example, key, transforms, ignore_words=ignore_words
                )
                changed = changed or field_changed

        if changed:
            return perturb_example

        return None

    def call_transforms(
        self,
        src_example: Dict[str, Any],
        aug_example: Dict[str, Any],
        key: str,
        transforms: List[Callable],
        **kwargs,
    ) -> bool:
        text = src_example[key]
        if self.perturb_prefix == "fairness":
            kwargs["ignore_words"] = kwargs.get(
                "ignore_words", []
            ) + self.get_entity_set(text)

        if not kwargs.get("ignore_words", None):
            kwargs.pop("ignore_words", None)

        aug_text = preprocess(text)
        for transform in transforms:
            aug_text = transform(aug_text, **kwargs)

        if isinstance(aug_text, list):
            assert len(aug_text) == 1
            aug_text = aug_text[0]

        aug_example[key] = postprocess(aug_text)

        # The fairness augs often don't change anything; we don't want to record the
        # perturbed text if nothing has changed (but `aug_text == text` might be true
        # due to tokenizing/detokenizing noise), so we check if all the non-whitespace
        # charsmatch. But we can't do this for robustness perturbations like
        # `SplitWords` which inserts spaces, so then we use `aug_text == text`.
        changed = (
            "".join(aug_text.split()) != "".join(text.split())
            if self.perturb_prefix == "fairness"
            else aug_text != text
        )

        # Return True if text was changed, otherwise False
        return changed
