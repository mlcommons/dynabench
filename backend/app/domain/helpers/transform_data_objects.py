# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json

import pandas as pd
from fastapi import UploadFile


def load_json_lines(jsonl_file: UploadFile) -> list:
    data = []
    for line in jsonl_file.readlines():
        data.append(json.loads(line))
    return data


def transform_list_to_csv(data: list, filename: str) -> str:
    df_data = pd.DataFrame(data)
    csv_location = f"app/resources/{filename}.csv"
    df_data.to_csv(csv_location, index=False)
    return csv_location
