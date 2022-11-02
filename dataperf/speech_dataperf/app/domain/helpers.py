# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import io

import boto3
import numpy as np
from dotenv import load_dotenv
from fastapi import HTTPException
from tqdm import tqdm


load_dotenv()


class Helper:
    def __init__(self):
        self.initialized = True
        self.s3_client = boto3.client("s3")

    def load_samples(
        self, sample_ids, allowed_training_ids, train_set_size_limit, route
    ):
        self._validate_selected_ids(
            sample_ids, allowed_training_ids, train_set_size_limit
        )

        embeddings_dict = dict(targets={}, nontargets=[])

        for target, id_list in tqdm(sample_ids["targets"].items()):
            embeddings_dict["targets"][target] = []
            for ids in id_list:
                fixed_id = ids.replace("/", "_").rstrip(".wav")
                new_req = self.s3_client.get_object(
                    Bucket="dataperf", Key=f"speech-selection/{route}/{fixed_id}.npy"
                )
                with io.BytesIO(new_req["Body"].read()) as f:
                    f.seek(0)
                    array = np.load(f)
                embeddings_dict["targets"][target].append(array)
            print(target, "is done")

        for ident in tqdm(sample_ids["nontargets"]):
            fixed_id = ident.replace("/", "_").rstrip(".wav")
            new_req = self.s3_client.get_object(
                Bucket="dataperf", Key=f"speech-selection/{route}/{fixed_id}.npy"
            )
            with io.BytesIO(new_req["Body"].read()) as f:
                f.seek(0)
                array = np.load(f)
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
