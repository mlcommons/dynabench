# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import logging
import os
import tempfile

import boto3
import yaml

from eval_config import eval_config
from metrics.metric_getters import get_delta_metrics, get_eval_metrics
from models.dataset import AccessTypeEnum, LogAccessTypeEnum
from models.task import TaskModel
from utils.helpers import (
    dotdict,
    get_data_s3_path,
    get_perturbed_filename,
    parse_s3_outfile,
    path_available_on_s3,
    upload_predictions,
)


logger = logging.getLogger("datasets")


class BaseDataset:
    def __init__(
        self,
        task_code,
        round_id,
        name,
        config=eval_config,
        access_type=AccessTypeEnum.scoring,
        log_access_type=LogAccessTypeEnum.owner,
        ext=".jsonl",
        longdesc=None,
        source_url=None,
        db_connection_avail=True,
        db_connection_not_avail_task_info=None,
    ):
        self.name = name
        self.round_id = round_id
        self.access_type = access_type
        self.filename = self.name + ext
        self._n_examples = {}  # will be get through API

        if db_connection_avail:
            tm = TaskModel()
            self.task = tm.getByTaskCode(task_code)
        else:
            self.task = db_connection_not_avail_task_info

        self.s3_url = self._get_data_s3_url()
        self.longdesc = longdesc
        self.source_url = source_url
        self._config = config
        self._s3_client = None
        self._check_dataset_on_s3()

    def _check_dataset_on_s3(self):
        # Datasets are now uploaded by task owners from the DynaBench UI, so we don't
        # upload them here.
        # We just display logs to confirm which datasets are present/absent on S3.
        if self.dataset_available_on_s3():
            logger.info(f"Dataset {self.name} exists on S3 at {self.s3_url}")
        else:
            logger.exception(f"Dataset {self.name} does not exist on S3. ")

    @property
    def s3_client(self):
        if self._s3_client is None:
            region = self._config["sagemaker_region"] or self._config["aws_region"]
            self._s3_client = boto3.client(
                "s3",
                aws_access_key_id=self._config["aws_access_key_id"],
                aws_secret_access_key=self._config["aws_secret_access_key"],
                region_name=region,
            )
        return self._s3_client

    def __getstate__(self):
        """Custom pickling method: doesn't try to serialize the S3 client"""
        self._s3_client = None
        return self.__dict__

    def s3_path(self, *parts: str) -> str:
        return f"s3://{self.task.s3_bucket}/" + "/".join(parts)

    def _get_data_s3_path(self, perturb_prefix=None):
        return get_data_s3_path(self.task.task_code, self.filename, perturb_prefix)

    def _get_data_s3_url(self, perturb_prefix=None):
        return self.s3_path(self._get_data_s3_path(perturb_prefix))

    def _get_output_s3_url_prefix(self, endpoint_name):
        return self.s3_path("predictions", endpoint_name, self.task.task_code)

    def _get_raw_output_s3_url_prefix(self, endpoint_name):
        return self.s3_path("predictions", endpoint_name, "raw", self.task.task_code)

    def dataset_available_on_s3(self, perturb_prefix=None) -> bool:
        path = self._get_data_s3_path(perturb_prefix)
        return path_available_on_s3(self.s3_client, self.task.s3_bucket, path, path)

    def get_output_s3_url(self, endpoint_name, raw=False, perturb_prefix=None):
        if raw:
            prefix = self._get_raw_output_s3_url_prefix(endpoint_name)
        else:
            prefix = self._get_output_s3_url_prefix(endpoint_name)
        filename = get_perturbed_filename(self.filename, perturb_prefix)
        return os.path.join(prefix, filename + ".out")

    def run_batch_transform(
        self, sagemaker_client, endpoint_name, job_name, perturb_prefix=None
    ) -> bool:
        """Submit an evaluation job"""
        logger.debug(
            f"Will create transform job {job_name} with task: {self.task.task_code}"
        )
        batch_transform_config = self.get_batch_transform_config(
            sagemaker_client, endpoint_name, job_name, perturb_prefix
        )
        sagemaker_client.create_transform_job(**batch_transform_config)
        return True

    def get_batch_transform_config(
        self, sagemaker_client, endpoint_name, job_name, perturb_prefix=None
    ) -> dict:
        input_names = [
            obj["name"]
            for obj in yaml.load(self.task.config_yaml, yaml.SafeLoader).get(
                "input", []
            )
        ]
        output_names = [
            obj["name"]
            for obj in yaml.load(self.task.config_yaml, yaml.SafeLoader).get(
                "output", []
            )
        ]
        input_names_without_target_names = list(
            set(input_names).difference(set(output_names))
        )
        model_input_names = input_names_without_target_names + [
            obj["name"]
            for obj in yaml.load(self.task.config_yaml, yaml.SafeLoader).get(
                "context", []
            )
        ]
        model_input_names.append("uid")  # unique example identifier
        return dict(
            ModelName=endpoint_name,
            TransformJobName=job_name,
            MaxConcurrentTransforms=1,
            BatchStrategy="SingleRecord",
            TransformInput={
                "DataSource": {
                    "S3DataSource": {
                        "S3DataType": "S3Prefix",
                        "S3Uri": self._get_data_s3_url(perturb_prefix),
                    }
                },
                "ContentType": "application/json",
                "SplitType": "Line",
            },
            TransformOutput={
                # change to config
                "S3OutputPath": self._get_raw_output_s3_url_prefix(endpoint_name),
                "Accept": "application/json",
                "AssembleWith": "Line",
            },
            TransformResources={
                "InstanceType": self.task.instance_type,
                "InstanceCount": self.task.instance_count,
            },
            DataProcessing={"InputFilter": f"${model_input_names}"},
            ModelClientConfig={
                # Max value for sagemaker, we rely on the timeout of torchserve
                "InvocationsTimeoutInSeconds": 3600
            },
        )

    def read_labels(self, perturb_prefix=None):
        tf = tempfile.mkstemp(prefix=self.name)[1]
        self.s3_client.download_file(
            self.task.s3_bucket, self._get_data_s3_path(perturb_prefix), tf
        )
        data = [json.loads(l) for l in open(tf).readlines()]
        if perturb_prefix:
            labels = [self.perturb_label_field_converter(example) for example in data]
        else:
            labels = [self.label_field_converter(example) for example in data]
        os.remove(tf)
        if not self._n_examples.get(perturb_prefix, None):
            self._n_examples[perturb_prefix] = len(labels)
        return labels

    def get_n_examples(self, perturb_prefix=None):
        if not self._n_examples.get(perturb_prefix, None):
            self.read_labels(perturb_prefix)
        return self._n_examples[perturb_prefix]

    def compute_job_metrics(self, job) -> tuple:
        """Fetches the predictions for the given job, and compute the metrics
        (accuracy, ...).

        This can be used by tasks to have a better control on how the metrics are
        computed.
        """

        predictions = self.parse_outfile_and_upload(job)
        eval_metrics_dict = self.eval(predictions, perturb_prefix=job.perturb_prefix)
        delta_metrics_dict = {}
        if job.perturb_prefix:
            targets = [
                self.pred_to_target_converter(self.pred_field_converter(prediction))
                for prediction in self.parse_outfile_and_upload(job, original=True)
            ]

            delta_metrics_dict = self.eval(
                predictions, targets, perturb_prefix=job.perturb_prefix
            )

        return eval_metrics_dict, delta_metrics_dict

    def eval(self, predictions: list, targets=None, perturb_prefix=None) -> dict:
        """
        Adapted from common.helpers.validate_prediction, compute accuracy / f1, etc.
        If targets is passed, will compute weighted delta metrics against
        the given target, and the target id should be original id
        """
        # load target examples
        target_examples = self.read_labels(perturb_prefix) if not targets else targets
        target_ids = [x["id"] for x in target_examples]
        # note to compute accuracy with changed label,
        # each perturbed example needs to have a unique id too
        target_labels_dict = {t["id"]: t["answer"] for t in target_examples}
        target_labels = [target_labels_dict[id] for id in target_ids]
        target_tags_dict = {t["id"]: t["tags"] for t in target_examples}
        target_tags = [target_tags_dict[id] for id in target_ids]

        predictions = [
            self.pred_field_converter(prediction) for prediction in predictions
        ]

        score_obj = {}  # score_obj keys always correspond to scores table columns

        if targets and perturb_prefix:  # i.e compute perturb percentage
            predictions_dict = {id: [] for id in target_ids}
            try:
                id_mapping = self.read_labels(perturb_prefix)
                id_mapping = {m["id"]: m["input_id"] for m in id_mapping}
                for p in predictions:
                    predictions_dict[id_mapping[p["id"]]].append(p["pred"])
                predictions = [predictions_dict[id] for id in target_ids]
            except KeyError as ex:
                logger.exception(f"Prediction and target file example mismatch: {ex}")
            except Exception as ex:
                logger.exception(f"Unknown exception {ex}")
            else:
                delta_metrics_dict = get_delta_metrics(
                    self.task, predictions, target_labels, perturb_prefix
                )
                score_obj = {
                    **delta_metrics_dict,
                    "metadata_json": json.dumps(delta_metrics_dict),
                }

        else:  # compute normal eval metrics
            # validate alignment of prediction and target labels
            predictions = {p["id"]: p["pred"] for p in predictions}
            try:
                predictions = [predictions[id] for id in target_ids]
                assert len(predictions) == len(target_labels)
            except AssertionError:
                logger.exception("Prediction and target file length mismatch")
            except KeyError as ex:
                logger.exception(f"Prediction and target file example mismatch: {ex}")
            except Exception as ex:
                logger.exception(f"Unknown exception {ex}")
            else:
                # Get performance
                perf, perf_dict = get_eval_metrics(
                    self.task, predictions, target_labels
                )
                score_obj["perf"] = perf
                score_obj["perf_std"] = perf_dict.get("perf_std", None)
                score_obj["pretty_perf"] = str(perf) + " %"
                score_obj["metadata_json"] = perf_dict

                # Get performance breakdown for this round across tags
                if target_tags:
                    examples_by_tag = {}
                    for pred, target_label, target_tags in zip(
                        predictions, target_labels, target_tags
                    ):
                        for tag in target_tags:
                            examples_by_tag.setdefault(tag, []).append(
                                (pred, target_label)
                            )
                    perf_by_tag_tuple_dict = {
                        k: get_eval_metrics(self.task, *list(zip(*examples)))
                        for k, examples in examples_by_tag.items()
                    }
                    score_obj["metadata_json"]["perf_by_tag"] = score_obj[
                        "metadata_json"
                    ].get("perf_by_tag", []) + [
                        {
                            "tag": tag,
                            "pretty_perf": str(perf) + " %",
                            "perf": perf,
                            "perf_std": perf_dict.get("perf_std", None),
                            "perf_dict": perf_dict,
                        }
                        for tag, (perf, perf_dict) in perf_by_tag_tuple_dict.items()
                    ]

                score_obj["metadata_json"] = json.dumps(score_obj["metadata_json"])

        return score_obj

    def parse_outfile_and_upload(self, job, original=False):
        """Parses the job outfile, and reupload it in .jsonl format."""
        perturb_prefix = None if original else job.perturb_prefix
        try:
            raw_output_s3_uri = self.get_output_s3_url(
                job.endpoint_name, raw=True, perturb_prefix=perturb_prefix
            )
            predictions = parse_s3_outfile(self.s3_client, raw_output_s3_uri)
            output_s3_uri = self.get_output_s3_url(
                job.endpoint_name, raw=False, perturb_prefix=perturb_prefix
            )
            upload_predictions(self.s3_client, output_s3_uri, predictions)
        except Exception as e:
            logger.exception(
                f"Exception in parsing output file for {job.job_name}: {e}"
            )
            raise e
        return predictions

    def perturb_label_field_converter(self, example):
        return {"input_id": example["input_id"], **self.label_field_converter(example)}

    def pred_to_target_converter(self, pred):
        """
        Used for fairness and robustness to compute
        unperturbed percentage on output
        """
        pred["answer"] = pred.pop("pred")
        pred["tags"] = []
        return pred

    def label_field_converter(self, example):
        """
        Convert the example to a format expected by self.eval,
        the input is whatever that has been sent to S3, hence this function
        should normally be implemented on dataset level,
        and the output should have the following keys,
        {
            "id": <a unique identifier>,
            "answer": <the correct answer that will be used to calculate metrics>,
            "tags": <list of string, can be empty>
        }
        """
        task_config = yaml.load(self.task.config_yaml, yaml.SafeLoader)
        if isinstance(task_config["perf_metric"], list):
            reference_name = task_config["perf_metric"]["reference_name"]
        elif isinstance(task_config["perf_metric"], dict):
            reference_name = task_config["perf_metric"]["reference_name"]
        return {
            "id": example["uid"],
            "answer": example[reference_name],
            "tags": example.get("tags", []),
        }  # NOTE: For now, the perf_metric defines the output to look for

    def pred_field_converter(self, example):
        """
        Convert the prediction to a format expected by self.eval,
        the input follows the format of required handler output defined in Dynalab,
        hence this function should normally be implemented on task level,
        and the output should have the following keys
        {
            "id": <a unique identifier>,
            "pred": <the prediction that will be used to calculate metrics>,
        }
        """
        task_config = yaml.load(self.task.config_yaml, yaml.SafeLoader)
        if isinstance(task_config["perf_metric"], list):
            reference_name = task_config["perf_metric"]["reference_name"]
        elif isinstance(task_config["perf_metric"], dict):
            reference_name = task_config["perf_metric"]["reference_name"]
        return {
            "id": example["id"],
            "pred": example[["perf_metric"][reference_name]],
        }  # NOTE: For now, the perf_metric defines the output to look for

    def to_dict(self, endpoint_name):
        return {
            "round_id": self.round_id,
            "get_output_s3_url": self.get_output_s3_url(endpoint_name),
            "get_n_examples": self.get_n_examples(),
            "task": dotdict({"instance_type": self.task.instance_type}),
        }
