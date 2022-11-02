# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import io
import tempfile

import boto3
import numpy as np
import pandas as pd
from dotenv import load_dotenv


load_dotenv()


class Helper:
    def __init__(self):
        self.initialized = True
        self.s3_client = boto3.client("s3")

    async def get_train_dataset_embedding(self, uid):
        s3_response_object = self.s3_client.get_object(
            Bucket="vision-dataperf",
            Key=f"public_train_dataset_256embeddings_dynabench_formatted/train{str(uid)}.npy",
        )

        with io.BytesIO(s3_response_object["Body"].read()) as f:
            f.seek(0)
            array = np.load(f)
        return array

    def get_test_dataframe(self, bucket_name, key):
        with tempfile.NamedTemporaryFile() as tf:
            self.s3_client.download_fileobj(Bucket=bucket_name, Key=key, Fileobj=tf)
            print("Test file object downloaded")
            dataframe = pd.read_parquet(
                tf, columns=["target_label", "Embedding", "ImageID"], engine="pyarrow"
            )
            test_X = [list(x) for x in dataframe["Embedding"].to_list()]
            return test_X
