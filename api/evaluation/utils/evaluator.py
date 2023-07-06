# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging
import math
import pickle
import time
from datetime import datetime

import boto3
import botocore
from dateutil.tz import tzlocal

from models.model import DeploymentStatusEnum, ModelModel
from utils.helpers import (
    generate_job_name,
    process_aws_metrics,
    round_end_dt,
    round_start_dt,
    update_evaluation_status,
)


logger = logging.getLogger("evaluator")


class Job:
    TEMP_JOB_NAME_SUFFIX = "???"

    def __init__(self, model_id, dataset_name, perturb_prefix=None):
        self.model_id = model_id
        m = ModelModel()
        model = m.getUnpublishedModelByMid(model_id)
        self.endpoint_name = model.endpoint_name
        self.dataset_name = dataset_name
        self.perturb_prefix = perturb_prefix
        # Generate a temporary name, the scheduler will put a proper timestamp
        # at the time of submission
        self.job_name = generate_job_name(
            self.endpoint_name,
            self.perturb_prefix,
            self.dataset_name,
            timestamp=self.TEMP_JOB_NAME_SUFFIX,
        )

        self.status = None  # will update once job is successfully submitted
        self.aws_metrics = {}  # will update once job is completed

    def __repr__(self) -> str:
        return f"<Job: {self.job_name}>"


class JobScheduler:
    def __init__(self, config, datasets):
        self.config = config
        self._status_dump = config["scheduler_status_dump"]
        (
            self._submitted,
            self._queued,
            self._completed,
            self._failed,
        ) = self._load_status()
        self.max_submission = config["max_submission"]
        self.datasets = datasets
        self._clients = {"sagemaker": {}, "logs": {}, "cloudwatch": {}}
        self.cloudwatch_namespace = "/aws/sagemaker/TransformJobs"
        self._last_submission = 0

    def client(self, kind: str, dataset_name: str):
        """Returns the corresponding client for a dataset.

        There is one client per region and not all datasets are in the same region.
        """
        dataset = self.datasets[dataset_name]
        assert kind in self._clients
        task = dataset.task

        if task not in self._clients[kind]:
            region = task.aws_region
            self._clients[kind][task] = boto3.client(
                kind,
                aws_access_key_id=self.config["aws_access_key_id"],
                aws_secret_access_key=self.config["aws_secret_access_key"],
                region_name=region,
            )

        return self._clients[kind][task]

    def _load_status(self):
        try:
            status = pickle.load(open(self._status_dump, "rb"))
            logger.info(f"Load existing status from {self._status_dump}.")
            return (
                status.get("submitted", []),
                status.get("queued", []),
                status.get("completed", []),
                status.get("failed", []),
            )
        except FileNotFoundError:
            logger.info("No existing scheduler status found. Re-initializing...")
            return [], [], [], []

    def enqueue(self, model_id, dataset_name, perturb_prefix=None, dump=True):
        # create batch transform job and
        # update the inprogress queue
        job = Job(model_id, dataset_name, perturb_prefix)
        if self.is_predictions_upload(model_id):
            self._completed.append(job)
            # Although the job is completed here, scores still need to be calculated,
            # so the status is still "evaluating"
            logger.info(
                f"Queued {job.job_name} for completion instead of "
                + f"submission, as this is just a predictions upload and not a "
                + f"real model"
            )
        else:
            self._queued.append(job)
            logger.info(f"Queued {job.job_name} for submission")
        update_evaluation_status(job.model_id, job.dataset_name, "evaluating")

        if dump:
            self.dump()

    def is_predictions_upload(self, model_id):
        mm = ModelModel()
        model = mm.get(model_id)
        return model.deployment_status == DeploymentStatusEnum.predictions_upload

    def _set_jobname_with_unique_timestamp(self, job: Job) -> None:
        """Make sure that we aren't submitting jobs too fast,
        and that timestamps uniquely identify jobs.
        """
        if not job.job_name.endswith(Job.TEMP_JOB_NAME_SUFFIX):
            # The job already received a unique timestamp
            return
        if time.time() - self._last_submission < 1:
            time.sleep(1.1)
        submission_timestamp = int(time.time())
        job.job_name = generate_job_name(
            job.endpoint_name,
            job.perturb_prefix,
            job.dataset_name,
            submission_timestamp,
        )
        self._last_submission = submission_timestamp

    def submit(self):
        def _create_batch_transform(job):
            """
            Return True if a job is successfully submitted
            """
            sagemaker = self.client("sagemaker", job.dataset_name)
            try:
                self.datasets[job.dataset_name].run_batch_transform(
                    sagemaker, job.endpoint_name, job.job_name, job.perturb_prefix
                )
            except sagemaker.exceptions.ResourceLimitExceeded as ex:
                logger.warning(
                    f"Requeueing job {job.job_name} due to AWS limit exceeds: {ex}"
                )
                self._queued.append(job)
                update_evaluation_status(job.model_id, job.dataset_name, "evaluating")
                return False
            except sagemaker.exceptions.ResourceInUse as ex:
                logger.exception(
                    f"Job {job.job_name} already submitted. Re-computing the metrics."
                )
                logger.debug(f"{ex}")
                self._submitted.append(job)
                update_evaluation_status(job.model_id, job.dataset_name, "evaluating")
                return True
            except botocore.exceptions.ClientError as ex:
                if ex.response["Error"]["Code"] == "ThrottlingException":
                    logger.exception(
                        f"Sleep for 2s and requeuing job {job.job_name} "
                        f"due to AWS throttling"
                    )
                    logger.debug(f"{ex}")
                    self._queued.append(job)
                    update_evaluation_status(
                        job.model_id, job.dataset_name, "evaluating"
                    )
                    time.sleep(2)
                else:
                    logger.exception(
                        f"Exception in submitting job {job.job_name}: {ex}"
                    )
                    self._failed.append(job)
                    update_evaluation_status(job.model_id, job.dataset_name, "failed")
                return False
            except Exception as ex:
                logger.exception(f"Exception in submitting job {job.job_name}: {ex}")
                self._failed.append(job)
                update_evaluation_status(job.model_id, job.dataset_name, "failed")
                return False
            else:
                logger.info(f"Submitted {job.job_name} for batch transform.")
                self._submitted.append(job)
                update_evaluation_status(job.model_id, job.dataset_name, "evaluating")
                return True

        # Submit remaining jobs
        N_to_submit = min(self.max_submission - len(self._submitted), len(self._queued))
        if N_to_submit > 0:
            try:
                for _ in range(N_to_submit):
                    job = self._queued.pop(0)
                    self._set_jobname_with_unique_timestamp(job)
                    _create_batch_transform(job)
            finally:
                self.dump()

    def stop(self, job):
        try:
            sagemaker = self.client("sagemaker", job.dataset_name)
            sagemaker.stop_transform_job(TransformJobName=job.job_name)
        except Exception as ex:
            logger.exception(f"Error in stopping {job.job_name}: {ex}")
        else:
            logger.info(f"Stopped batch transform job {job.job_name}")

    def update_status(self):
        def _update_job_status(job):
            try:
                sagemaker = self.client("sagemaker", job.dataset_name)
                job.status = sagemaker.describe_transform_job(
                    TransformJobName=job.job_name
                )
            except Exception as ex:
                logger.exception(ex)
                logger.info(f"Postponing fetching status for {job.job_name}")
                return False
            else:
                return True

        logger.info("Updating status")
        done_job_names = set()
        for job in self._submitted:
            if _update_job_status(job):
                if job.status["TransformJobStatus"] != "InProgress":
                    if job.status["TransformJobStatus"] != "Completed":
                        self._failed.append(job)
                        update_evaluation_status(
                            job.model_id, job.dataset_name, "failed"
                        )
                        done_job_names.add(job.job_name)
                    elif job.perturb_prefix or round_end_dt(
                        job.status["TransformEndTime"]
                    ) < datetime.now(tzlocal()):
                        self._completed.append(job)
                        # Although this particular job is completed here, scores
                        # still need to be calculated, so the status is now
                        # "evaluating"
                        update_evaluation_status(
                            job.model_id, job.dataset_name, "evaluating"
                        )
                        done_job_names.add(job.job_name)
        self._submitted = [
            job for job in self._submitted if job.job_name not in done_job_names
        ]
        logger.info("Fetch metrics")
        # fetch AWS metrics for completed jobs
        for job in self._completed:
            if not job.aws_metrics and not job.perturb_prefix:
                cloudwatch = self.client("cloudwatch", job.dataset_name)
                cloudwatchlog = self.client("logs", job.dataset_name)
                logStreams = cloudwatchlog.describe_log_streams(
                    logGroupName=self.cloudwatch_namespace,
                    logStreamNamePrefix=f"{job.job_name}/",
                )["logStreams"]
                if logStreams:
                    hosts = set()
                    for logStream in logStreams:
                        if logStream["logStreamName"].count("/") == 1:
                            hosts.add(
                                "-".join(logStream["logStreamName"].split("-")[:-1])
                            )  # each host is a machine instance
                    for host in hosts:

                        metrics = cloudwatch.list_metrics(
                            Namespace=self.cloudwatch_namespace,
                            Dimensions=[{"Name": "Host", "Value": host}],
                        )
                        if metrics["Metrics"]:
                            round_start = round_start_dt(
                                job.status["TransformStartTime"]
                            )
                            round_end = round_end_dt(job.status["TransformEndTime"])
                            # Make sure to not ask more than 1440 points (API limit)
                            period = (round_end - round_start).total_seconds() / 1440
                            # Period must be a multiple of 60
                            period = int(math.ceil(period / 60) * 60)
                            period = max(60, period)
                            for m in metrics["Metrics"]:
                                r = cloudwatch.get_metric_statistics(
                                    Namespace=m["Namespace"],
                                    MetricName=m["MetricName"],
                                    Dimensions=m["Dimensions"],
                                    StartTime=round_start,
                                    EndTime=round_end,
                                    Period=period,
                                    Statistics=["Average"],
                                )
                                if r["Datapoints"]:
                                    if m["MetricName"] not in job.aws_metrics:
                                        job.aws_metrics[m["MetricName"]] = []
                                    job.aws_metrics[m["MetricName"]].append(
                                        process_aws_metrics(r["Datapoints"])
                                    )
        # dump the updated status
        self.dump()

    def pop_jobs(self, status, N=1):
        def _pop_jobs(queue, N, status):
            results = []
            L = len(queue)
            if L == 0:
                logger.info(f"No {status} jobs yet. ")
            elif N == -1:
                results = queue
                queue = []
                logger.info(f"Popping all jobs out from {status} queue. ")
            else:
                if N > L:
                    logger.info(
                        f"Requested {N} but there are only {L} "
                        f"jobs to pop from {status} queue. "
                    )
                    N = L
                results = queue[:N]
                queue = queue[N:]
                logger.info(f"Poped {N} out of {L} jobs from {status} queue. ")
            return results, queue

        if status == "Completed":
            jobs, self._completed = _pop_jobs(self._completed, N, status)
        elif status == "Failed":
            jobs, self._failed = _pop_jobs(self._failed, N, status)
        else:
            raise NotImplementedError(f"Job status {status} not supported to pop")
        if jobs:
            self.dump()
        return jobs

    def get_jobs(self, status="Failed"):
        if status == "Failed":
            return self._failed
        elif status == "Completed":
            return self._completed
        elif status == "Submitted":
            return self._submitted
        else:
            raise NotImplementedError(f"Scheduler does not maintain {status} queue")

    def dump(self):
        # dump status to pre-specified path
        status = {
            "submitted": self._submitted,
            "queued": self._queued,
            "completed": self._completed,
            "failed": self._failed,
        }
        logger.info(
            f"Scheduler status: \n"
            + f"Running jobs: {[job.job_name for job in status['submitted']]}\n"
            + f"Queued jobs: {[job.job_name for job in status['queued']]}\n"
            + f"completed jobs: {[job.job_name for job in status['completed']]}\n"
            + f"failed jobs: {[job.job_name for job in status['failed']]}"
        )
        pickle.dump(status, open(self._status_dump, "wb"))
        print(f"Scheduler dumped status to {self._status_dump}")
