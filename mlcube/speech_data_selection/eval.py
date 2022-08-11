# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pathlib import Path

import fire
import numpy as np
import sklearn.ensemble
import sklearn.linear_model
import sklearn.svm
import yaml
from selection.load_samples import load_samples


def validate_selected_ids(selected_ids, allowed_training_ids, train_set_size_limit):
    groundtruth_targets = set(allowed_training_ids["targets"].keys())
    for target in selected_ids["targets"].keys():
        assert target in groundtruth_targets, f"target {target} not in allowed set"

    groundtruth_target_ids = {
        target: set(samples)
        for target, samples in allowed_training_ids["targets"].items()
    }
    for target, samples in selected_ids["targets"].items():
        assert set(samples).issubset(
            groundtruth_target_ids[target]
        ), f"{target} contains an ID not in allowed set"

    groundtruth_nontarget_ids = set(allowed_training_ids["nontargets"])
    assert set(selected_ids["nontargets"]).issubset(
        groundtruth_nontarget_ids
    ), f"nontargets contain an ID not in allowed set"

    n_training_samples = sum(
        [len(samples) for samples in selected_ids["targets"].values()]
    ) + len(selected_ids["nontargets"])
    assert (
        n_training_samples <= train_set_size_limit
    ), f"{n_training_samples} samples exceeds limit of {train_set_size_limit}"


def create_dataset(embeddings):
    """
    Creates an sklearn-compatible dataset from an embedding dict
    """
    target_to_classid = {
        target: ix + 1 for ix, target in enumerate(embeddings["targets"].keys())
    }
    target_to_classid["nontarget"] = 0

    target_samples = np.array(
        [
            sample["feature_vector"]
            for target, samples in embeddings["targets"].items()
            for sample in samples
        ]
    )

    target_labels = np.array(
        [
            target_to_classid[target]
            for (target, samples) in embeddings["targets"].items()
            for sample in samples
        ]
    )

    nontarget_samples = np.array(
        [sample["feature_vector"] for sample in embeddings["nontargets"]]
    )
    nontarget_labels = np.zeros(nontarget_samples.shape[0])

    Xs = np.vstack([target_samples, nontarget_samples])
    ys = np.concatenate([target_labels, nontarget_labels])
    return Xs, ys


def main(
    # embeddings dir point to the same parquet file for testing and online eval
    eval_embeddings_dir="embeddings/en",
    train_embeddings_dir="embeddings/en",
    allowed_training_set="allowed_training_set.yaml",
    eval_file="eval.yaml",
    train_file="workdir/train.yaml",
    config_file="dataperf_speech_config.yaml",
):

    config = yaml.safe_load(Path(config_file).read_text())
    train_set_size_limit = config["train_set_size_limit"]
    random_seed = config["random_seed"]

    allowed_training_ids = yaml.safe_load(Path(allowed_training_set).read_text())
    selected_ids = yaml.safe_load(Path(train_file).read_text())

    print("validating selected IDs")
    validate_selected_ids(selected_ids, allowed_training_ids, train_set_size_limit)

    print("loading selected training data")
    selected_embeddings = load_samples(
        sample_ids=selected_ids, embeddings_dir=train_embeddings_dir
    )
    print("loading eval data")
    eval_ids = yaml.safe_load(Path(eval_file).read_text())
    eval_embeddings = load_samples(
        sample_ids=eval_ids, embeddings_dir=eval_embeddings_dir
    )

    train_x, train_y = create_dataset(selected_embeddings)

    # svm = sklearn.svm.SVC(random_state=random_seed,decision_function_shape="ovr").fit(
    #     train_x, train_y
    # )

    clf = sklearn.ensemble.VotingClassifier(
        estimators=[
            ("svm", sklearn.svm.SVC(probability=True, random_state=random_seed)),
            ("lr", sklearn.linear_model.LogisticRegression(random_state=random_seed)),
        ],
        voting="soft",
        weights=None,
    )
    clf.fit(train_x, train_y)

    # eval
    eval_x, eval_y = create_dataset(eval_embeddings)

    print("score", clf.score(eval_x, eval_y))


if __name__ == "__main__":
    fire.Fire(main)
