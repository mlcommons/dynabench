# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json

import boto3
import numpy as np
from fastapi import FastAPI, Header, HTTPException


class Market:
    def __init__(self):
        self.s3_client = boto3.client("s3")

    def budget_verifier(self, budget, dataset_cost):
        if budget < dataset_cost:
            raise HTTPException(status_code=400, detail="Budget limit exceeded")
        else:
            return True

    def budget_setter(self):
        s3_response_object = self.s3_client.get_object(
            Bucket="dataperf", Key="data-acquisition/budget.json"
        )
        file_content = s3_response_object["Body"].read().decode("utf-8")
        budget_dict = json.loads(file_content)
        return budget_dict

    def dataset_cost_estimator(self, market_fractions: list, market_data: dict):
        price_max = market_data.get("max_p")
        pricing_method = market_data.get("method")

        if pricing_method == "Linear":
            dataset_cost = np.sum(np.dot(market_fractions, price_max))

        return dataset_cost
