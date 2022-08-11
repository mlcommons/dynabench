# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from dataclasses import dataclass
from typing import Dict, List

import numpy as np
import sklearn
import sklearn.ensemble
import sklearn.linear_model
import sklearn.model_selection
import sklearn.svm
import tqdm


# include additional dependencies as needed


@dataclass
class TrainingSet:
    """
    dict {"targets": {"dog":[list of IDs], ...}, "nontargets": [list of IDs]}
    """

    targets: Dict[str, List[str]]
    nontargets: List[str]


class TrainingSetSelection:
    def __init__(self, allowed_embeddings, config, audio_flag=False) -> None:
        """
        Args:
            allowed_embeddings:
                dict {"targets": {"dog":
                    [{'ID':string,
                    'feature_vector':np.array,'audio':np.array}, ...], ...},
                    "nontargets": [list]}

            train_set_size: int (total number of samples to select)

            audio_flag: bool (if audio is included in the allowed_embeddings)

        """

        self.embeddings = allowed_embeddings
        # {"targets":
        #   {"dog":[{'ID':string,
        #   'feature_vector':np.array,'audio':np.array}, ...], ...},
        #  "nontargets":
        #   [{'ID':string,
        #   'feature_vector':np.array,'audio':np.array}, ...]}
        self.train_set_size = config["train_set_size_limit"]
        self.random_seed = config["random_seed"]
        self.audio_flag = audio_flag

    def select(self):
        """ "
        Replace this with your custom training set selection algorithm

        Returns:
            TrainingSet
        """

        if self.audio_flag:
            print(self.embeddings["nontargets"][0]["audio"])

        target_to_classid = {
            target: ix + 1
            for ix, target in enumerate(self.embeddings["targets"].keys())
        }
        target_to_classid["nontarget"] = 0

        per_class_size = self.train_set_size // len(target_to_classid.keys())

        target_samples = np.array(
            [
                sample["feature_vector"]
                for target, samples in self.embeddings["targets"].items()
                for sample in samples
            ]
        )

        target_labels = np.array(
            [
                target_to_classid[target]
                for (target, samples) in self.embeddings["targets"].items()
                for sample in samples
            ]
        )
        # this maps each row in target_samples back to the sample ID
        reverse_map_target_index_to_sample_id = [
            (target, sample["ID"])
            for (target, samples) in self.embeddings["targets"].items()
            for sample in samples
        ]

        nontarget_samples = np.array(
            [sample["feature_vector"] for sample in self.embeddings["nontargets"]]
        )
        nontarget_labels = np.zeros(nontarget_samples.shape[0])

        # as a simple, coarse baseline, we perform a nested crossvalidation
        # where the outer loop selects different subsets of the target samples
        # and the inner loop selects different subsets of the nontarget samples,
        # and we choose the best performing subsets as our selected training set.
        # In particular, since there are more nontarget samples than target samples
        # in the evaluation set, we want to find a useful representative subset
        # for training.

        best_score = 0
        best_target_train_ixs = None
        best_nontarget_train_ixs = None

        n_folds = 10

        # stratified shuffle split will reflect the percentage of each target
        # in the allowed set - i.e., if the allowed targets have 5000 samples of
        # "job" and 2500 samples of "restaurant", each fold will have twice
        # the number of samples of "job" than "restaurant"
        # - this might or might not be what you want!
        crossfold_targets = sklearn.model_selection.StratifiedShuffleSplit(
            n_splits=n_folds,
            train_size=per_class_size * len(self.embeddings["targets"].keys()),
            random_state=self.random_seed,
        )

        for target_train_ixs, target_val_ixs in tqdm.tqdm(
            crossfold_targets.split(target_samples, target_labels),
            desc="k-fold cross validation",
            total=n_folds,
        ):

            crossfold_nontargets = sklearn.model_selection.StratifiedShuffleSplit(
                n_splits=n_folds,
                train_size=per_class_size,
                random_state=self.random_seed,
            )
            for nontarget_train_ixs, nontarget_val_ixs in crossfold_nontargets.split(
                nontarget_samples, nontarget_labels
            ):

                train_Xs = np.vstack(
                    [
                        target_samples[target_train_ixs],
                        nontarget_samples[nontarget_train_ixs],
                    ]
                )
                train_ys = np.concatenate(
                    [
                        target_labels[target_train_ixs],
                        nontarget_labels[nontarget_train_ixs],
                    ]
                )

                clf = sklearn.ensemble.VotingClassifier(
                    estimators=[
                        ("svm", sklearn.svm.SVC(probability=True)),
                        ("lr", sklearn.linear_model.LogisticRegression()),
                    ],
                    voting="soft",
                    weights=None,
                )
                clf.fit(train_Xs, train_ys)

                val_Xs = np.vstack(
                    [
                        target_samples[target_val_ixs],
                        nontarget_samples[nontarget_val_ixs],
                    ]
                )
                val_ys = np.concatenate(
                    [target_labels[target_val_ixs], nontarget_labels[nontarget_val_ixs]]
                )

                score = clf.score(val_Xs, val_ys)
                if score > best_score:
                    best_score = score
                    best_target_train_ixs = target_train_ixs
                    best_nontarget_train_ixs = nontarget_train_ixs

        print(f"{best_score=}")

        selected_targets = {k: [] for k in self.embeddings["targets"].keys()}
        for target_ix in best_target_train_ixs:
            target, clip_id = reverse_map_target_index_to_sample_id[target_ix]
            selected_targets[target].append(clip_id)

        selected_nontargets = [
            self.embeddings["nontargets"][sample_ix]["ID"]
            for sample_ix in best_nontarget_train_ixs
        ]

        training_set = TrainingSet(
            targets=selected_targets,
            nontargets=selected_nontargets,
        )

        return training_set
