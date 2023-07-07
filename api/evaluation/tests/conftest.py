# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import boto3
from datasets.common import BaseDataset

import eval_config


# Makes sure to not use AWS secrets when running unit tests.
test_config = {
    "aws_access_key_id": "nope",
    "aws_secret_access_key": "nope",
    "aws_region": "nope",
    "dataset_s3_bucket": "nope",
    "sagemaker_role": "nope",
    "evaluation_sqs_queue": "nope",
    "scheduler_status_dump": "tests/scheduler.dump",
    "computer_status_dump": "tests/computer.dump",
    "eval_server_id": "unittest",
}

# TODO: we should use a diffent DB

eval_config.eval_config.update(test_config)

# Skips the code that check that the dataset are on S3 and in the DB
setattr(BaseDataset, "_check_dataset_on_s3", lambda self: None)


# Prevents from instantiating a S3 client
def no_s3_client(self):
    raise Exception("We shouldn't use S3 during testing")


setattr(boto3, "client", no_s3_client)
setattr(BaseDataset, "s3_client", property(no_s3_client))
