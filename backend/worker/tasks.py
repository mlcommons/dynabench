# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import datetime
import json
import logging
import time

import celery
from celery.signals import after_setup_logger
from worker.config import app

from app.domain.services.base.jobs import JobService
from app.domain.services.utils.multi_generator import ImageGenerator


logger = logging.getLogger(__name__)


@after_setup_logger.connect
def setup_loggers(logger, *args, **kwargs):
    formatter = logging.Formatter("%(message)s")
    fh = logging.FileHandler("worker/adversarial_nibbler.log")
    fh.setFormatter(formatter)
    fh.setLevel(logging.CRITICAL)
    logger.addHandler(fh)


@app.task(name="add", queue="test")
def add(x, y):
    return x + y


@app.task(name="generate_nibbler_images_celery", queue="test", max_retries=0)
def generate_nibbler_images_celery(
    prompt: str, num_images: int, model: dict, endpoint: dict, user_id: int
):
    start = time.perf_counter()
    image = ImageGenerator().generate_one_image(
        prompt, num_images, model, endpoint, user_id
    )
    image["queue_task_id"] = app.current_task.request.id
    image["time"] = time.perf_counter() - start
    image["user_id"] = user_id
    return image


@app.task(name="generate_images", queue="nibbler", max_retries=0)
def generate_images(
    prompt, num_images, models, endpoint, user_id, num_of_current_images
):
    try:
        job_service = JobService()
        images = celery.group(
            *[
                generate_nibbler_images_celery.s(
                    prompt, num_images, models, endpoint, user_id
                )
                for _ in range(10)
            ]
        )

        res = images.apply_async()
        print(res)
        all_responses = res.get(disable_sync_subtasks=False)
        if (len(all_responses) + num_of_current_images) >= 5:
            job_service.remove_registry({"prompt": prompt, "user_id": user_id})

        for response in all_responses:
            info_to_log = {
                "message": response["message"],
                "generation_time": response["time"],
                "model": response["generator"],
                "task_id": response["queue_task_id"],
                "user_id": response["user_id"],
                "prompt": prompt,
                "timestamp": str(datetime.datetime.now()),
            }

            logger.critical(json.dumps(info_to_log))
    except Exception as e:
        print(e)
        job_service.remove_registry({"prompt": prompt, "user_id": user_id})
