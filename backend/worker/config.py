# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

from celery import Celery


broker_url = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379")
app = Celery(
    "tasks",
    include=["worker.tasks"],
    result_expires=10,
    broker=broker_url,
    backend=broker_url,
)

app.conf.update(
    task_serializer="msgpack",
    accept_content=["json", "msgpack"],  # Ignore other content
    result_serializer="msgpack",
    timezone="UTC",
    enable_utc=True,
    include=["worker.tasks"],
    task_routes={
        "worker.tasks.add": {"queue": "test"},
        "worker.tasks.generate_nibbler_images_celery": {"queue": "test"},
        "worker.tasks.generate_images": {"queue": "nibbler"},
    },
)
