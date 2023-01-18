# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import pickle
import tempfile

import boto3
import numpy as np
import pandas as pd
from dotenv import load_dotenv


load_dotenv()


class Helper:
    def __init__(self) -> None:
        self.s3_client = boto3.client("s3")

    def load_test_set(self, bucket_name, key: str):
        with tempfile.NamedTemporaryFile() as tf:
            self.s3_client.download_fileobj(bucket_name, key, tf)
            df = pd.read_parquet(tf, engine="pyarrow")
            X_test = []
            y_test = []
            for j, k in df.iterrows():
                x_sample = np.array(k[0:-1].to_list())
                y_sample = k[-1]
                X_test.append(x_sample)
                y_test.append(y_sample)
            return X_test, y_test
