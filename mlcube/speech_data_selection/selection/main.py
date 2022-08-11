# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from pathlib import Path
from typing import Optional

import fire
import yaml
from selection.load_samples import load_samples
from selection.selection import TrainingSetSelection


def main(
    allowed_training_set: os.PathLike,
    train_embeddings_dir: os.PathLike = "/embeddings/en",
    audio_dir: Optional[os.PathLike] = None,
    config_file: os.PathLike = "config_files/dataperf_speech_config.yaml",
    outdir: os.PathLike = "/workdir",
):
    """
    Entrypoint for the training set selection algorithm. Challenge participants
    should *NOT MODIFY* main.py, and should instead modify selection.py (adding
    additional modules and dependencies is also fine, but the selection algorithm
    should be able to run offline without network access).

    :param allowed_training_set: path to a yaml file containing the allowed clip
      IDs for training set selection, organized as a dictionary of potential target
      samples and a list of potential nontarget samples.

    :param train_embeddings_dir: directory containing the training feature
      vectors, i.e., embeddings, stored as parquet files.

    :param audio_dir: optional, a directory containing audio files for MSWC
      samples, encoded as 16KHz wavs. Your selection algorithm can solely consider
      the embeddings, but if you also wish to use audio, this parameter must be
      specified as a directory to the MSWC 16KHz wav samples.

    :param config_file: path to a yaml file containing the configuration for the
      experiment, such as random seeds and the maximum number of training samples.
      You can extend this config file if needed.

    :param outdir: output directory to save the selected training set as a yaml file

    """

    assert Path(
        outdir
    ).is_dir(), (
        f"{outdir} does not exist, please specify --outdir as a command line argument"
    )

    # TODO(mmaz) need an override mechanism, see
    # https://github.com/harvard-edge/dataperf-speech-example/issues/3
    config = yaml.safe_load(Path(config_file).read_text())

    # dict {"targets": {"dog":[list]}, "nontargets": [list]}
    allowed_training_ids = yaml.safe_load(Path(allowed_training_set).read_text())

    allowed_training_embeddings = load_samples(
        sample_ids=allowed_training_ids,
        embeddings_dir=train_embeddings_dir,
        audio_dir=audio_dir,
    )

    audio_flag = False
    if audio_dir is not None:
        audio_flag = True

    selection = TrainingSetSelection(
        allowed_embeddings=allowed_training_embeddings,
        config=config,
        audio_flag=audio_flag,
    )

    train = selection.select()

    n_selected = sum([len(sample_ids) for sample_ids in train.targets.values()]) + len(
        train.nontargets
    )
    assert (
        n_selected <= config["train_set_size_limit"]
    ), f"""{n_selected} samples selected, but the limit is
    {config['train_set_size_limit']}"""

    output = Path(outdir) / "train.yaml"
    with open(output, "w") as fh:
        yaml.dump(
            dict(targets=train.targets, nontargets=train.nontargets),
            fh,
            default_flow_style=None,
            sort_keys=False,
        )


if __name__ == "__main__":
    fire.Fire(main)
