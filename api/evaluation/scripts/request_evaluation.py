# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# example usage:
# python request_evaluation.py --path zm-mnli-dev-matched.jsonl
# --task nli --perturb-prefix fairness
# --base-dataset-name zm-mnli-dev-matched

import argparse
import logging
import os
import sys

import boto3
from dynalab_cli.utils import get_tasks


sys.path.append("..")  # noqa
from eval_config import eval_config as config  # isort:skip
from utils.helpers import (  # isort:skip
    get_data_s3_path,  # isort:skip
    get_perturbed_filename,  # isort:skip
    path_available_on_s3,  # isort:skip
    send_eval_request,  # isort:skip
)

sys.path.append("../../api")  # noqa
from models.task import TaskModel  # isort:skip

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("request_evaluation")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--path", type=str, help="Local path to the file to be uploaded"
    )
    parser.add_argument("--task_code", type=str, choices=get_tasks(), help="Task code")
    parser.add_argument(
        "--perturb-prefix", type=str, choices=["fairness", "robustness"]
    )  # TODO: get this from task config
    parser.add_argument(
        "--base-dataset-name",
        type=str,
        help="The base unique dataset name, without prefix, e.g. mnli-dev-mismatched",
    )
    args = parser.parse_args()

    return args


def upload_to_S3_and_eval(args):
    try:
        ext = os.path.basename(args.path).split(".")[-1]
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        tm = TaskModel()
        task = tm.getByTaskCode(args.task_code)
        base_filename = f"{args.base_dataset_name}.{ext}"
        base_s3_path = get_data_s3_path(args.task_code, base_filename)
        if not path_available_on_s3(s3_client, task.s3_bucket, base_s3_path):
            logger.exception(
                f"Base dataset file {base_filename} does not exist at {base_s3_path}"
            )
            return False
        s3_path = get_data_s3_path(
            args.task_code, base_filename, perturb_prefix=args.perturb_prefix
        )
        if path_available_on_s3(s3_client, task.s3_bucket, s3_path):
            ops = input(f"Dataset already exists at {s3_path}. Overwrite? [Y/n] ")
            if ops != "Y":
                return False
            else:
                logger.info(f"Overwriting {s3_path} with {args.path}")
        response = s3_client.upload_file(args.path, task.s3_bucket, s3_path)
        if response:
            logger.info(f"Response from S3 upload {response}")
        logger.info(f"Successfully uploaded {args.path} to {s3_path}")
        perturbed_filename = get_perturbed_filename(
            base_filename, perturb_prefix=args.perturb_prefix
        )
        send_eval_request(
            model_id="*",
            dataset_name=perturbed_filename.split(".")[0],
            config=config,
            eval_server_id=task.eval_server_id,
            logger=logger,
        )

    except Exception as ex:
        logger.exception(f"Failed to upload to S3 because of {ex}")
        return False


if __name__ == "__main__":
    args = parse_args()
    upload_to_S3_and_eval(args)
