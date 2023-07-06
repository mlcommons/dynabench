# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
#
import os

from dotenv import load_dotenv


load_dotenv()

eval_config = {
    "dataperf_aws_access_key_id": os.environ["DATAPERF_AWS_ACCESS_KEY_ID"],
    "dataperf_aws_secret_access_key": os.environ["DATAPERF_AWS_SECRET_ACCESS_KEY"],
    "dataperf_aws_region": os.environ["DATAPERF_AWS_REGION"],
    "aws_access_key_id": os.environ["EVAL_AWS_ACCESS_KEY_ID"],
    "aws_secret_access_key": os.environ["EVAL_AWS_SECRET_ACCESS_KEY"],
    "aws_region": os.environ["EVAL_AWS_REGION"],
    "sagemaker_role": os.environ["SAGEMAKER_ROLE"],
    "dataset_s3_bucket": os.environ["DATASET_S3_BUCKET"],
    "evaluation_sqs_queue": os.environ["SQS_EVAL"],
    "scheduler_status_dump": "scheduler.dump",
    "computer_status_dump": "computer.dump",
    "max_submission": 20,
    "eval_server_id": "default",
    "compute_metric_processes": 4,
    "DYNABENCH_API": os.environ["DYNABENCH_API"],
    "decen_eaas_secret": os.environ["DECEN_EAAS_SECRET"],
    "task_code": os.environ["TASK_CODE"],
}
