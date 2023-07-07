# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import logging
import multiprocessing
import os
import sys
import time
import traceback

import boto3
import requests
import uuid
from datasets.common import BaseDataset
from datasets.mt import flores

from eval_config import eval_config
from utils.helpers import api_download_dataset, dotdict, load_models_ids_for_task_owners
from utils.logging import init_logger
from utils.requester_decen import Requester


sys.path.append("../api")  # noqa isort:skip
import common.helpers as util  # noqa isort:skip

# TODO: [BE] strong typing on all interfce methods
sleep_interval = 5
scheduler_update_interval = 300
logger = logging.getLogger("evaluation")

DYNABENCH_API = eval_config["DYNABENCH_API"]
decen_eaas_secret = eval_config["decen_eaas_secret"]


def load_datasets_for_task_owner():
    task_code = eval_config["task_code"]
    data = {"task_code": task_code}

    r = requests.get(
        f"{DYNABENCH_API}/tasks/listdatasets",
        data=json.dumps(util.wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=False,
    )

    if r.status_code != 200:
        json_resp = r.json()
        status_code = json_resp["status_code"]
        error = json_resp["error"]
        print(f"Recieved {status_code} from dynabench: {error}")
        return None, False

    jsonResponse = r.json()
    datasetJsonResponse = jsonResponse["datasets_metadata"]
    taskJsonResponse = jsonResponse["task_metadata"]

    datasets_dict = {}

    json_task = util.json_decode(taskJsonResponse)

    # Change s3 bucket of the task to the one specified in the eval config
    json_task["s3_bucket"] = eval_config["dataset_s3_bucket"]
    task = dotdict(json_task)

    for dataset_json in datasetJsonResponse:
        dataset = util.json_decode(dataset_json)

        rid, _ = dataset.pop("rid"), dataset.pop("tid")
        del dataset["id"], dataset["desc"]

        # Not all dataset have the same task. It's important
        # to have correct class so that the eval_server call
        # the correct `compute_job_metrics`
        if dataset["name"] in flores.FLORES_DATASETS:
            d = flores.FLORES_DATASETS[dataset["name"]]()
            d.task = task
            datasets_dict[dataset["name"]] = d
        if dataset["name"] not in datasets_dict:
            datasets_dict[dataset["name"]] = BaseDataset(
                round_id=rid,
                task_code=task_code,
                db_connection_avail=False,
                db_connection_not_avail_task_info=task,
                **dataset,
            )

    # This means there are no datasets for the task, as
    # opposed to the request not going through
    status_code_check_fail = r.status_code != 200
    len_dataset_check_fail = len(datasetJsonResponse) == 0

    return datasets_dict, status_code_check_fail, len_dataset_check_fail


def main():
    init_logger("evaluation")
    server_id = eval_config["eval_server_id"]
    logger.info(f"Start evaluation server '{server_id}'")

    (
        dataset_dict,
        status_code_check_fail,
        len_dataset_check_fail,
    ) = load_datasets_for_task_owner()
    sqs_region = eval_config["aws_region"]
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=eval_config["aws_access_key_id"],
        aws_secret_access_key=eval_config["aws_secret_access_key"],
        region_name=sqs_region,
    )
    queue = sqs.get_queue_by_name(QueueName=eval_config["evaluation_sqs_queue"])

    if status_code_check_fail:
        return

    active_model_ids = load_models_ids_for_task_owners()

    if len_dataset_check_fail:
        print("No datasets uploaded for this task yet..please upload dataset")

    requester = Requester(eval_config, dataset_dict, active_model_ids)

    cpus = eval_config.get("compute_metric_processes", 2)
    with multiprocessing.pool.Pool(cpus) as _:
        timer = scheduler_update_interval
        while True:
            try:
                # On each iteration, submit all requested jobs
                for message in queue.receive_messages():

                    msg = json.loads(message.body)

                    logger.info(
                        f"Evaluation server {server_id} received SQS message {msg}"
                    )

                    # load the necessary dictionary dict
                    if msg.get("reload_datasets", False):
                        status_code_check_fail = False
                        len_dataset_check_fail = False
                        (
                            dataset_dict,
                            status_code_check_fail,
                            len_dataset_check_fail,
                        ) = load_datasets_for_task_owner()
                        active_model_ids = load_models_ids_for_task_owners()

                        if status_code_check_fail:
                            print("Failed to reload datasets")
                            return

                        if len_dataset_check_fail:
                            print(
                                "No datasets uploaded for this task yet.."
                                "please upload dataset"
                            )

                        requester = Requester(
                            eval_config, dataset_dict, active_model_ids
                        )

                    # load the necessary active model ids dict
                    if msg.get("reload_models", False):
                        active_model_ids = load_models_ids_for_task_owners()
                        requester = Requester(
                            eval_config, dataset_dict, active_model_ids
                        )

                    download_dataset_message = msg.get("download_dataset", False)
                    if download_dataset_message:
                        dataset_id = msg.get("dataset_id", None)
                        delta_metric_types = msg.get("delta_metric_types", None)
                        s3_paths = msg.get("s3_paths", None)
                        dataset_name = msg.get("dataset_name", None)
                        bucket_name = eval_config["dataset_s3_bucket"]

                        if (
                            (dataset_id is None)
                            or (delta_metric_types is None)
                            or (s3_paths is None)
                        ):
                            logger.info(
                                "Invalid argument for executing download_dataset "
                                "message! Need to specify s3_paths, "
                                "delta_metric_types, dataset_id when sending download"
                            )
                        else:
                            list_perturb_to_download = [None] + delta_metric_types
                            if len(list_perturb_to_download) != len(s3_paths):
                                logger.info(
                                    "Wrong sized lists when downloading "
                                    "datasets...aborting download"
                                )

                            n = len(list_perturb_to_download)
                            for i in range(n):
                                perturb_prefix = list_perturb_to_download[i]
                                s3_path = s3_paths[i]

                                dataset_download_filename = api_download_dataset(
                                    dataset_id, perturb_prefix
                                )

                                session = boto3.Session(
                                    aws_access_key_id=eval_config["aws_access_key_id"],
                                    aws_secret_access_key=eval_config[
                                        "aws_secret_access_key"
                                    ],
                                    region_name=eval_config["aws_region"],
                                )

                                s3_client = session.client("s3")
                                response = s3_client.upload_fileobj(
                                    open(dataset_download_filename, "rb"),
                                    bucket_name,
                                    s3_path,
                                )

                                if response:
                                    logger.info(response)

                                os.remove(dataset_download_filename)

                            # Once all datasets are downloaded
                            # Re-add message to queue to evaluate
                            # all models
                            msg = {
                                "reload_datasets": True,
                                "model_id": "*",
                                "dataset_name": dataset_name,
                                "eval_server_id": server_id,
                            }
                            queue.send_message(MessageBody=json.dumps(msg))

                    if not download_dataset_message:
                        requester.request(msg)

                    queue.delete_messages(
                        Entries=[
                            {
                                "Id": str(uuid.uuid4()),
                                "ReceiptHandle": message.receipt_handle,
                            }
                        ]
                    )
                requester.submit()

                # Update job status on scheduler interval
                if timer >= scheduler_update_interval:
                    requester.update_status()
                    timer = 0
                try:
                    # Evaluate one job
                    job = requester.computer.find_next_ready_job()
                    if job:
                        # logger.info(pool)
                        # requester.computer.compute_one_async(pool, job)
                        requester.computer.compute_one_blocking(job)
                except Exception as e:
                    print("job I failed on was")
                    print(job.to_dict())

                    print("dataset dict was ")
                    print(dataset_dict)

                    print("active model ids was")
                    print(active_model_ids)
                    print(e)

            except Exception as e:
                logger.info(f"Got exception while processing request: {message.body}")
                print(e)
                print(traceback.format_exc())

            time.sleep(sleep_interval)
            timer += sleep_interval


if __name__ == "__main__":
    main()
