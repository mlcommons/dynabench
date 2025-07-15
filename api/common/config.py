# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

from dotenv import load_dotenv


load_dotenv()

config = {
    "aws_access_key_id": os.environ["AWS_ACCESS_KEY_ID"],
    "aws_region": os.environ["AWS_REGION"],
    "aws_s3_bucket_name": os.environ["AWS_S3_BUCKET"],
    "aws_s3_profile_base_url": os.environ["DATASET_S3_PROFILE"],
    "aws_secret_access_key": os.environ["AWS_SECRET_ACCESS_KEY"],
    "builder_sqs_queue": os.environ["SQS_BUILDER"],
    "new_builder_sqs_queue": os.environ["SQS_NEW_BUILDER"],
    "cookie_secret": "",
    "db_host": os.environ["DB_HOST"],
    "db_port": os.environ["DB_PORT"],
    "db_name": os.environ["DB_NAME"],
    "db_user": os.environ["DB_USER"],
    "db_password": os.environ["DB_PASSWORD"],
    "eval_aws_access_key_id": os.environ["EVAL_AWS_ACCESS_KEY_ID"],
    "eval_aws_region": os.environ["EVAL_AWS_REGION"],
    "eval_aws_secret_access_key": os.environ["EVAL_AWS_SECRET_ACCESS_KEY"],
    "evaluation_sqs_queue": os.environ["SQS_EVAL"],
    "jwtalgo": "HS256",
    "jwtexp": 1048576,
    "jwtsecret": os.environ["JWT_SECRET"],
    "profile_img_max_size": 5242880,
    "refreshexp": 90,
    "email_sender_name": "DynaBench",
    "smtp_port": 587,
    "smtp_host": os.environ["SMTP_HOST"],
    "smtp_user": os.environ["SMTP_USER"],
    "smtp_secret": os.environ["SMTP_SECRET"],
    "smtp_from_email_address": os.environ["SMTP_FROM_ADDRESS"],
    "ssl_cert_file_path": os.environ["SSL_CRT_FILE"],
    "ssl_org_pem_file_path": os.environ["SSL_ORG_PEM_FILE"],
    "trial_jwtexp": 900,
    "frontend_ip": os.environ["FRONTEND_IP"],
    "runpod_api_key": os.environ.get("RUNPOD_API_KEY", ""),
}
