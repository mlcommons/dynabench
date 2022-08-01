# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.

import json
import sys

import boto3


sys.path.append("../api")  # noqa
from common.config import config  # noqa isort:skip

if __name__ == "__main__":
    sqs_service = boto3.client(
        "sqs",
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    sqs = boto3.resource("sqs")

    queue = sqs.get_queue_by_name(QueueName="dynabench-build")
    queue.send_message(MessageBody=json.dumps({"model": 123}))
