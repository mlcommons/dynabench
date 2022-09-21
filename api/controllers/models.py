# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import os
import secrets
import sys
import tempfile
import time
from typing import List

import boto3
import bottle
import numpy as np
import pandas as pd
import requests
import sklearn
import sqlalchemy as db
import ujson
import yaml
from bottle import response
from infrastructure.email.mail_service import Email

import common.auth as _auth
import common.helpers as util
from common.config import config
from common.logging import logger
from models.badge import BadgeModel
from models.dataset import AccessTypeEnum, DatasetModel, LogAccessTypeEnum
from models.model import DeploymentStatusEnum, ModelModel
from models.notification import NotificationModel
from models.round import RoundModel
from models.score import ScoreModel
from models.task import AnnotationVerifierMode, TaskModel, train_file_metrics
from models.task_user_permission import TaskUserPermission
from models.user import UserModel

from .tasks import ensure_owner_or_admin


from utils.helpers import (  # noqa isort:skip
    get_data_s3_path,  # noqa isort:skip
    get_predictions_s3_path,  # noqa isort:skip
    parse_s3_outfile,  # noqa isort:skip
    send_eval_request,  # noqa isort:skip
    update_metadata_json_string,  # noqa isort:skip
    dotdict,  # noqa isort:skip
    generate_job_name,  # noqa isort:skip
)  # noqa isort:skip

from utils.helpers import update_evaluation_status  # noqa isort:skip

sys.path.append("../evaluation")  # noqa isort:skip
from metrics.metric_getters import get_job_metrics  # noqa isort:skip


@bottle.get("/models/latest_job_log/<mid:int>/<did:int>")
@_auth.requires_auth
def get_latest_job_log(credentials, mid, did):
    u = UserModel()
    uid = credentials["id"]
    user = u.get(uid)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (uid))
        bottle.abort(404, "User information not found")

    mm = ModelModel()
    model = mm.get(mid)
    if model.uid != uid:
        ensure_owner_or_admin(model.tid, uid)

    dm = DatasetModel()
    dataset = dm.get(did)
    if dataset.log_access_type == LogAccessTypeEnum.owner:
        ensure_owner_or_admin(model.tid, uid)

    tm = TaskModel()
    task = tm.get(model.tid)

    delta_metric_types = [
        task_config["type"]
        for task_config in yaml.load(task.config_yaml, yaml.SafeLoader).get(
            "delta_metrics", []
        )
    ]
    delta_metric_types.append(None)

    perturb_prefix_to_logs = {}
    for perturb_prefix in delta_metric_types:

        job_name_without_timestamp_suffix = generate_job_name(
            model.endpoint_name, perturb_prefix, dataset.name, timestamp=""
        )
        client = boto3.client(
            "logs",
            aws_access_key_id=config["eval_aws_access_key_id"],
            aws_secret_access_key=config["eval_aws_secret_access_key"],
            region_name=config["eval_aws_region"],
        )
        log_streams = client.describe_log_streams(
            logGroupName="/aws/sagemaker/TransformJobs",
            logStreamNamePrefix=job_name_without_timestamp_suffix,
            descending=True,
        )["logStreams"]

        logs_from_latest_job = {}
        if log_streams:
            latest_job_timestamp = (
                log_streams[0]["logStreamName"].split("/")[0].split("-")[-1]
            )
            for log_stream in log_streams:
                job_timestamp = log_stream["logStreamName"].split("/")[0].split("-")[-1]
                if job_timestamp == latest_job_timestamp:
                    log = client.get_log_events(
                        logGroupName="/aws/sagemaker/TransformJobs",
                        logStreamName=log_stream["logStreamName"],
                    )
                    if log_stream["logStreamName"].endswith("data-log"):
                        if "sagemaker_log" in logs_from_latest_job:
                            logger.error(
                                """Too many logs for the same job.
                                Not sure which one to choose."""
                            )
                            bottle.abort(
                                400,
                                """Too many logs for the same job.
                                Not sure which one to choose.""",
                            )
                        logs_from_latest_job["sagemaker_log"] = log
                    else:
                        if "log" in logs_from_latest_job:
                            logger.error(
                                """Too many logs for the same job.
                                Not sure which one to choose."""
                            )
                            bottle.abort(
                                400,
                                """Too many logs for the same job.
                                Not sure which one to choose.""",
                            )
                        logs_from_latest_job["log"] = log
                else:
                    break
            perturb_prefix_to_logs[perturb_prefix] = logs_from_latest_job

    return util.json_encode(perturb_prefix_to_logs)


@bottle.post("/models/upload_train_files/<tid:int>/<model_name>")
@_auth.requires_auth
def do_upload_via_train_files(credentials, tid, model_name):
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    tm = TaskModel()
    task = tm.get(tid)
    task_config = yaml.load(task.config_yaml, yaml.SafeLoader)
    if "train_file_metric" not in task_config:
        bottle.abort(
            403,
            """This task does not allow train file uploads. Submit a model instead.""",
        )

    m = ModelModel()
    if (
        bottle.default_app().config["mode"] == "prod"
        and m.getCountByUidTidAndHrDiff(
            user_id, tid=task.id, hr_diff=task.dynalab_hr_diff
        )
        >= task.dynalab_threshold
    ):
        logger.error("Submission limit reached for user (%s)" % (user_id))
        bottle.abort(429, "Submission limit reached")

    sm = ScoreModel()

    rm = RoundModel()

    train_files = {}
    dm = DatasetModel()
    datasets = list(dm.getByTid(tid))
    dataset_names = [dataset.name for dataset in datasets]
    for name in dataset_names:
        train_files[name] = bottle.request.files.get(name)

    # Users don't need to upload train sets for all datasets.
    train_files = {
        name: train_files[name]
        for name, upload in train_files.items()
        if train_files[name] is not None
    }

    for dataset in datasets:
        if (
            dataset.access_type == AccessTypeEnum.scoring
            and dataset.name not in train_files.keys()
        ):

            bottle.abort(400, "Need to upload train files for all leaderboard datasets")

    # accumulated_predictions = [] Implementation for accumulated labels instead of mean
    # accumulated_labels = [] Implementation for accumulated labels instead of mean

    endpoint_name = f"ts{int(time.time())}-{model_name}"

    model = m.create(
        task_id=tid,
        user_id=user_id,
        name=model_name,
        shortname="",
        longdesc="",
        desc="",
        upload_datetime=db.sql.func.now(),
        endpoint_name=endpoint_name,
        deployment_status=DeploymentStatusEnum.predictions_upload,
        secret=secrets.token_hex(),
    )
    for name, upload in train_files.items():

        current_upload = json.loads(upload.file.read().decode("utf-8"))
        current_upload = current_upload[list(current_upload.keys())[0]]

        id_count = 0
        for id, label in current_upload.items():
            id_count += 1

        if id_count > 1000:
            Email().send(
                contact=user.email,
                cc_contact="dynabench-site@mlcommons.org",
                template_name="model_train_failed.txt",
                msg_dict={"name": model_name},
                subject=f"Model {model_name} training failed, too many samples per dataset.",
            )
            bottle.abort(400, "Invalid train file")
        request_packet = {
            "id_json": current_upload,
            "bucket_name": "vision-dataperf",
            "key": f"{name}.parquet",
        }
        light_model_endpoint = task.lambda_model

        r = requests.post(light_model_endpoint, json=request_packet)

        predictions = r.json()["predictions"]

        test_y = get_test_dataframe(task.task_code, f"{name}.parquet")

        f1_score = np.round(sklearn.metrics.f1_score(test_y, predictions) * 100, 1)

        did = dm.getByName(name).id
        r_realid = rm.getByTid(tid)[0].rid
        new_score = {
            "dataperf_f1": f1_score,
            "perf": f1_score,
            "perf_std": 0.0,
            "perf_by_tag": [
                {
                    "tag": str(name.lstrip("test-")),
                    "pretty_perf": f"{f1_score} %",
                    "perf": f1_score,
                    "perf_std": 0.0,
                    "perf_dict": {"dataperf_f1": f1_score},
                }
            ],
        }

        new_score_string = json.dumps(new_score)

        sm.create(
            model_id=model[1],
            r_realid=r_realid,
            did=did,
            pretty_perf=f"{f1_score} %",
            perf=f1_score,
            metadata_json=new_score_string,
        )

        # accumulated_predictions += predictions['predictions'] Implementation for accumulated labels instead of mean
        # accumulated_labels += test_y Implementation for accumulated labels instead of mean

    # f1_score = sklearn.metrics.f1_score(accumulated_labels, accumulated_predictions) Implementation for accumulated labels instead of mean
    Email().send(
        contact=user.email,
        cc_contact="dynabench-site@mlcommons.org",
        template_name="model_train_successful.txt",
        msg_dict={"name": model_name, "model_id": model[1]},
        subject=f"Model {model_name} training succeeded.",
    )

    return util.json_encode({"success": "ok", "model_id": model[1]})


def get_test_dataframe(bucket_name, key):
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name="eu-west-3",
    )
    with tempfile.NamedTemporaryFile() as tf:
        s3_client.download_fileobj(Bucket=bucket_name, Key=key, Fileobj=tf)
        dataframe = pd.read_parquet(
            tf, columns=["target_label", "Embedding", "ImageID"]
        )
        test_y = [float(x) for x in dataframe["target_label"].to_list()]
        return test_y


@bottle.post("/models/upload_predictions/<tid:int>/<model_name>")
@_auth.requires_auth
def do_upload_via_predictions(credentials, tid, model_name):
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    tm = TaskModel()
    task = tm.get(tid)
    if not task.has_predictions_upload:
        bottle.abort(
            403,
            """This task does not allow prediction uploads. Submit a model instead.""",
        )

    m = ModelModel()
    if (
        bottle.default_app().config["mode"] == "prod"
        and m.getCountByUidTidAndHrDiff(
            user_id, tid=task.id, hr_diff=task.dynalab_hr_diff
        )
        >= task.dynalab_threshold
    ):
        logger.error("Submission limit reached for user (%s)" % (user_id))
        bottle.abort(429, "Submission limit reached")

    uploads = {}
    dm = DatasetModel()
    datasets = list(dm.getByTid(tid))
    dataset_names = [dataset.name for dataset in datasets]
    for name in dataset_names:
        uploads[name] = bottle.request.files.get(name)

    # Users don't need to upload preds for all datasets.
    uploads = {
        name: uploads[name]
        for name, upload in uploads.items()
        if uploads[name] is not None
    }

    for dataset in datasets:
        if (
            dataset.access_type == AccessTypeEnum.scoring
            and dataset.name not in uploads.keys()
        ):
            bottle.abort(400, "Need to upload predictions for all leaderboard datasets")

    parsed_uploads = {}
    # Ensure correct format
    for name, upload in uploads.items():
        try:
            parsed_upload = [
                util.json_decode(line)
                for line in upload.file.read().decode("utf-8").splitlines()
            ]
        except Exception as ex:
            logger.exception(ex)
            bottle.abort(400, "Could not parse prediction file. Is it a utf-8 jsonl?")

        for io in parsed_upload:
            try:
                assert "uid" in io, "'uid' must be present for every example"
            except Exception as ex:
                bottle.abort(400, str(ex))

            verified, message = task.verify_annotation(
                io, mode=AnnotationVerifierMode.predictions_upload
            )
            if not verified:
                bottle.abort(400, message)
        parsed_uploads[name] = parsed_upload

    endpoint_name = f"ts{int(time.time())}-{model_name}"

    status_dict = {}
    # Create local model db object
    model = m.create(
        task_id=tid,
        user_id=user_id,
        name=model_name,
        shortname="",
        longdesc="",
        desc="",
        upload_datetime=db.sql.func.now(),
        endpoint_name=endpoint_name,
        deployment_status=DeploymentStatusEnum.predictions_upload,
        secret=secrets.token_hex(),
    )
    with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
        for dataset_name, parsed_upload in parsed_uploads.items():
            with tempfile.NamedTemporaryFile(mode="w+", delete=False) as tmp:
                for datum in parsed_upload:
                    datum["id"] = datum["uid"]  # TODO: right now, dynalab models
                    # Expect an input with "uid" but output "id" in their predictions.
                    # Why do we use two seperate names for the same thing? Can we make
                    # this consistent?
                    del datum["uid"]
                    tmp.write(util.json_encode(datum) + "\n")
                tmp.close()
                ret = _eval_dataset(dataset_name, endpoint_name, model, task, tmp.name)
                status_dict.update(ret)

    return util.json_encode({"success": "ok", "model_id": model.id})


def _eval_dataset(dataset_name, endpoint_name, model, task, afile):
    try:
        _upload_prediction_file(
            afile=afile,
            task_code=task.task_code,
            s3_bucket=task.s3_bucket,
            endpoint_name=endpoint_name,
            dataset_name=dataset_name,
        )
        eval_config = {
            "aws_access_key_id": config["eval_aws_access_key_id"],
            "aws_secret_access_key": config["eval_aws_secret_access_key"],
            "aws_region": config["eval_aws_region"],
            "evaluation_sqs_queue": config["evaluation_sqs_queue"],
        }
        if task.is_decen_task:
            ret = send_eval_request(
                eval_server_id=task.eval_server_id,
                model_id=model.id,
                dataset_name=dataset_name,
                config=eval_config,
                logger=logger,
                decen=True,
                decen_queue_name=task.eval_sqs_queue,
                decen_queue_aws_account_id=task.task_aws_account_id,
            )
        else:
            ret = send_eval_request(
                eval_server_id=task.eval_server_id,
                model_id=model.id,
                dataset_name=dataset_name,
                config=eval_config,
                logger=logger,
            )
    except Exception as e:
        logger.exception(e)
        bottle.abort(400, "Could not upload file: %s" % (e))
    return {dataset_name: {"success": ret}}


def _upload_prediction_file(afile, task_code, s3_bucket, endpoint_name, dataset_name):
    client = boto3.client(
        "s3",
        aws_access_key_id=config["eval_aws_access_key_id"],
        aws_secret_access_key=config["eval_aws_secret_access_key"],
        region_name=config["eval_aws_region"],
    )
    path = get_predictions_s3_path(
        endpoint_name=endpoint_name, task_code=task_code, dataset_name=dataset_name
    )
    response = client.upload_file(afile, s3_bucket, path)
    if response:
        logger.info(response)

    return path


@bottle.get("/models/<mid:int>")
def get_model(mid):
    m = ModelModel()
    model = m.getPublishedModel(mid)
    if not model:
        bottle.abort(404, "Not found")
    # Also get this model's scores?
    return util.json_encode(model.to_dict())


@bottle.get("/models/<mid:int>/details")
@_auth.auth_optional
def get_model_detail(credentials, mid):
    m = ModelModel()
    s = ScoreModel()
    dm = DatasetModel()
    try:
        query_result = m.getModelUserByMid(mid)
        model = query_result[0].to_dict()

        # Secure to read unpublished model detail for only owner
        if (
            not query_result[0].is_published
            and query_result[0].uid != credentials["id"]
        ):
            ensure_owner_or_admin(query_result[0].tid, credentials["id"])

        is_current_user = util.is_current_user(query_result[1].id, credentials)

        if not is_current_user and query_result[0].is_anonymous:
            model["username"] = None
            model["uid"] = None
        else:
            model["username"] = query_result[1].username
        # Construct Score information based on model id
        scores = s.getByMid(mid)
        datasets = dm.getByTid(model["tid"])
        did_to_dataset_name = {}
        did_to_dataset_access_type = {}
        did_to_dataset_log_access_type = {}
        did_to_dataset_longdesc = {}
        did_to_dataset_source_url = {}
        model["leaderboard_evaluation_statuses"] = []
        model["non_leaderboard_evaluation_statuses"] = []
        model["hidden_evaluation_statuses"] = []

        for dataset in datasets:
            if model["evaluation_status_json"]:
                evaluation_status = util.json_decode(
                    model["evaluation_status_json"]
                ).get(dataset.name, "pre_evaluation")
                if (
                    evaluation_status != "completed"
                    or dataset.access_type == AccessTypeEnum.hidden
                ):
                    if dataset.access_type == AccessTypeEnum.scoring:
                        evaluation_status_access_type = (
                            "leaderboard_evaluation_statuses"
                        )
                    elif dataset.access_type == AccessTypeEnum.standard:
                        evaluation_status_access_type = (
                            "non_leaderboard_evaluation_statuses"
                        )
                    else:
                        evaluation_status_access_type = "hidden_evaluation_statuses"

                    model[evaluation_status_access_type].append(
                        {
                            "dataset_id": dataset.id,
                            "dataset_name": dataset.name,
                            "dataset_longdesc": dataset.longdesc,
                            "dataset_source_url": dataset.source_url,
                            "dataset_log_access_type": dataset.log_access_type.name,
                            "evaluation_status": evaluation_status,
                        }
                    )

            did_to_dataset_name[dataset.id] = dataset.name
            did_to_dataset_access_type[dataset.id] = dataset.access_type
            did_to_dataset_log_access_type[dataset.id] = dataset.log_access_type
            did_to_dataset_longdesc[dataset.id] = dataset.longdesc
            did_to_dataset_source_url[dataset.id] = dataset.source_url
        fields = ["accuracy", "perf_std", "round_id", "did", "metadata_json"]

        s_dicts = [
            dict(
                zip(fields, d),
                **{
                    "dataset_id": d.did,
                    "dataset_name": did_to_dataset_name.get(d.did, None),
                    "dataset_access_type": did_to_dataset_access_type.get(
                        d.did, AccessTypeEnum.hidden
                    ),
                    "dataset_log_access_type": did_to_dataset_log_access_type.get(
                        d.did, LogAccessTypeEnum.owner
                    ).name,
                    "dataset_longdesc": did_to_dataset_longdesc.get(d.did, None),
                    "dataset_source_url": did_to_dataset_source_url.get(d.did, None),
                },
            )
            for d in scores
        ]
        model["leaderboard_scores"] = list(
            filter(
                lambda s_dict: s_dict["dataset_access_type"] == AccessTypeEnum.scoring,
                s_dicts,
            )
        )
        model["non_leaderboard_scores"] = list(
            filter(
                lambda s_dict: s_dict["dataset_access_type"] == AccessTypeEnum.standard,
                s_dicts,
            )
        )
        model["deployment_status"] = model["deployment_status"].name
        return util.json_encode(model)
    except AssertionError:
        logger.exception("Not authorized to access unpublished model detail")
        bottle.abort(403, "Not authorized to access model detail")
    except Exception as ex:
        logger.exception("Model detail exception : (%s)" % (ex))
        bottle.abort(404, "Not found")


@bottle.put("/models/<mid:int>/update")
@_auth.requires_auth
def update_model(credentials, mid):
    m = ModelModel()
    data = bottle.request.json
    if not util.check_fields(data, ["name", "description"]):
        bottle.abort(400, "Missing data")

    try:
        model = m.getUnpublishedModelByMid(mid)
        if model.uid != credentials["id"]:
            logger.error(
                "Original user ({}) and the modification tried by ({})".format(
                    model.uid, credentials["id"]
                )
            )
            bottle.abort(401, "Operation not authorized")

        m.update(
            model.id,
            name=data["name"],
            longdesc=data["description"],
            params=data["params"],
            languages=data["languages"],
            license=data["license"],
            source_url=data["source_url"],
            model_card=data["model_card"],
            is_anonymous=data["is_anonymous"],
            is_published=False,
        )
        return {"status": "success"}
    except db.orm.exc.NoResultFound:
        bottle.abort(404, "Model Not found")
    except Exception as e:
        logger.exception("Could not update model details: %s" % (e))
        bottle.abort(400, "Could not update model details: %s" % (e))


@bottle.put("/models/<mid:int>/revertstatus")
@_auth.requires_auth
def revert_model_status(credentials, mid):
    m = ModelModel()
    try:
        model = m.getUnpublishedModelByMid(mid)
        if model.uid != credentials["id"]:
            logger.error(
                "Original user ({}) and the modification tried by ({})".format(
                    model.uid, credentials["id"]
                )
            )
            bottle.abort(401, "Operation not authorized")

        m.update(model.id, is_published=not model.is_published)
        model = m.getUnpublishedModelByMid(mid)
        um = UserModel()
        user = um.get(model.uid)
        bm = BadgeModel()
        if model.is_published:
            badge_names = bm.handlePublishModel(user, model)
            return {"status": "success", "badges": "|".join(badge_names)}
        bm.handleUnpublishModel(user, model)
        return {"status": "success"}
    except db.orm.exc.NoResultFound:
        bottle.abort(404, "Model Not found")
    except Exception as e:
        logger.exception("Could not update model details: %s" % (e))
        bottle.abort(400, "Could not update model details: %s" % (e))


@bottle.post("/models/upload/s3")
@_auth.requires_auth
def upload_to_s3(credentials):
    # Authentication
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    # Upload file to S3
    model_name = bottle.request.forms.get("name")
    task_code = bottle.request.forms.get("taskCode")
    if not task_code:
        bottle.abort(404, "No task requested")
    t = TaskModel()
    task = t.getByTaskCode(task_code)
    if not task:
        bottle.abort(404, "Task not found")
    if not task.submitable:
        bottle.abort(403, "Task not available for model submission")

    m = ModelModel()
    if (
        bottle.default_app().config["mode"] == "prod"
        and m.getCountByUidTidAndHrDiff(
            user_id, tid=task.id, hr_diff=task.dynalab_hr_diff
        )
        >= task.dynalab_threshold
    ):
        logger.error("Submission limit reached for user (%s)" % (user_id))
        bottle.abort(429, "Submission limit reached")

    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    bucket_name = task.s3_bucket
    logger.info(f"Using AWS bucket {bucket_name} for task {task_code}")

    endpoint_name = f"ts{int(time.time())}-{model_name}"[:63]
    s3_filename = f"{endpoint_name}.tar.gz"
    s3_path = f"torchserve/models/{task_code}/{s3_filename}"

    logger.info(f"Uploading {model_name} to S3 at {s3_path} for user {user_id}")

    s3_client = session.client("s3")
    tarball = bottle.request.files.get("tarball")
    response = s3_client.upload_fileobj(tarball.file, bucket_name, s3_path)
    if response:
        logger.info(f"Response from the mar file upload to s3 {response}")

    # Update database entry
    model, model_id = m.create(
        task_id=task.id,
        user_id=user_id,
        name=model_name,
        shortname="",
        longdesc="",
        desc="",
        upload_datetime=db.sql.func.now(),
        endpoint_name=endpoint_name,
        deployment_status=DeploymentStatusEnum.uploaded,
        secret=secrets.token_hex(),
    )

    um = UserModel()
    um.incrementModelSubmitCount(user.to_dict()["id"])

    if task.is_decen_task:
        model_dict = m.to_dict(model)
        task_dict = m.to_dict(model.task)
        full_model_info = util.json_encode(model_dict)
        full_task_info = util.json_encode(task_dict)

        # If the decen eaas build queue is provided,
        # send the message to the task owner's build queue
        logger.info(
            f"Send message to sqs with queue name {task.build_sqs_queue}"
            " and AWS account id {task.task_aws_account_id}"
            " - enqueue model {model_name} for deployment"
        )
        sqs = session.resource(
            "sqs",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name="us-west-1",
        )

        queue = sqs.get_queue_by_name(
            QueueName=task.build_sqs_queue,
            QueueOwnerAWSAccountId=task.task_aws_account_id,
        )
        queue.send_message(
            MessageBody=util.json_encode(
                {
                    "model_id": model_id,
                    "s3_uri": f"s3://{bucket_name}/{s3_path}",
                    "decen_eaas": True,
                    "model_info": full_model_info,
                    "task_info": full_task_info,
                }
            )
        )
    else:
        # send SQS message
        logger.info(f"Send message to sqs - enqueue model {model_name} for deployment")
        sqs = session.resource("sqs")
        queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
        queue.send_message(
            MessageBody=util.json_encode(
                {"model_id": model_id, "s3_uri": f"s3://{bucket_name}/{s3_path}"}
            )
        )


@bottle.get("/models/<mid:int>/deploy")
@_auth.requires_auth
def deploy_model_from_s3(credentials, mid):
    # Authentication (only authenticated users can redeploy models for interaction)
    u = UserModel()
    user_id = credentials["id"]
    user = u.get(user_id)
    if not user:
        logger.error("Invalid user detail for id (%s)" % (user_id))
        bottle.abort(404, "User information not found")

    m = ModelModel()
    model = m.getUnpublishedModelByMid(mid)

    model_owner = model.uid == user.id

    if (not model.is_published) and (not model_owner):
        bottle.abort(403, "Model is not published and user is not model owner")

    if model.deployment_status != DeploymentStatusEnum.takendownnonactive:
        bottle.abort(
            403, "Attempting to deploy a model not taken down due to inactivity"
        )

    model_name = model.name

    t = TaskModel()
    task = t.getByTaskId(model.tid)
    task_code = task.task_code
    bucket_name = task.s3_bucket

    endpoint_name = model.endpoint_name
    s3_filename = f"{endpoint_name}.tar.gz"
    s3_path = f"torchserve/models/{task_code}/{s3_filename}"

    # Update database entry
    session = boto3.Session(
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )

    if task.is_decen_task:
        model_dict = m.to_dict(model)
        task_dict = m.to_dict(model.task)
        full_model_info = util.json_encode(model_dict)
        full_task_info = util.json_encode(task_dict)

        # If the decen eaas build queue is provided,
        # send the message to that build queue
        logger.info(f"Send message to sqs - enqueue model {model_name} for deployment")
        sqs = session.resource("sqs")
        queue = sqs.get_queue_by_name(QueueName=task.build_sqs_queue)
        queue.send_message(
            MessageBody=util.json_encode(
                {
                    "model_id": model.id,
                    "s3_uri": f"s3://{bucket_name}/{s3_path}",
                    "decen_eaas": True,
                    "model_info": full_model_info,
                    "task_info": full_task_info,
                    "endpoint_only": True,
                }
            )
        )
    else:
        # send SQS message
        logger.info(
            f"Send message to sqs - enqueue model {model_name} for re-deployment"
        )
        sqs = session.resource("sqs")
        queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
        queue.send_message(
            MessageBody=util.json_encode(
                {
                    "model_id": model.id,
                    "s3_uri": f"s3://{bucket_name}/{s3_path}",
                    "endpoint_only": True,
                }
            )
        )

    return {"status": "success"}


@bottle.post("/models/<mid:int>/update_decen_eaas")
def update_model_decen_eaas(mid):
    m = ModelModel()
    req_data = bottle.request.json

    try:
        model = m.getUnpublishedModelByMid(mid)
        secret = get_secret_for_model_id(mid)

        if not util.verified_data(req_data, secret):
            bottle.abort(401, "Operation not authorized")

        data = req_data["data"]

        # The only property we need to update is the deployment_status
        if set(data.keys()) != {"deployment_status"}:
            bottle.abort(401, "Operation not authorized")

        m.update(
            model.id,
            deployment_status=data["deployment_status"],
        )

        return {"status": "success"}

    except Exception as e:
        logger.exception("Could not update deployment status: %s" % (e))
        bottle.abort(400, "Could not update deployment status: %s" % (e))


@bottle.post("/models/<mid:int>/email_decen_eaas")
def email_decen_eaas(mid):
    m = ModelModel()
    req_data = bottle.request.json

    try:
        model = m.getUnpublishedModelByMid(mid)
        secret = get_secret_for_model_id(mid)

        if not util.verified_data(req_data, secret):
            bottle.abort(401, "Operation not authorized")

        data = req_data["data"]
        if set(data.keys()) != {"secret", "template", "msg", "subject"}:
            bottle.abort(401, "Operation not authorized")

        if model.secret != data["secret"]:
            logger.error(
                "Original secret ({}) and secret provided is ({})".format(
                    model.secret, data["secret"]
                )
            )
            bottle.abort(401, "Operation not authorized")

        _, user = m.getModelUserByMid(mid)
        template = data["template"]
        msg = data["msg"]
        subject = data["subject"]
        Email().send(
            contact=user.email,
            cc_contact="dynabench-site@mlcommons.org",
            template_name=f"{template}.txt",
            msg_dict=msg,
            subject=subject,
        )

        nm = NotificationModel()
        nm.create(user.id, "MODEL_DEPLOYMENT_STATUS", template.upper())

        return {"status": "success"}

    except Exception as e:
        logger.exception("Could not send deployment email: %s" % (e))
        bottle.abort(400, "Could not send deployment email: %s" % (e))


@bottle.post("/models/update_database_with_metrics")
def update_database_with_metrics():
    mm = ModelModel()
    req_data = bottle.request.json

    try:
        data = req_data["data"]

        if set(data.keys()) != {
            "job",
            "eval_metrics_dict",
            "delta_metrics_dict",
            "dataset",
        }:
            bottle.abort(401, "Operation not authorized")

        job = ujson.loads(data["job"])
        json_acceptable_string = job["aws_metrics"].replace("'", '"')
        job["aws_metrics"] = ujson.loads(json_acceptable_string)
        dataset = ujson.loads(data["dataset"])
        eval_metrics_dict = ujson.loads(data["eval_metrics_dict"])
        delta_metrics_dict = ujson.loads(data["delta_metrics_dict"])

        job = dotdict(job)
        dataset["task"] = dotdict(dataset["task"])
        dataset = dotdict(dataset)

        secret = get_secret_for_model_id(job.model_id)
        if not util.verified_data(req_data, secret):
            bottle.abort(401, "Operation not authorized")

        data = req_data["data"]

        model = mm.get(job.model_id)

        dm = DatasetModel()
        d_entry = dm.getByName(job.dataset_name)
        sm = ScoreModel()
        s = sm.getOneByModelIdAndDataset(job.model_id, d_entry.id)

        if job.perturb_prefix:
            assert s is not None
            eval_metadata_json = ujson.loads(eval_metrics_dict["metadata_json"])
            eval_metadata_json = {
                f"{job.perturb_prefix}-{metric}": eval_metadata_json[metric]
                for metric in eval_metadata_json
            }
            metadata_json = update_metadata_json_string(
                s.metadata_json,
                [ujson.dumps(eval_metadata_json), delta_metrics_dict["metadata_json"]],
            )
            score_obj = {**delta_metrics_dict, "metadata_json": metadata_json}
            sm.update(s.id, **score_obj)
        else:
            # This is only hit by a decen task, so we can default to decen=True
            job_metrics_dict = get_job_metrics(job, dataset, decen=True)
            score_obj = {**eval_metrics_dict, **job_metrics_dict}
            if s:
                score_obj["metadata_json"] = update_metadata_json_string(
                    s.metadata_json, [score_obj["metadata_json"]]
                )
                sm.update(s.id, **score_obj)
            else:
                score_obj["model_id"] = job.model_id
                score_obj["did"] = d_entry.id
                score_obj["raw_output_s3_uri"] = dataset.get_output_s3_url

                rm = RoundModel()
                if dataset.round_id != 0:
                    score_obj["r_realid"] = rm.getByTidAndRid(
                        d_entry.tid, d_entry.rid
                    ).id
                else:
                    score_obj["r_realid"] = 1
                sm.create(**score_obj)

        return util.json_encode(mm.to_dict(model))

    except Exception as e:
        logger.exception("Could not update model score metrics: %s" % (e))
        mm.dbs.rollback()
        bottle.abort(400, "Could not update model score metrics: %s" % (e))


@bottle.get("/models/<mid:int>/update_evaluation_status")
def update_evaluation_status_api_call(mid):
    # m = ModelModel()
    req_data = bottle.request.json

    secret = get_secret_for_model_id(mid)
    if not util.verified_data(req_data, secret):
        bottle.abort(401, "Operation not authorized")

    data = req_data["data"]

    # TODO: add secret here so it is not unauthorized
    if set(data.keys()) != {"evaluation_status", "dataset_name"}:
        bottle.abort(401, "Operation not authorized")

    try:
        # model = m.getUnpublishedModelByMid(mid)
        update_evaluation_status(mid, data["dataset_name"], data["evaluation_status"])
        # m.update(
        #     model.id,
        #     evaluation_status=data["evaluation_status"],
        # )

        return {"status": "success"}

    except Exception as e:
        logger.exception("Could not update evaluation status: %s" % (e))
        bottle.abort(400, "Could not update evaluation status: %s" % (e))


@bottle.get("/models/eval_score_entry")
def eval_score_entry():
    dm = DatasetModel()
    sm = ScoreModel()
    req_data = bottle.request.json
    data = ujson.loads(req_data["data"])

    job = dotdict(data)

    secret = get_secret_for_model_id(job.model_id)
    if not util.verified_data(req_data, secret):
        bottle.abort(401, "Operation not authorized - signature not correct")

    if not ({"dataset_name", "model_id"} <= set(job.keys())):
        bottle.abort(401, "Operation not authorized - request keys not correct")

    try:
        d_entry = dm.getByName(job.dataset_name)
        if d_entry:
            score_entry = sm.getOneByModelIdAndDataset(job.model_id, d_entry.id)
            found_score_entry = True if score_entry else False
            resp = {"status": "success", "found_score_entry": found_score_entry}
            return util.json_encode(resp)
        else:
            bottle.abort(404, "Dataset not found!")

    except Exception as e:
        logger.exception("Could not retrieve eval score entry: %s" % (e))
        bottle.abort(400, "Could not retrieve eval score entry %s" % (e))


def get_secret_for_model_id(mid):
    m = ModelModel()
    model = m.getUnpublishedModelByMid(mid)
    tid = model.task.id
    tm = TaskModel()
    tups = (
        tm.dbs.query(TaskUserPermission)
        .filter(
            db.and_(TaskUserPermission.type == "owner", TaskUserPermission.tid == tid)
        )
        .all()
    )
    assert len(tups) == 1
    um = UserModel()
    user = um.get(tups[0].uid)
    return user.api_token


@bottle.get("/models/<mid:int>/get_model_info")
def get_model_info(mid):
    m = ModelModel()
    req_data = bottle.request.json

    secret = get_secret_for_model_id(mid)
    if not util.verified_data(req_data, secret):
        bottle.abort(401, "Operation not authorized")

    try:
        model = m.getUnpublishedModelByMid(mid)
        endpoint_name = model.endpoint_name
        deployment_status = model.deployment_status

        resp = {"endpoint_name": endpoint_name, "deployment_status": deployment_status}
        return util.json_encode(resp)

    except Exception as e:
        logger.exception("Could not retrieve model details: %s" % (e))
        bottle.abort(400, "Could not retrieve model details: %s" % (e))


@bottle.get("/models/<mid:int>/download")
def download_model(mid):
    m = ModelModel()
    req_data = bottle.request.json

    try:
        model = m.getUnpublishedModelByMid(mid)
        secret = get_secret_for_model_id(mid)

        if not util.verified_data(req_data, secret):
            bottle.abort(401, "Operation not authorized")

        data = req_data["data"]

        if data["secret"] != model.secret:
            bottle.abort(401, "Operation not authorized")

        endpoint_name = model.endpoint_name

        client = boto3.client(
            "s3",
            aws_access_key_id=config["aws_access_key_id"],
            aws_secret_access_key=config["aws_secret_access_key"],
            region_name=config["aws_region"],
        )
        s3_filename = f"{endpoint_name}.tar.gz"
        s3_path = f"torchserve/models/{model.task.task_code}/{s3_filename}"
        s3_bucket = model.task.s3_bucket
        final_filepath = f"/tmp/{s3_filename}"

        _ = client.download_file(s3_bucket, s3_path, final_filepath)

        f = open(final_filepath, "rb")
        response.headers["Content-Type"] = "application/octet-stream"
        response.headers[
            "Content-Disposition"
        ] = f"attachment; filename={final_filepath}"
        return f

    except Exception as e:
        logger.exception("Could not download model: %s" % (e))
        bottle.abort(400, "Could not download model: %s" % (e))
