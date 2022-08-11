# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd
import scipy.io
import tqdm


def load_samples(
    sample_ids: Dict[str, Any],
    embeddings_dir: os.PathLike,
    audio_dir: Optional[os.PathLike] = None,
) -> Dict[str, Any]:
    """
    Loads samples from disk.

    Args:
        sample_ids:
            dict {"targets": {"dog":[list of IDs], ...},
                "nontargets": [list of IDs]}

        embeddings_dir: path to directory containing parquet embeddings

        audio_dir: optional, path to directory containing audio files for MSWC samples
    Returns:
        dict {"targets":
            {"dog":[{'ID':string,
                'feature_vector':np.array,'audio':np.array}, ...], ...},
              "nontargets":
                [{'ID':string,
                    'feature_vector':np.array,'audio':np.array}, ...]}
    """
    embeddings_dir = Path(embeddings_dir)
    embeddings = dict(targets={}, nontargets=[])

    for target, id_list in tqdm.tqdm(
        sample_ids["targets"].items(), desc="Loading targets"
    ):
        embeddings["targets"][target] = []
        target_parquet = pd.read_parquet(embeddings_dir / (target + ".parquet"))
        allowed_ids_mask = target_parquet["clip_id"].isin(id_list)
        for row in target_parquet[allowed_ids_mask].itertuples():
            embeddings["targets"][target].append(
                dict(ID=row.clip_id, feature_vector=row.mswc_embedding_vector)
            )

    # coalesce nontargets
    keyword_to_samples = {}
    for sample in sample_ids["nontargets"]:
        keyword = Path(sample).parts[0]  # "cat/common_voice_id_12345.wav"
        if keyword not in keyword_to_samples:
            keyword_to_samples[keyword] = []
        keyword_to_samples[keyword].append(sample)
    for keyword, samples in tqdm.tqdm(
        keyword_to_samples.items(), desc="Loading nontargets"
    ):
        parquet_file = pd.read_parquet(embeddings_dir / (keyword + ".parquet"))
        for sample in samples:
            row = parquet_file.loc[parquet_file["clip_id"] == sample].iloc[0]
            embeddings["nontargets"].append(
                dict(ID=row.clip_id, feature_vector=row.mswc_embedding_vector)
            )

    if audio_dir is not None:
        audio_dir = Path(audio_dir)
        for target, sample_list in tqdm.tqdm(
            embeddings["targets"].items(), desc="Loading target audio"
        ):
            for sample in sample_list:
                _, audio = scipy.io.wavfile.read(audio_dir / sample["ID"])
                sample["audio"] = audio
        for sample in tqdm.tqdm(
            embeddings["nontargets"], desc="Loading nontarget audio"
        ):
            _, audio = scipy.io.wavfile.read(audio_dir / sample["ID"])
            sample["audio"] = audio

    return embeddings
