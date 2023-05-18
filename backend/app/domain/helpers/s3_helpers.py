# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

import boto3
from fastapi import File


class S3Helpers:
    def __init__(self):
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.s3_bucket = os.getenv("AWS_S3_BUCKET")

    def upload_file_to_s3(
        self, file_to_upload: File, file_path: str, content_type="application/json"
    ):
        try:
            self.s3.put_object(
                Body=file_to_upload,
                Bucket=self.s3_bucket,
                Key=file_path,
            )
        except Exception as e:
            print(e)
            return False
