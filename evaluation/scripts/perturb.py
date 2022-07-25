# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# example usage:
# python perturb.py
# --s3-uri s3://evaluation-us-west-1-096166425824/datasets/nli/zm-mnli-dev-matched.jsonl
# --perturb_prefix fairness --perturb_source augly --perturb_fields context hypothesis

import argparse
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

import boto3
from augly_perturbation import AuglyPerturbation
from textflint_utils.utils import run_textflint


sys.path.append("..")  # noqa
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("perturb")

perturbations = ["fairness", "robustness"]
perturbation_sources = ["augly", "textflint"]


def parse_args() -> Any:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset_path",
        type=str,
        help=(
            "Path to the dataset to perturb; can be a local path "
            "or an s3 uri in the format of s3://<bucket>/<path>"
        ),
    )
    parser.add_argument(
        "--local_path",
        type=str,
        default="",
        help=(
            "Local path to store the downloaded S3 file, "
            "default will download file to current dir"
        ),
    )
    parser.add_argument(
        "--perturb_prefix",
        type=str,
        choices=perturbations,
        help="The type of perturbations to apply",
    )
    parser.add_argument(
        "--perturb_source",
        type=str,
        default="augly",
        choices=perturbation_sources,
        help="The source of perturbations to apply",
    )
    parser.add_argument(
        "--seed",
        type=str,
        default="",
        help=(
            "If provided this will be used to seed the RNG before "
            "applying the perturbations, ensuring reproducibility"
        ),
    )
    parser.add_argument(
        "--num_threads",
        type=int,
        default=1,
        help="The number of threads used to perturb the dataset",
    )
    parser.add_argument(
        "--perturb_fields",
        nargs="+",
        default=[],
        help="The fields in the examples to be perturbed",
    )
    parser.add_argument(
        "--ignore_words_fields",
        nargs="+",
        default=[],
        help=(
            "The fields in the examples to be ignored when perturbing; "
            "e.g. for the 'qa' task, the 'answer' field should be ignored"
        ),
    )
    parser.add_argument(
        "--task",
        type=str,
        default="",
        help="The task name; only must be provided if perturb_source is 'textflint'",
    )
    args = parser.parse_args()

    return args


def parse_s3_uri(s3_uri: str) -> Tuple[str, str, str]:
    parts = s3_uri.replace("s3://", "").split("/")
    s3_bucket = parts[0]
    s3_path = os.path.join(*parts[1:])
    s3_filename = os.path.basename(s3_path)
    return s3_bucket, s3_path, s3_filename


def download_base_from_s3(args: Any) -> Optional[Tuple[str, str]]:
    # If a local path was passed in, we can just use it
    if os.path.exists(args.dataset_path):
        return args.dataset_path, os.path.basename(args.dataset_path), True

    try:
        from eval_config import eval_config as config  # isort:skip

        s3_client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        s3_bucket, s3_path, s3_filename = parse_s3_uri(args.dataset_path)
        local_path = args.local_path if args.local_path else s3_filename
        response = s3_client.download_file(s3_bucket, s3_path, local_path)
        for prefix in perturbations:
            if s3_filename.startswith(args.perturb_prefix):
                ops = (
                    f"Looks like your base s3_uri {args.dataset_path} already "
                    "points to a perturbed version. Continue the workflow? [Y/n] "
                )
                if ops != "Y":
                    logger.info("Abandoning current workflow")
                    return None

        if response:
            logger.info(f"Response from S3 download {response}")
        logger.info(f"Successfully downloaded {args.dataset_path} to {local_path}")

        return local_path, s3_filename.split(".")[0], False

    except Exception as ex:
        logger.exception(f"Failed to download {args.dataset_path} because of {ex}")
        return None


def load_examples(path: str) -> List[Dict[str, Any]]:
    with open(path) as f:
        return [json.loads(line) for line in f]


def perturb(
    path: str,
    perturb_prefix: str,
    perturb_source: str,
    seed: Optional[int],
    num_threads: int,
    perturb_fields: List[str],
    ignore_words_fields: List[str],
    task: str,
) -> str:
    examples = load_examples(path)
    num_examples = len(examples)
    print(
        f"Loaded {num_examples} to perturb with {perturb_source} and {perturb_prefix}"
    )
    if perturb_source == "augly" or perturb_prefix == "fairness":
        pert = AuglyPerturbation(
            perturb_prefix, seed, num_threads, perturb_fields, ignore_words_fields
        )
        perturbed_examples = pert.perturb(examples)
    else:
        perturbed_examples = run_textflint(examples, task)

    outpath = os.path.join(
        os.path.dirname(local_path), f"{perturb_prefix}-{os.path.basename(local_path)}"
    )
    print(f"N perturbed: {len(perturbed_examples)}")
    flattened_examples = []
    for example in perturbed_examples:
        if isinstance(example, list):
            for variant in example:
                flattened_examples.append(variant)
        elif isinstance(example, dict):
            flattened_examples.append(example)
        else:
            raise ValueError(f"Invalid example: {example}")

    print(f"N Flattened Examples: {len(flattened_examples)}")
    with open(outpath, "w") as f:
        for example in flattened_examples:
            f.write(json.dumps(example) + "\n")
    print(f"Wrote perturbed dataset to {outpath}")

    return outpath


def print_instructions(args: Any, outpath: str, base_dataset_name: str) -> None:
    logger.info(
        "Once you are happy with the perturbation, use the following command "
        "to upload the data back to S3 and request evaluation\n"
        f"python request_evaluation.py --path {outpath} --task <task> "
        f"--perturb-prefix {args.perturb_prefix} "
        f"--base-dataset-name {base_dataset_name}"
    )


if __name__ == "__main__":
    args = parse_args()
    downloaded_dataset = download_base_from_s3(args)
    assert downloaded_dataset, "Failed to download dataset from S3"

    local_path, base_dataset_name, is_local_file = downloaded_dataset
    logger.info("Downloaded dataset; now will perturb examples")
    seed = None if args.seed == "" else int(args.seed)
    outpath = perturb(
        local_path,
        args.perturb_prefix,
        args.perturb_source,
        seed,
        args.num_threads,
        args.perturb_fields,
        args.ignore_words_fields,
        args.task,
    )
    print_instructions(args, outpath, base_dataset_name)
    if not is_local_file:
        ops = input(f"Remove locally downloaded file at {local_path}? [Y/n] ")
        if ops == "Y":
            os.remove(local_path)
            logger.info(f"Removed locally downloaded {local_path}")
