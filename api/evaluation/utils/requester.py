# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging

import yaml

from common.config import config
from models.dataset import DatasetModel
from models.model import DeploymentStatusEnum, ModelModel
from utils.computer import MetricsComputer
from utils.evaluator import JobScheduler
from utils.helpers import get_perturb_prefix, send_takedown_model_request


logger = logging.getLogger("requester")


class Requester:
    def __init__(self, config, datasets):
        self.scheduler = JobScheduler(config, datasets)
        self.computer = MetricsComputer(config, datasets)
        self.datasets = datasets

    def request(self, msg):
        model_ids = msg.get("model_id", None)
        dataset_names = msg.get("dataset_name", None)
        if model_ids == "*":
            model_ids = None
        if dataset_names == "*":
            dataset_names = None
        if not model_ids and not dataset_names:
            logger.exception(
                f"Request failed. At least one of "
                f"model_id and dataset_name should be specified"
            )
            return False
        if model_ids and not isinstance(model_ids, list):
            model_ids = [model_ids]
        if dataset_names and not isinstance(dataset_names, list):
            dataset_names = [dataset_names]

        if model_ids and not dataset_names:
            for model_id in model_ids:
                logger.info(f"Request to evaluate model {model_id}")
                self._eval_model(model_id)
        elif dataset_names and not model_ids:
            for dataset_name in dataset_names:
                logger.info(f"Request to evaluate dataset {dataset_name}")
                self._eval_dataset(dataset_name)
        else:
            for model_id in model_ids:
                for dataset_name in dataset_names:
                    self._eval_model_on_dataset(model_id, dataset_name)
        self.scheduler.dump()
        return True

    def submit(self):
        self.scheduler.submit()

    def _eval_model_on_dataset(self, model_id, dataset_name):
        """
        evaluate a given model on given datasets
        if the given dataset_name is an original dataset,
        will evaluate all perturbed datasets too, otherwise
        it will automatically figure out the perturb prefix
        """
        try:
            dataset_name, perturb_prefix = get_perturb_prefix(
                dataset_name, self.datasets
            )
        except RuntimeError as ex:
            logger.exception(ex)
        else:
            self.scheduler.enqueue(model_id, dataset_name, perturb_prefix, dump=False)
            if not perturb_prefix:
                dataset = self.datasets[dataset_name]
                delta_metric_types = [
                    obj["type"]
                    for obj in yaml.load(dataset.task.config_yaml).get(
                        "delta_metrics", []
                    )
                ]
                for prefix in delta_metric_types:
                    if dataset.dataset_available_on_s3(prefix):
                        self.scheduler.enqueue(
                            model_id, dataset_name, prefix, dump=False
                        )

    def _eval_model(self, model_id):
        # given a model_id, evaluate all datasets for the
        # model's primary task
        m = ModelModel()
        tid = m.getUnpublishedModelByMid(model_id).tid
        if tid:
            d = DatasetModel()
            datasets = d.getByTid(tid)
            if datasets:
                dataset_names = [dataset.name for dataset in datasets]
                for dataset_name in dataset_names:
                    self._eval_model_on_dataset(model_id, dataset_name)
            else:
                logger.warning(f"No datasets are available for task {tid}")
        else:
            logger.exception(f"Task not found for model {model_id}")

    def _eval_dataset(self, dataset_name):
        # given a dataset id, evaluate all models for the
        # dataset's task
        try:
            original_dataset_name, _ = get_perturb_prefix(dataset_name, self.datasets)
        except RuntimeError as ex:
            logger.exception(ex)
        else:
            tid = self.datasets[original_dataset_name].task.id
            if tid:
                m = ModelModel()
                models = m.getByTid(tid)
                if models:
                    for model in models:
                        if model.deployment_status in {
                            DeploymentStatusEnum.deployed,
                            DeploymentStatusEnum.created,
                            DeploymentStatusEnum.predictions_upload,
                        }:
                            self._eval_model_on_dataset(model.id, dataset_name)
                else:
                    logger.warning(f"No models are available for task {tid}")
            else:
                logger.exception(f"Task not found for dataset {dataset_name}")

    def update_status(self):
        self.scheduler.update_status()
        jobs = self.scheduler.pop_jobs(status="Completed", N=-1)
        self.computer.update_status(jobs)

        failed_models = set()
        mm = ModelModel()
        remaining_failed_job_ids = []
        for i, job in enumerate(self.scheduler._failed):
            if job.status and job.status.get("FailureReason", "").startswith(
                "AlgorithmError"
            ):
                failed_models.add(job.model_id)
            else:
                remaining_failed_job_ids.append(i)

        if failed_models:
            remaining_queued_job_ids = []
            remaining_submitted_job_ids = []
            remaining_evaluating_job_ids = []
            for mid in failed_models:
                mm.update(mid, deployment_status=DeploymentStatusEnum.failed)
                send_takedown_model_request(model_id=mid, config=config, logger=logger)
                for i, job in enumerate(self.scheduler._queued):
                    if job.model_id != mid:
                        remaining_queued_job_ids.append(i)

                for i, job in enumerate(self.scheduler._submitted):
                    if job.model_id == mid:
                        self.scheduler.stop(job)
                    else:
                        remaining_submitted_job_ids.append(i)

                for i, job in enumerate(self.computer._computing):
                    if job.model_id != mid:
                        remaining_evaluating_job_ids.append(i)

            self.scheduler._queued = [
                self.scheduler._queued[i] for i in remaining_queued_job_ids
            ]
            self.scheduler._submitted = [
                self.scheduler._submitted[i] for i in remaining_submitted_job_ids
            ]
            self.computer._computing = [
                self.computer._computing[i] for i in remaining_evaluating_job_ids
            ]

            self.scheduler._failed = [
                self.scheduler._failed[i] for i in remaining_failed_job_ids
            ]

            self.scheduler.dump()
            self.computer.dump()

    def compute(self, N=1):
        self.computer.compute(N=N)

    def get_failed_jobs(self, status):
        return self.scheduler.get_jobs(status="Failed") + self.computer.get_jobs(
            status="Failed"
        )
