# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import io
import json
import os
import random

import boto3
import numpy as np
import pandas as pd
from fastapi import HTTPException


class Buyer:
    def __init__(self):
        self.initialized = True
        self.s3_client = boto3.client("s3")
        self.s3_resource = boto3.resource("s3")
        self.folder_name = "data-acquisition/datasets"
        self.bucket_name = "dataperf"

    def training_sample_creator(self, submission: dict):
        X_train = []
        y_train = []
        market_fractions = []
        for key, values in submission.items():
            for i in range(len(values)):
                dataset_name = os.path.join(self.folder_name, str(key), f"dataset_{i}")
                num_arrays = self.get_num_objects(key, str(i))
                # num_arrays = self.get_num_objects(self.bucket_name, f'{dataset_name}/')
                mark_fraction = values[i] / num_arrays

                if mark_fraction > 1:
                    raise HTTPException(
                        status_code=400,
                        detail=f"selected sample size is bigger than the whole dataset for dataset {i} in market_{key}",
                    )

                market_fractions.append(mark_fraction)
                random_indexes = random.sample(range(0, num_arrays - 1), values[i])
                for index in random_indexes:
                    cur_embedding = self.get_train_embedding(
                        index, self.bucket_name, dataset_name
                    )
                    X_train.append(cur_embedding[:-1])
                    y_train.append(cur_embedding[-1])

        return X_train, y_train, market_fractions

    def get_num_objects(self, market_number, dataset_number):
        with open(f"app/domain/market_{market_number}.json") as f:
            market_info = json.load(f)
        num_arrays = market_info.get(dataset_number)
        return num_arrays

    def get_train_embedding(
        self, embedding_index: int, bucket_name: str, folder_name: str
    ):
        s3_response_object = self.s3_client.get_object(
            Bucket=bucket_name, Key=f"{folder_name}/{str(embedding_index)}.npy"
        )
        with io.BytesIO(s3_response_object["Body"].read()) as f:
            f.seek(0)
            array = np.load(f)
        return array

    # This method was created to count the number of objects per dataset, but takes too long. Needs refining.
    # def get_num_objects(self,bucket_name: str, prefix: str):
    #     bucket = self.s3_resource.Bucket(bucket_name)
    #     new = bucket.objects.filter(Prefix = prefix)
    #     num_arrays = 0
    #     for i in new.all():
    #         num_arrays+=1
    #     return num_arrays
