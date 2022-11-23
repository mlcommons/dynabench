# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import re
import sys
import tempfile

import boto3
import bottle
import yaml
from bottle import response

import common.auth as _auth
import common.helpers as util
from common.config import config
from common.logging import logger
from models.dataset import AccessTypeEnum, DatasetModel, LogAccessTypeEnum
from models.score import ScoreModel
from models.task import AnnotationVerifierMode, TaskModel

from .tasks import ensure_owner_or_admin, get_secret_for_task_id


from utils.helpers import (  # noqa isort:skip
    decen_send_eval_download_dataset_request,
    decen_send_reload_dataset_request,
    get_data_s3_path,
    send_eval_request,
)


sys.path.append("../evaluation")  # noqa isort:skip


@bottle.get("/datasets/get_access_types")
def get_access_types():
    return util.json_encode([enum.name for enum in AccessTypeEnum])


@bottle.get("/datasets/get_log_access_types")
def get_log_access_types():
    return util.json_encode([enum.name for enum in LogAccessTypeEnum])


@bottle.put("/datasets/update/<did:int>")
@_auth.requires_auth
def update(credentials, did):
    dm = DatasetModel()
    dataset = dm.get(did)
    ensure_owner_or_admin(dataset.tid, credentials["id"])

    data = bottle.request.json
    for field in data:
        if field not in (
            "longdesc",
            "rid",
            "source_url",
            "access_type",
            "log_access_type",
        ):
            bottle.abort(
                403,
                """
            Can only modify longdesc, round, source_url, access_type, log_access_type
            """,
            )

    dm.update(did, data)
    return util.json_encode({"success": "ok"})


@bottle.delete("/datasets/delete/<did:int>")
@_auth.requires_auth
def delete(credentials, did):
    dm = DatasetModel()
    dataset = dm.get(did)
    ensure_owner_or_admin(dataset.tid, credentials["id"])

    tm = TaskModel()
    task = tm.get(dataset.tid)

    # Delete all scores that reference this dataset first
    sm = ScoreModel()
    scores_to_delete = sm.getByDid(did)
    for score in scores_to_delete:
        sm.delete(score)

    delta_metric_types = [
        config["type"]
        for config in yaml.load(task.config_yaml, yaml.SafeLoader).get(
            "delta_metrics", []
        )
    ]
    delta_metric_types.append(None)

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=config["eval_aws_access_key_id"],
        aws_secret_access_key=config["eval_aws_secret_access_key"],
        region_name=config["eval_aws_region"],
    )

    for perturb_prefix in delta_metric_types:
        s3_client.delete_object(
            Bucket=task.s3_bucket,
            Key=get_data_s3_path(
                task.task_code, dataset.name + ".jsonl", perturb_prefix
            ),
        )

    dm.delete(dataset)

    if task.is_decen_task:

        eval_config = {
            "aws_access_key_id": config["aws_access_key_id"],
            "aws_secret_access_key": config["aws_secret_access_key"],
            "aws_region": config["aws_region"],
        }

        decen_send_reload_dataset_request(task=task, config=eval_config, logger=logger)

    return util.json_encode({"success": "ok"})


@bottle.post("/datasets/create/<tid:int>/<name>")
@_auth.requires_auth
def create(credentials, tid, name):
    ensure_owner_or_admin(tid, credentials["id"])

    if not bool(re.fullmatch("[a-zA-Z0-9-]{1,62}", name)):
        bottle.abort(
            400,
            "Invalid dataset name - must only contain alphanumeric characters "
            + "or '-' and must be shorter than 63 characters",
        )

    dataset_upload = bottle.request.files.get("file")

    tm = TaskModel()
    task = tm.get(tid)

    delta_dataset_uploads = []
    delta_metric_types = [
        config["type"]
        for config in yaml.load(task.config_yaml, yaml.SafeLoader).get(
            "delta_metrics", []
        )
    ]
    for delta_metric_type in delta_metric_types:
        delta_dataset_uploads.append(
            (bottle.request.files.get(delta_metric_type), delta_metric_type)
        )

    uploads = [(dataset_upload, None)] + delta_dataset_uploads

    parsed_uploads = []
    # Ensure correct format
    for upload, perturb_prefix in uploads:
        try:
            parsed_upload = [
                util.json_decode(line)
                for line in upload.file.read().decode("utf-8").splitlines()
            ]
        except Exception as ex:
            logger.exception(ex)
            bottle.abort(400, "Could not parse dataset file. Is it a utf-8 jsonl?")

        for io in parsed_upload:
            try:
                assert "uid" in io, "'uid' must be present for every example"
                # assert (
                #     "tags" in io
                # ), "there must be a field called 'tags' on every line of the jsonl"
                # assert isinstance(
                #     io["tags"], list
                # ), "'tags' must be a list on every line of the jsonl"
                if perturb_prefix is not None:
                    assert "input_id" in io, (
                        "'input_id' must be present for every example for"
                        + " perturbed dataset uploads"
                    )
            except Exception as ex:
                bottle.abort(400, str(ex))

            verified, message = task.verify_annotation(
                io, mode=AnnotationVerifierMode.dataset_upload
            )
            if not verified:
                bottle.abort(400, message)
        parsed_uploads.append((parsed_upload, perturb_prefix))

    # Upload to s3

    if task.is_decen_task:
        s3_paths = []

    for parsed_upload, perturb_prefix in parsed_uploads:
        try:
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=config["eval_aws_access_key_id"],
                aws_secret_access_key=config["eval_aws_secret_access_key"],
                region_name=task.aws_region,
            )

            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for datum in parsed_upload:
                    tmp.write(util.json_encode(task.convert_to_model_io(datum)) + "\n")
                tmp.close()
                response = s3_client.upload_file(
                    tmp.name,
                    task.s3_bucket,
                    get_data_s3_path(task.task_code, name + ".jsonl", perturb_prefix),
                )
                if task.is_decen_task:
                    s3_paths.append(
                        get_data_s3_path(
                            task.task_code, name + ".jsonl", perturb_prefix
                        )
                    )
                os.remove(tmp.name)
                if response:
                    logger.info(response)
        except Exception as ex:
            logger.exception(f"Failed to load {name} to S3 due to {ex}.")
            bottle.abort(400, "Issue loading dataset to S3")

    # Create an entry in the db for the dataset, or skip if one already exists.
    d = DatasetModel()
    updated_existing_dataset = False
    if not d.getByName(name):  # avoid id increment for unsuccessful creation
        if d.create(
            name=name,
            task_id=tid,
            rid=0,
            access_type=AccessTypeEnum.hidden,
            longdesc=None,
            source_url=None,
        ):
            logger.info(f"Registered {name} in datasets db.")
    else:
        updated_existing_dataset = True

    return util.json_encode(
        {"success": "ok", "updated_existing_dataset": updated_existing_dataset}
    )


@bottle.get("/datasets/<did:int>/download")
def download_dataset(did):
    dm = DatasetModel()
    tm = TaskModel()

    dataset = dm.get(did)
    name = dataset.name

    task = tm.get(dataset.tid)

    req_data = bottle.request.json

    try:
        secrets = get_secret_for_task_id(dataset.tid)

        if not util.verified_data_mult_secret(req_data, secrets):
            bottle.abort(401, "Operation not authorized")

        data = req_data["data"]

        if set(data.keys()) != {"perturb_prefix", "dataset_id"}:
            bottle.abort(401, "Operation not authorized")

        perturb_prefix = data["perturb_prefix"]

        client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )

        s3_path = get_data_s3_path(task.task_code, name + ".jsonl", perturb_prefix)
        temp_file_path = name + ".jsonl"
        final_filepath = f"/tmp/{temp_file_path}"

        _ = client.download_file(task.s3_bucket, s3_path, final_filepath)

        f = open(final_filepath, "rb")
        response.headers["Content-Type"] = "application/octet-stream"
        response.headers[
            "Content-Disposition"
        ] = f"attachment; filename={final_filepath}"
        return f

    except Exception as e:
        logger.exception("Could not download dataset: %s" % (e))
        bottle.abort(400, "Could not download dataset: %s" % (e))
