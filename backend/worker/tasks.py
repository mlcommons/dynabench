# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging
import time

import celery
from worker.config import app

from app.domain.services.base.jobs import JobService
from app.domain.services.utils.multi_generator import ImageGenerator


logging.basicConfig(
    filename="adversarial_nibbler.log",
    level=logging.CRITICAL,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


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
def generate_images(prompt, num_images, models, endpoint, user_id):
    job_service = JobService()
    images = celery.group(
        *[
            generate_nibbler_images_celery.s(
                prompt, num_images, models, endpoint, user_id
            )
            for _ in range(6)
        ]
    )

    res = images.apply_async()
    print(res)
    all_responses = res.get(disable_sync_subtasks=False)
    job_service.remove_registry({"prompt": prompt, "user_id": user_id})

    for response in all_responses:
        info_to_log = {
            "message": response["message"],
            "time": response["time"],
            "model": response["generator"],
            "task_id": response["queue_task_id"],
            "user_id": response["user_id"],
        }
        logging.critical(info_to_log)
