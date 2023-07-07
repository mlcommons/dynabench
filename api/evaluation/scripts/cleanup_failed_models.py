# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
usage python scripts/cleanup_failed_models.py
please make sure evaluation server is off when running this script
in order to release failed jobs
"""

import logging
import pickle
import sys


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("request_evaluation")

sys.path.append(".")  # noqa
from eval_config import eval_config  # noqa isort:skip
from utils.helpers import send_takedown_model_request  # noqa isort:skip

sys.path.append("../api")  # noqa
from common.config import config  # noqa isort:skip
from models.model import DeploymentStatusEnum, ModelModel  # noqa isort:skip


def get_failed_endpoints(eval_config):
    endpoints, failed_jobs = {}, set()
    try:
        s = pickle.load(open(eval_config["scheduler_status_dump"], "rb"))
        for j in s["failed"]:
            if j.status and j.status.get("FailureReason", "").startswith(
                "AlgorithmError"
            ):
                endpoints[j.model_id] = j.endpoint_name
                failed_jobs.add(j.job_name)
    except FileNotFoundError:
        s = None
    mm = ModelModel()
    models = mm.getByDeploymentStatus(deployment_status=DeploymentStatusEnum.failed)
    for m in models:
        if m.id not in endpoints:
            endpoints[m.id] = m.endpoint_name
            if s:
                for j in s["failed"]:
                    if j.model_id == m.id:
                        failed_jobs.add(j.job_name)
    return endpoints, failed_jobs


def update_db_and_request_cleanup(endpoints):
    mm = ModelModel()
    for mid in endpoints:
        model = mm.getUnpublishedModelByMid(mid)
        if model.endpoint_name == endpoints[mid]:
            mm.update(mid, deployment_status=DeploymentStatusEnum.failed)
            send_takedown_model_request(mid, config, logger=logger)


def release_failed_jobs(eval_config, failed_job_names):
    try:
        s = pickle.load(open(eval_config["scheduler_status_dump"], "rb"))
        s["failed"] = [j for j in s["failed"] if j.job_name not in failed_job_names]
        pickle.dump(s, open(eval_config["scheduler_status_dump"], "wb"))
        print(f"Released failed jobs {failed_job_names}")
    except FileNotFoundError:
        pass


if __name__ == "__main__":
    endpoints, failed_job_names = get_failed_endpoints(eval_config)
    update_db_and_request_cleanup(endpoints)
    release_failed_jobs(eval_config, failed_job_names)
