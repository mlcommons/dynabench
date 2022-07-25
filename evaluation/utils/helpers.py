# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import sys
import tempfile
from datetime import datetime, timedelta
from pathlib import Path
from typing import List

import boto3
import requests
import ujson

import common.helpers as util
from eval_config import eval_config
from models.model import ModelModel


sys.path.append("../api")  # noqa

DYNABENCH_API = eval_config["DYNABENCH_API"]
decen_eaas_secret = eval_config["decen_eaas_secret"]
task_code = eval_config["task_code"]


def generate_job_name(
    endpoint_name: str, perturb_prefix: str, dataset_name: str, timestamp: int
):
    """Generate the job name with a given timestamp.

    The timestamp need to be properly spaced out, because they need to be unique
    across all jobs in the same AWS region.
    This is taken care of by `_set_jobname_with_unique_timestamp`
    """
    suffix = f"-{timestamp}"
    prefix = "-".join(filter(None, (endpoint_name, perturb_prefix, dataset_name)))
    # :63 is AWS requirement, and we want to keep the timestamp intact
    return prefix[: 63 - len(suffix)] + suffix


def update_evaluation_status(mid, dataset_name, evaluation_status):
    mm = ModelModel()
    model = mm.get(mid)
    if model.evaluation_status_json:
        eval_statuses = json.loads(model.evaluation_status_json)
    else:
        eval_statuses = {}
    eval_statuses[dataset_name] = evaluation_status
    model.evaluation_status_json = json.dumps(eval_statuses)
    mm.dbs.add(model)
    mm.dbs.flush()
    mm.dbs.commit()


def get_predictions_s3_path(endpoint_name, task_code, dataset_name):
    return os.path.join(
        "predictions", endpoint_name, "raw", task_code, f"{dataset_name}.jsonl.out"
    )


def decen_send_eval_download_dataset_request(
    dataset_id,
    config,
    eval_server_id,
    delta_metric_types,
    s3_paths,
    queue_name,
    task_aws_account_id,
    dataset_name,
    logger=None,
):
    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    sqs = session.resource("sqs")

    queue = sqs.get_queue_by_name(
        QueueName=queue_name, QueueOwnerAWSAccountId=task_aws_account_id
    )

    msg = {
        "download_dataset": True,
        "dataset_id": dataset_id,
        "dataset_name": dataset_name,
        "eval_server_id": eval_server_id,
        "delta_metric_types": delta_metric_types,
        "s3_paths": s3_paths,
    }
    queue.send_message(MessageBody=json.dumps(msg))
    if logger:
        logger.info(
            f"Sent message to {queue_name} on account " "{task_aws_account_id}: {msg}"
        )
    return True


def decen_send_reload_dataset_request(task, config, logger=None):
    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    sqs = session.resource("sqs")

    queue = sqs.get_queue_by_name(
        QueueName=task.eval_sqs_queue, QueueOwnerAWSAccountId=task.task_aws_account_id
    )

    msg = {
        "reload_datasets": True,
        "eval_server_id": task.eval_server_id,
    }

    queue.send_message(MessageBody=json.dumps(msg))
    if logger:
        logger.info(
            f"Sent message to {task.eval_sqs_queue} on "
            "account {task.task_aws_account_id}: {msg}"
        )
    return True


def send_eval_request(
    model_id,
    dataset_name,
    config,
    eval_server_id,
    logger=None,
    reload_datasets=False,
    decen=False,
    decen_queue_name=None,
    decen_queue_aws_account_id=None,
):
    """
    If dataset name is a perturbed dataset with prefix, will evaluate this
    perturbed dataset only;
    else if dataset name is a base dataset name without prefix, will try to
    evaluate itself plus any perturbed dataset available to generate delta metrics
    """
    try:
        assert (
            model_id == "*" or isinstance(model_id, int) or isinstance(model_id, list)
        ), f"model_id can either be an integer, a list of integers, or *"
        assert (
            dataset_name == "*"
            or isinstance(dataset_name, str)
            or isinstance(dataset_name, list)
        ), f"dataset_name can either be a string, a list of strings, or *"
    except AssertionError as ex:
        if logger:
            logger.error(ex)
        return False
    else:
        if decen:
            assert (decen_queue_name is not None) and (
                decen_queue_aws_account_id is not None
            )

        session = boto3.Session(
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        sqs = session.resource("sqs")
        if decen:
            queue = sqs.get_queue_by_name(
                QueueName=decen_queue_name,
                QueueOwnerAWSAccountId=decen_queue_aws_account_id,
            )
        else:
            queue = sqs.get_queue_by_name(QueueName=config["evaluation_sqs_queue"])
        msg = {
            "reload_datasets": reload_datasets,
            "model_id": model_id,
            "dataset_name": dataset_name,
            "eval_server_id": eval_server_id,
        }
        queue.send_message(MessageBody=json.dumps(msg))
        if logger:
            if decen:
                logger.info(
                    f"Sent message to {decen_queue_name} on "
                    "account {decen_queue_aws_account_id}: {msg}"
                )
            else:
                logger.info(f"Sent message to {config['evaluation_sqs_queue']}: {msg}")
        return True


def send_takedown_model_request(
    model_id, config, s3_uri=None, logger=None, decen=False
):
    if not s3_uri:
        s3_uri = ""
    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    sqs = session.resource("sqs")

    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    msg = {"model_id": model_id, "s3_uri": s3_uri}
    if decen:
        # In decentralized mode we need to send more information to the builder
        model_info = api_model_info(model_id)
        model_info["deployment_status"] = "failed"
        msg["model_info"] = json.dumps(model_info)
        msg["task_info"] = "{}"
    queue.send_message(MessageBody=json.dumps(msg))
    if logger:
        logger.info(f"Sent message to {config['builder_sqs_queue']}: {msg}")
    return True


def round_end_dt(dt, delta=60, offset=1):
    delta = timedelta(seconds=delta)
    dt_naive = dt.replace(tzinfo=None)
    ceil = dt_naive + (datetime.min - dt_naive) % delta
    return ceil.replace(tzinfo=dt.tzinfo) + timedelta(seconds=offset)


def round_start_dt(dt, delta=60, offset=1):
    delta = timedelta(seconds=delta)
    dt_naive = dt.replace(tzinfo=None)
    floor = dt_naive - (dt_naive - datetime.min) % delta
    return floor.replace(tzinfo=dt.tzinfo) - timedelta(seconds=offset)


def process_aws_metrics(datapoints):
    """
    Datapoints are a list of dictionaries with exactly the same keys
    """
    return sum([data["Average"] for data in datapoints]) / len(datapoints)


def get_perturb_prefix(dataset_name, datasets):
    if dataset_name in datasets:
        return dataset_name, None

    perturb_prefix = dataset_name.split("-")[0]
    original_dataset_name = dataset_name[len(perturb_prefix) + 1 :]
    if original_dataset_name in datasets:
        return original_dataset_name, perturb_prefix
    else:
        raise RuntimeError(f"Dataset {dataset_name} not found.")


def get_perturbed_filename(filename, perturb_prefix=None):
    filename = f"{perturb_prefix}-{filename}" if perturb_prefix else filename
    return filename


def get_data_s3_path(task, filename, perturb_prefix=None):
    filename = get_perturbed_filename(filename, perturb_prefix)
    return "/".join(("datasets", task, filename))


def path_available_on_s3(s3_client, s3_bucket, path, perturb_prefix=None):
    response = s3_client.list_objects_v2(Bucket=s3_bucket, Prefix=path)
    for obj in response.get("Contents", []):
        if obj["Key"] == path:
            return True
    return False


def parse_s3_uri(s3_uri):
    parts = s3_uri.replace("s3://", "").split("/")
    s3_bucket = parts[0]
    s3_path = "/".join(parts[1:])
    return s3_bucket, s3_path


def update_metadata_json_string(original_json_string, new_json_string_list):
    original_json = json.loads(original_json_string)
    for new_json_string in new_json_string_list:
        new_json = json.loads(new_json_string)
        original_json = {**original_json, **new_json}
    metadata_json_string = json.dumps(original_json)
    return metadata_json_string


def parse_s3_outfile(s3_client, s3_uri: str) -> List[dict]:
    """Download raw predictions/dataset file from S3 and parse it.

    We parse batch transform output by balancing brackets,
    since torchserve outputs pretty printed json by default
    """
    raw_s3_bucket, raw_s3_path = parse_s3_uri(s3_uri)
    fd, local_file = tempfile.mkstemp(suffix=raw_s3_path.split("/")[-1])
    s3_client.download_file(raw_s3_bucket, raw_s3_path, local_file)
    os.close(fd)

    data = []
    json_lines = True
    with open(local_file) as f:
        tmp = ""
        lb = 0
        for line in f:
            if not (line.startswith("{") and line.endswith("}\n")):
                json_lines = False
            if json_lines:
                # One json per line
                data.append(json.loads(line))
                continue
            line = line.strip()
            if line.startswith("{") or line.endswith("{"):
                lb += 1
            elif line.startswith("}") or line.endswith("}"):
                lb -= 1
            if lb == 0 and tmp:
                tmp += line
                data.append(json.loads(tmp))
                tmp = ""
            elif line:
                tmp += line
    os.remove(local_file)
    return data


def upload_predictions(s3_client, s3_uri: str, predictions: List[dict]) -> None:
    s3_bucket, s3_path = parse_s3_uri(s3_uri)
    fd, parsed_pred_file = tempfile.mkstemp(suffix=s3_uri.split("/")[-1] + ".parsed")
    with open(parsed_pred_file, "w") as f:
        for pred in predictions:
            f.write(json.dumps(pred) + "\n")
    s3_client.upload_file(parsed_pred_file, s3_bucket, s3_path)
    os.close(fd)
    os.remove(parsed_pred_file)


# Decentralized Eaas Helpers
class dotdict(dict):
    """dot.notation access to dictionary attributes"""

    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


def api_model_eval_update(model_id, dataset_name, evaluation_status, prod=False):
    data = {"evaluation_status": evaluation_status, "dataset_name": dataset_name}

    _ = requests.get(
        f"{DYNABENCH_API}/models/{model_id}/update_evaluation_status",
        data=json.dumps(util.wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )


def api_update_database_with_metrics(data_pkg, prod=False):
    r = requests.post(
        f"{DYNABENCH_API}/models/update_database_with_metrics",
        data=json.dumps(util.wrap_data_with_signature(data_pkg, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )

    return r.json()


def api_get_next_job_score_entry(job, prod=False):
    str_encoded_obj = ujson.dumps(job, default=str)

    r = requests.get(
        f"{DYNABENCH_API}/models/eval_score_entry",
        data=ujson.dumps(
            util.wrap_data_with_signature(str_encoded_obj, decen_eaas_secret)
        ),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )

    return r.json()


def api_model_info(model_id, prod=False) -> str:
    data = {"model_id": model_id}

    r = requests.get(
        f"{DYNABENCH_API}/models/{model_id}/get_model_info",
        data=json.dumps(util.wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )

    return r.json()


def api_model_update(mid, model_status, prod=False):
    data = {"deployment_status": model_status}

    _ = requests.post(
        f"{DYNABENCH_API}/models/{mid}/update_decen_eaas",
        data=json.dumps(util.wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )


def load_models_ids_for_task_owners():
    task_code = eval_config["task_code"]
    data = {"task_code": task_code}

    r = requests.get(
        f"{DYNABENCH_API}/tasks/listmodelsids",
        data=json.dumps(util.wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=False,
    )

    model_ids_list = r.json()

    return model_ids_list


def api_download_dataset(dataset_id, perturb_prefix, local_file: Path) -> None:
    data = {"dataset_id": dataset_id, "perturb_prefix": perturb_prefix}

    _, download_filename = tempfile.mkstemp(
        prefix=f"{dataset_id}_{perturb_prefix}", suffix=".tar.gz"
    )
    with requests.get(
        f"{DYNABENCH_API}/datasets/{dataset_id}/download",
        data=json.dumps(util.wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        stream=True,
    ) as r:
        r.raise_for_status()
        with open(download_filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
    Path(download_filename).rename(local_file)
