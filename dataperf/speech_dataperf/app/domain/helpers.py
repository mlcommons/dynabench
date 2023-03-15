# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import io
import os
import pickle
import tempfile

import boto3
import numpy as np
import pandas as pd
import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from tqdm import tqdm


load_dotenv()


class Helper:
    def __init__(self):
        self.initialized = True
        self.s3_client = boto3.client("s3")

    def load_samples(
        self, language, sample_ids, allowed_training_ids, train_set_size_limit, bucket
    ):
        self._validate_selected_ids(
            sample_ids, allowed_training_ids, train_set_size_limit
        )
        embeddings_dict = dict(targets={}, nontargets=[])
        for target, id_list in tqdm(sample_ids["targets"].items()):
            with tempfile.NamedTemporaryFile() as tf:
                final_key = (
                    f"speech-selection/{language}/train_embeddings/{target}.parquet"
                )
                self.s3_client.download_fileobj(
                    Bucket=bucket, Key=final_key, Fileobj=tf
                )
                df = pd.read_parquet(tf, engine="pyarrow")
                embeddings_dict["targets"][target] = []
                for ids in id_list:
                    array = (df[df["clip_id"] == ids]["mswc_embedding_vector"]).values[
                        0
                    ]
                    embeddings_dict["targets"][target].append(array)
                print(target, "is done")

        for ident in tqdm(sample_ids["nontargets"]):
            cur_class = ident.split("/")
            with tempfile.NamedTemporaryFile() as tf:
                final_key = f"speech-selection/{language}/train_embeddings/{cur_class[0]}.parquet"
                self.s3_client.download_fileobj(
                    Bucket=bucket, Key=final_key, Fileobj=tf
                )
                df = pd.read_parquet(tf, engine="pyarrow")
                array = (df[df["clip_id"] == ident]["mswc_embedding_vector"]).values[0]
                embeddings_dict["nontargets"].append(array)

        return embeddings_dict

    def create_dataset(self, embeddings):
        target_to_classid = {
            target: ix + 1
            for ix, target in enumerate(sorted(embeddings["targets"].keys()))
        }

        target_to_classid["nontarget"] = 0

        target_samples = []
        target_labels = []
        for target, samples in embeddings["targets"].items():
            for sample in samples:
                target_samples.append(np.array(sample))
                target_labels.append(np.array(target_to_classid[target]))

        target_samples_array = np.array(target_samples)
        target_labels_array = np.array(target_labels)

        nontarget_samples = []
        for sample in embeddings["nontargets"]:
            nontarget_samples.append(sample)

        nontarget_samples_array = np.array(nontarget_samples)
        nontarget_labels = np.zeros(nontarget_samples_array.shape[0])

        Xs = np.vstack([target_samples_array, nontarget_samples_array])
        ys = np.concatenate([target_labels_array, nontarget_labels])

        return Xs, ys

    def load_allowed_training_set(self, bucket, language):
        final_key = f"speech-selection/{language}/allowed_training_set.yaml"
        response = self.s3_client.get_object(Bucket=bucket, Key=final_key)
        yaml_bytes = response["Body"].read()
        allowed = yaml.safe_load(yaml_bytes)
        return allowed

    def load_testing_embeddings(self, bucket, language):
        final_key = f"speech-selection/{language}/testing_embeddings.pickle"
        response = self.s3_client.get_object(Bucket=bucket, Key=final_key)
        embeddings_bytes = response["Body"].read()
        testing_embeddings = pickle.loads(embeddings_bytes)
        return testing_embeddings

    def _validate_selected_ids(
        self, selected_ids, allowed_training_ids, train_set_size_limit
    ):

        groundtruth_targets = set(allowed_training_ids["targets"].keys())

        for target in selected_ids["targets"].keys():
            if target not in groundtruth_targets:
                raise HTTPException(
                    status_code=400, detail=f"target {target} not in allowed set"
                )
        groundtruth_target_ids = {
            target: set(samples)
            for target, samples in allowed_training_ids["targets"].items()
        }
        n_training_samples = sum(
            [len(samples) for samples in selected_ids["targets"].values()]
        ) + len(selected_ids["nontargets"])
        if n_training_samples > train_set_size_limit:
            raise HTTPException(
                status_code=400, detail="submission exceeds 120 sample limit"
            )

        for target, samples in selected_ids["targets"].items():
            if set(samples).issubset(groundtruth_target_ids[target]):
                continue
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"{target} contains an ID not in allowed set",
                )

        groundtruth_nontarget_ids = set(allowed_training_ids["nontargets"])
        if set(selected_ids["nontargets"]).issubset(groundtruth_nontarget_ids) is False:
            raise HTTPException(
                status_code=400, detail=f"nontarget contains an ID not in allowed set"
            )
