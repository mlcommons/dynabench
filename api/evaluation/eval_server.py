# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import logging
import multiprocessing
import time

import boto3
import uuid
from datasets import load_datasets

from eval_config import eval_config
from utils.logging import init_logger
from utils.requester import Requester


# TODO: [BE] strong typing on all interfce methods

sleep_interval = 5
scheduler_update_interval = 300
logger = logging.getLogger("evaluation")


def main():
    init_logger("evaluation")
    server_id = eval_config["eval_server_id"]
    logger.info(f"Start evaluation server '{server_id}'")

    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=eval_config["aws_access_key_id"],
        aws_secret_access_key=eval_config["aws_secret_access_key"],
        region_name=eval_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=eval_config["evaluation_sqs_queue"])
    dataset_dict = load_datasets()
    while not dataset_dict:
        logger.info("Haven't got dataset_dict. Sleep.")
        time.sleep(sleep_interval)
    requester = Requester(eval_config, dataset_dict)

    cpus = eval_config.get("compute_metric_processes", 2)
    with multiprocessing.pool.Pool(cpus) as pool:
        timer = scheduler_update_interval
        while True:
            # On each iteration, submit all requested jobs
            for message in queue.receive_messages():
                msg = json.loads(message.body)
                if msg.get("eval_server_id", "default") != server_id:
                    logger.info(f"Evaluation server {server_id} ignored message {msg}")
                    continue

                logger.info(f"Evaluation server {server_id} received SQS message {msg}")

                if msg.get("reload_datasets", False):
                    dataset_dict = load_datasets()
                    while not dataset_dict:
                        logger.info("Haven't got dataset_dict. Sleep.")
                        time.sleep(sleep_interval)
                    requester = Requester(eval_config, dataset_dict)

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
            # Evaluate one job
            job = requester.computer.find_next_ready_job()
            if job:
                requester.computer.compute_one_async(pool, job)
            time.sleep(sleep_interval)
            timer += sleep_interval


if __name__ == "__main__":
    main()
