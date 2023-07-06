# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import functools
import logging
import pickle
from typing import Optional

import ujson
from enum import Enum

from utils.evaluator import Job
from utils.helpers import (
    api_get_next_job_score_entry,
    api_model_eval_update,
    api_update_database_with_metrics,
)


logger = logging.getLogger("computer")


class ComputeStatusEnum(Enum):
    successful = "successful"
    failed = "failed"
    postponed = "postponed"


class MetricsComputer:
    def __init__(self, config, datasets):
        self._status_dump = config["computer_status_dump"]
        self._waiting, self._failed = self._load_status()
        self._computing = []
        self.datasets = datasets

    def _load_status(self):
        try:
            status = pickle.load(open(self._status_dump, "rb"))
            logger.info(f"Load existing status from {self._status_dump}.")
            # When reloading, we consider that "computing" job have been interrupted
            # and we need to recompute them
            computing = status["computing"] + status.get("waiting", [])
            return computing, status["failed"]
        except FileNotFoundError:
            logger.info("No existing computer status found. Re-initializing...")
            return [], []
        except Exception as ex:
            logger.exception(
                f"Exception in loading computer status: {ex}. Re-initializing..."
            )
            return [], []

    def update_database_with_metrics(
        self, job, eval_metrics_dict: dict, delta_metrics_dict: dict
    ) -> None:
        dataset = self.datasets[job.dataset_name]
        data = {
            "job": ujson.dumps(job.to_dict(), default=str),
            "eval_metrics_dict": ujson.dumps(eval_metrics_dict, default=str),
            "delta_metrics_dict": ujson.dumps(delta_metrics_dict, default=str),
            "dataset": ujson.dumps(dataset.to_dict(job.endpoint_name), default=str),
        }
        model_json = api_update_database_with_metrics(data)

        if job in self._computing:
            self._computing.remove(job)
        self.dump()

        # Don't change model's evaluation status if it has failed.
        # if ("evaluation_status" not in model_json) or (
        #     model_json["evaluation_status"] != "failed"
        # ):
        #     model_done_evaluating = True
        #     for other_job in self._waiting + self._computing:
        #         if other_job.model_id == job.model_id:
        #             model_done_evaluating = False
        #     if model_done_evaluating:
        api_model_eval_update(model_json["id"], job.dataset_name, "completed")

        logger.info(f"Successfully evaluated {job.job_name}")

    def update_status(self, jobs: list):
        if jobs:
            self._waiting.extend(jobs)
            for job in jobs:
                api_model_eval_update(job.model_id, job.dataset_name, "evaluating")
            self.dump()

    def log_job_error(self, job, ex):
        logger.exception(ex)
        if job in self._computing:
            self._computing.remove(job)
        self._failed.append(job)
        api_model_eval_update(job.model_id, job.dataset_name, "failed")

    def compute_one_blocking(self, job) -> None:
        try:

            logger.info(f"Evaluating {job.job_name}")
            self._computing.append(job)
            api_model_eval_update(job.model_id, job.dataset_name, "evaluating")
            dataset = self.datasets[job.dataset_name]
            eval_metrics, delta_metrics = dataset.compute_job_metrics(job)
            self.update_database_with_metrics(job, eval_metrics, delta_metrics)

        except Exception as e:
            self.log_job_error(job, e)
            return

    def compute_one_async(self, process_pool, job):
        try:
            dataset = self.datasets[job.dataset_name]
            process_pool.apply_async(
                dataset.compute_job_metrics,
                args=(job,),
                callback=lambda res: self.update_database_with_metrics(job, *res),
                error_callback=functools.partial(self.log_job_error, job),
            )
        except Exception as e:
            self._failed.append(job)
            api_model_eval_update(job.model_id, job.dataset_name, "failed")
            logger.error(
                f"Couldn't start the final evaluation for {job}."
                " Probably due to a pickling error"
            )
            logger.exception(e)
            self.dump()
            return

        self._computing.append(job)
        api_model_eval_update(job.model_id, job.dataset_name, "evaluating")
        self.dump()

    def find_next_ready_job(self) -> Optional[Job]:
        """Finds the next job ready to start evaluating.

        Returns None if none of the job are ready.

        Note: the job returned doesn't belong anymore to any of the internal lists
        and need to be added back (eg by passing it to `compute_one_async`)
        """
        n = len(self._waiting)
        traversed = 0
        while self._waiting and traversed < n:
            job = self._waiting.pop(0)
            traversed += 1

            score_entry = api_get_next_job_score_entry(job.to_dict())

            if job.perturb_prefix and (
                "found_score_entry" not in score_entry
                or not score_entry["found_score_entry"]
            ):
                logger.info(
                    f"Haven't received original evaluation for {job.job_name}. "
                    f"Postpone computation."
                )
                self._waiting.append(job)
                api_model_eval_update(job.model_id, job.dataset_name, "evaluating")
            else:
                self.dump()
                return job
        return None

    def get_jobs(self, status="Failed"):
        if status == "Failed":
            return self._failed
        elif status == "Computing":
            return self._computing
        elif status == "Waiting":
            return self._waiting
        else:
            raise NotImplementedError(f"Scheduler does not maintain {status} queue")

    def get_status(self) -> dict:
        return {
            "computing": self._computing,
            "waiting": self._waiting,
            "failed": self._failed,
        }

    def dump(self):
        # dump status to pre-specified path
        status = self.get_status()
        logger.info(
            f"Computer status: \n"
            + f"waiting jobs: {[job.job_name for job in status['waiting']]}\n"
            + f"computing jobs: {[job.job_name for job in status['computing']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Computer dumped status to {self._status_dump}")
