# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json

import boto3


class Seller:
    def __init__(self):
        self.s3_client = boto3.client("s3")

    def set_data_price(self):
        s3_response_object = self.s3_client.get_object(
            Bucket="dataperf", Key="data-acquisition/market_prices.json"
        )
        file_content = s3_response_object["Body"].read().decode("utf-8")
        market_prices = json.loads(file_content)

        return market_prices
