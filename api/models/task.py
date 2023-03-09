# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import sys

import enum
import requests
import sqlalchemy as db
import yaml

import common.helpers as util
from common.logging import logger

from .base import Base, BaseModel
from .dataset import AccessTypeEnum, DatasetModel
from .round import Round


sys.path.append("../evaluation")  # noqa
from metrics.metric_getters import get_task_metrics_meta  # isort:skip
from metrics.train_file_metrics import dataperf  # isort:skip


EPSILON_PREC = 1e-4


class TrainFileMetricEnum(enum.Enum):
    dataperf = "dataperf"


def verify_dataperf_config(config_obj):
    prefixed_message = "in dataperf config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    assert "seeds" in config_obj, prefixed_message + "seeds must be in config object"


train_file_metric_config_verifiers = {
    TrainFileMetricEnum.dataperf.name: verify_dataperf_config,
}

train_file_metrics = {TrainFileMetricEnum.dataperf.name: dataperf}


class ModelWrongMetricEnum(enum.Enum):
    exact_match = "exact_match"
    string_f1 = "string_f1"
    ask_user = "ask_user"


def exact_match(output, target, config_obj):
    results = []
    for name in config_obj["reference_names"]:
        results.append(output[name] != target[name])
    if True in results:
        return True
    return False


def verify_exact_match_config(config_obj):
    prefixed_message = "in exact_match config: "
    assert "reference_names" in config_obj, (
        prefixed_message + "reference_names must be in config object"
    )
    assert isinstance(config_obj["reference_names"], list), (
        prefixed_message + "reference_names must be a list"
    )
    for name in config_obj["reference_names"]:
        assert isinstance(name, str), (
            prefixed_message + "items in reference_names must be strings"
        )


def string_f1(output, target, config_obj):
    from transformers.data.metrics.squad_metrics import compute_f1

    return (
        compute_f1(
            output[config_obj["reference_name"]],
            target[config_obj["reference_name"]],
        )
        < config_obj["threshold"]
    )


def verify_string_f1_config(config_obj):
    prefixed_message = "in string_f1 config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    assert isinstance(config_obj["reference_name"], str), (
        prefixed_message + "reference_name must be a string"
    )


def ask_user(output, target, config_obj):
    return None  # The frontend is supposed to see the None and then ask the user


def verify_ask_user_config(config_obj):
    pass


model_wrong_metrics = {
    ModelWrongMetricEnum.exact_match.name: exact_match,
    ModelWrongMetricEnum.string_f1.name: string_f1,
    ModelWrongMetricEnum.ask_user.name: ask_user,
}

model_wrong_metric_config_verifiers = {
    ModelWrongMetricEnum.exact_match.name: verify_exact_match_config,
    ModelWrongMetricEnum.string_f1.name: verify_string_f1_config,
    ModelWrongMetricEnum.ask_user.name: verify_ask_user_config,
}


class AggregationMetricEnum(enum.Enum):
    dynascore = "dynascore"


def verify_dynascore_config(config_obj):
    prefixed_message = "in dynascore config: "
    if "default_weights" in config_obj:
        assert isinstance(config_obj["default_weights"]), (
            prefixed_message + "default_weights must be a dict"
        )
        for metric, default_weight in config_obj["default_weights"].items():
            assert metric in tuple(PerfMetricEnum.__members__) + tuple(
                DeltaMetricEnum.__members__
            ) + ("examples_per_second", "memory_utilization"), (
                prefixed_message
                + "at least one of the provided metric names is not recognized"
            )

            assert 0 <= default_weight <= 5, (
                prefixed_message
                + "all default weights must be between 0 and 5, inclusive"
            )


aggregation_metric_config_verifiers = {
    AggregationMetricEnum.dynascore.name: verify_dynascore_config
}


class DeltaMetricEnum(enum.Enum):
    fairness = "fairness"
    robustness = "robustness"


def verify_fairness_config(config_obj):
    # assert "perturb_fields" in config_obj
    pass


def verify_robustness_config(config_obj):
    # assert "perturb_fields" in config_obj
    pass


delta_metric_config_verifiers = {
    DeltaMetricEnum.fairness.name: verify_fairness_config,
    DeltaMetricEnum.robustness.name: verify_robustness_config,
}


class PerfMetricEnum(enum.Enum):
    macro_f1 = "macro_f1"
    squad_f1 = "squad_f1"
    accuracy = "accuracy"
    sp_bleu = "sp_bleu"
    bleu = "bleu"
    chrf_pp = "chrf_pp"
    vqa_accuracy = "vqa_accuracy"
    dataperf_f1 = "dataperf_f1"
    dataperf_fraction_of_fixes = "dataperf_fraction_of_fixes"
    dataperf_balanced_accuracy = "dataperf_balanced_accuracy"


def verify_macro_f1_config(config_obj):
    prefixed_message = "in macro_f1 config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_dataperf_f1_config(config_obj):
    prefixed_message = "in dataperf_f1 config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_dataperf_fraction_of_fixes_config(config_obj):
    prefixed_message = "in dataperf_fraction_of_fixes config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )


def verify_dataperf_balanced_accuracy_config(config_obj):
    prefixed_message = "in dataperf_balanced_accuracy config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )


def verify_vqa_accuracy_config(config_obj):
    prefixed_message = "in vqa_accuracy config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_squad_f1_config(config_obj):
    prefixed_message = "in squad_f1 config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_accuracy_config(config_obj):
    prefixed_message = "in accuracy config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_sp_bleu_config(config_obj):
    prefixed_message = "in sp_bleu config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_bleu_config(config_obj):
    prefixed_message = "in bleu config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


def verify_chrf_pp_config(config_obj):
    prefixed_message = "in chrf_pp config: "
    assert "reference_name" in config_obj, (
        prefixed_message + "reference_name must be in config object"
    )
    # TODO: could do more verification to ensure that the type of the referenced object
    # is a string or string selection


perf_metric_config_verifiers = {
    PerfMetricEnum.macro_f1.name: verify_macro_f1_config,
    PerfMetricEnum.squad_f1.name: verify_squad_f1_config,
    PerfMetricEnum.dataperf_f1.name: verify_dataperf_f1_config,
    PerfMetricEnum.vqa_accuracy.name: verify_vqa_accuracy_config,
    PerfMetricEnum.accuracy.name: verify_accuracy_config,
    PerfMetricEnum.sp_bleu.name: verify_sp_bleu_config,
    PerfMetricEnum.bleu.name: verify_bleu_config,
    PerfMetricEnum.chrf_pp.name: verify_chrf_pp_config,
    PerfMetricEnum.dataperf_fraction_of_fixes.name: verify_dataperf_fraction_of_fixes_config,
    PerfMetricEnum.dataperf_balanced_accuracy.name: verify_dataperf_balanced_accuracy_config,
}


class AnnotationTypeEnum(enum.Enum):
    image = "image"
    string = "string"
    context_string_selection = "context_string_selection"
    prob = "prob"
    multilabel = "multilabel"
    multiclass = "multiclass"
    audio = "audio"


class AnnotationVerifierMode(enum.Enum):
    default = "default"
    dataset_upload = "dataset_upload"
    predictions_upload = "predictions_upload"


class AnnotationComponent:

    # This is re-implemented for cases where an annotation component requires that we
    # store different info in the db compared to the info that we send models.
    # For example, we might want to send image blobs to a model but store a url
    # instead of a blob in the db.
    @staticmethod
    def convert_to_model_io(obj):
        return obj

    @staticmethod
    def verify(name, config, data):
        raise NotImplementedError

    @staticmethod
    def verify_config(name, config):
        raise NotImplementedError


def get_name_to_full_annotation_config_obj(config):
    name_to_config_obj = {}

    # It is important that output is first in this list, so that objects with the same
    # name in input and context overwrite those from output in name_to_config_obj.
    # This is because config objects in output can be abbreviated to only contain
    # the name and none of the other arguments, as long as the name is from
    # a config object in input or context. We need to get the full information from
    # the input or context.
    annotation_config_objs = (
        config.get("output", [])
        + config.get("input", [])
        + config.get("context", [])
        + config.get("metadata", {}).get("create", [])
        + config.get("metadata", {}).get("validate", [])
    )

    for obj in annotation_config_objs:
        name_to_config_obj[obj["name"]] = obj
    return name_to_config_obj


class Image(AnnotationComponent):
    @staticmethod
    def convert_to_model_io(url):
        return base64.encodebytes(requests.get(url, verify=False).content).decode(
            "utf-8"
        )

    @staticmethod
    def verify(
        name,
        config,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        prefixed_message = "in image: "
        assert isinstance(data[name], str), (
            prefixed_message
            + "the value must be a string that is a url pointing to an image"
        )

    @staticmethod
    def verify_config(name, config):
        pass


class String(AnnotationComponent):
    @staticmethod
    def verify(
        name,
        config,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        prefixed_message = "in string: "
        if mode == AnnotationVerifierMode.dataset_upload:
            if isinstance(data[name], str):
                pass
            elif isinstance(data[name], list):
                for sub_obj in data[name]:
                    assert isinstance(sub_obj, str), (
                        prefixed_message
                        + "the value must be a string or list of strings"
                    )
            else:
                raise ValueError("Wrong type")
        else:
            assert isinstance(data[name], str), (
                prefixed_message + "the value must be a string"
            )

    @staticmethod
    def verify_config(config_obj, config):
        pass


class Audio(AnnotationComponent):
    @staticmethod
    def verify(
        name,
        config,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        pass

    @staticmethod
    def verify_config(config_obj, config):
        pass


class ContextStringSelection(AnnotationComponent):
    @staticmethod
    def verify(
        name,
        config,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        name_to_config_obj = get_name_to_full_annotation_config_obj(config)
        prefixed_message = "in context_string_selection: "
        if mode == AnnotationVerifierMode.dataset_upload:
            if isinstance(data[name], str):
                assert data[name] in data[name_to_config_obj[name]["reference_name"]], (
                    prefixed_message + "the selected string is not in the context"
                )
            elif isinstance(data[name], list):
                for sub_obj in data[name]:
                    assert isinstance(sub_obj, str), (
                        prefixed_message + "the value must be a string"
                    )
                    assert (
                        sub_obj in data[name_to_config_obj[name]["reference_name"]]
                    ), (prefixed_message + "the selected string is not in the context")
            else:
                raise ValueError("Wrong type")
        elif mode == AnnotationVerifierMode.predictions_upload:
            assert isinstance(data[name], str), (
                prefixed_message + "the value must be a string"
            )
        else:
            assert isinstance(data[name], str), (
                prefixed_message + "the value must be a string"
            )
            assert data[name] in data[name_to_config_obj[name]["reference_name"]], (
                prefixed_message + "the selected string is not in the context"
            )

    @staticmethod
    def verify_config(config_obj, config):
        prefixed_message = "in context_string_selection config: "
        assert "reference_name" in config_obj, (
            prefixed_message + "reference_name must be in config object"
        )
        reference_obj = list(
            filter(
                lambda other_obj: other_obj["name"] == config_obj["reference_name"],
                config["context"],
            )
        )[0]
        assert reference_obj["type"] == AnnotationTypeEnum.string.name, (
            prefixed_message + "the type of the context to select from must be a string"
        )


class Prob(AnnotationComponent):
    @staticmethod
    def verify(
        name,
        config,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        name_to_config_obj = get_name_to_full_annotation_config_obj(config)
        prefixed_message = "in prob: "
        if name_to_config_obj[name].get("single_prob", False):
            assert isinstance(data[name], float), (
                prefixed_message + "the value must be a float"
            )
            assert data[name] > 0 - EPSILON_PREC, (
                prefixed_message + "the value must be greater than 0"
            )
            assert data[name] < 1 + EPSILON_PREC, (
                prefixed_message + "the value must be less than 1"
            )
        else:
            assert isinstance(data[name], dict), (
                prefixed_message + "the value must be a dict"
            )
            if mode != AnnotationVerifierMode.predictions_upload:
                assert set(data[name].keys()) == set(
                    name_to_config_obj[name_to_config_obj[name]["reference_name"]][
                        "labels"
                    ]
                ), (
                    prefixed_message
                    + "the set of keys in the probability dict must match the set of"
                    + " labels"
                )
            assert sum(data[name].values()) < 1 + EPSILON_PREC, (
                prefixed_message + "the probabilities must sum to 1"
            )
            assert sum(data[name].values()) > 1 - EPSILON_PREC, (
                prefixed_message + "the probabilities must sum to 1"
            )

    @staticmethod
    def verify_config(config_obj, config):
        if config_obj.get("single_prob", False):
            pass
        else:
            prefixed_message = "in prob config: "
            assert "reference_name" in config_obj, (
                prefixed_message + "reference_name must be in config object"
            )
            reference_objs = filter(
                lambda other_obj: other_obj["name"] == config_obj["reference_name"],
                get_name_to_full_annotation_config_obj(config).values(),
            )
            for reference_obj in reference_objs:
                assert reference_obj["type"] in (AnnotationTypeEnum.multiclass.name,), (
                    prefixed_message
                    + "reference_name must point to an annotation component that is"
                    + " the multiclass type"
                )


class Multilabel(AnnotationComponent):
    @staticmethod
    def verify(
        name,
        config,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        name_to_config_obj = get_name_to_full_annotation_config_obj(config)
        prefixed_message = "in multilabel: "
        assert isinstance(data[name], list), (
            prefixed_message + "the value must be a list"
        )
        for item in data[name]:
            assert item in name_to_config_obj[name]["labels"], (
                prefixed_message + "labels must match those defined in config object"
            )

    @staticmethod
    def verify_config(config_obj, config):
        prefixed_message = "in multilabel config: "
        assert "labels" in config_obj, (
            prefixed_message + "labels must be a field in config object"
        )
        assert isinstance(config_obj["labels"], list), (
            prefixed_message + "labels must be a list"
        )
        for item in config_obj["labels"]:
            assert isinstance(item, str), (
                prefixed_message + "labels must be a list of strings"
            )


class Multiclass(AnnotationComponent):
    @staticmethod
    def verify(
        name,
        config,
        data,
        mode=AnnotationVerifierMode.default,
    ):
        name_to_config_obj = get_name_to_full_annotation_config_obj(config)
        prefixed_message = "in multiclass: "
        if mode == AnnotationVerifierMode.dataset_upload:
            if isinstance(data[name], str):
                assert data[name] in name_to_config_obj[name]["labels"], (
                    prefixed_message
                    + "labels must match those defined in config object"
                )
            elif isinstance(data[name], list):
                for sub_obj in data[name]:
                    assert isinstance(sub_obj, str), (
                        prefixed_message
                        + "labels must match those defined in config object"
                    )
                    assert sub_obj in name_to_config_obj[name]["labels"], (
                        prefixed_message
                        + "labels must match those defined in config object"
                    )
            else:
                raise ValueError("Wrong type")
        else:
            assert isinstance(data[name], str), (
                prefixed_message + "value must be a string"
            )
            assert data[name] in name_to_config_obj[name]["labels"], (
                prefixed_message + "labels must match those defined in config object"
            )

    @staticmethod
    def verify_config(config_obj, config):
        prefixed_message = "in multiclass config: "
        assert "labels" in config_obj, (
            prefixed_message + "labels must be a field in config object"
        )
        assert isinstance(config_obj["labels"], list), (
            prefixed_message + "labels must be a list"
        )
        for item in config_obj["labels"]:
            assert isinstance(item, str), prefixed_message + "a label must be a string"


annotation_components = {
    AnnotationTypeEnum.image.name: Image,
    AnnotationTypeEnum.string.name: String,
    AnnotationTypeEnum.context_string_selection.name: ContextStringSelection,
    AnnotationTypeEnum.prob.name: Prob,
    AnnotationTypeEnum.multilabel.name: Multilabel,
    AnnotationTypeEnum.multiclass.name: Multiclass,
    AnnotationTypeEnum.audio.name: Audio,
}


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    task_code = db.Column(db.String(length=255), unique=True, nullable=False)

    name = db.Column(db.String(length=255), nullable=False, unique=True)
    config_yaml = db.Column(db.Text, nullable=False)

    instructions_md = db.Column(db.Text)

    desc = db.Column(db.String(length=255))

    last_updated = db.Column(db.DateTime)

    cur_round = db.Column(db.Integer, nullable=False)

    hidden = db.Column(db.Boolean, default=True)
    is_building = db.Column(db.Boolean, default=False)
    submitable = db.Column(db.Boolean, default=False)

    validate_non_fooling = db.Column(db.Boolean, default=False, nullable=False)
    num_matching_validations = db.Column(db.Integer, default=3, nullable=False)
    unpublished_models_in_leaderboard = db.Column(
        db.Boolean, default=False, nullable=False
    )
    dynalab_hr_diff = db.Column(db.Integer, default=24, nullable=False)
    dynalab_threshold = db.Column(db.Integer, default=3, nullable=False)

    instance_type = db.Column(db.Text, default="ml.m5.2xlarge", nullable=False)
    instance_count = db.Column(db.Integer, default=1, nullable=False)
    aws_region = db.Column(db.Text, default="us-west-1", nullable=False)
    s3_bucket = db.Column(
        db.Text, default="evaluation-us-west-1-096166425824", nullable=False
    )
    eval_server_id = db.Column(db.Text, default="default", nullable=False)
    create_endpoint = db.Column(db.Boolean, default=True)
    gpu = db.Column(db.Boolean, default=False)
    extra_torchserve_config = db.Column(db.Text)
    active = db.Column(db.Boolean, default=False)

    has_predictions_upload = db.Column(db.Boolean, default=False)
    predictions_upload_instructions_md = db.Column(db.Text)
    build_sqs_queue = db.Column(db.Text)
    eval_sqs_queue = db.Column(db.Text)
    is_decen_task = db.Column(db.Boolean, default=False)
    task_aws_account_id = db.Column(db.Text)
    task_gateway_predict_prefix = db.Column(db.Text)
    context = db.Column(db.Text)
    dataperf = db.Column(db.Boolean, default=False)
    lambda_model = db.Column(db.Text)
    mlsphere_json = db.Column(db.JSON)

    unique_validators_for_example_tags = db.Column(db.Boolean, default=False)
    mlcube_tutorial_markdown = db.Column(db.Text)
    dynamic_adversarial_data_collection = db.Column(db.Boolean, default=True)
    train_file_upload_instructions_md = db.Column(db.Text)
    decen_queue = db.Column(db.Text)
    decen_bucket = db.Column(db.Text)
    decen_aws_region = db.Column(db.Text)
    image_url = db.Column(db.Text)
    documentation_url = db.Column(db.Text)

    def __repr__(self):
        return f"<Task {self.name}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d

    @staticmethod
    def verify_train_file_metric_config(train_file_metric_config):
        prefixed_message = "in train_file_metric config: "
        assert "type" in train_file_metric_config, (
            prefixed_message + "type must be a field in train_file_metric_config"
        )
        train_file_metric_config_verifiers[train_file_metric_config["type"]](
            train_file_metric_config
        )

    @staticmethod
    def verify_model_wrong_metric_config(model_wrong_metric_config):
        prefixed_message = "in model_wrong_metric config: "
        assert "type" in model_wrong_metric_config, (
            prefixed_message + "type must be a field in model_wrong_metric_config"
        )
        model_wrong_metric_config_verifiers[model_wrong_metric_config["type"]](
            model_wrong_metric_config
        )

    @staticmethod
    def verify_aggregation_metric_config(aggregation_metric_config):
        prefixed_message = "in aggregation_metric config: "
        assert "type" in aggregation_metric_config, (
            prefixed_message + "type must be a field in aggregation_metric_config"
        )
        aggregation_metric_config_verifiers[aggregation_metric_config["type"]](
            aggregation_metric_config
        )

    @staticmethod
    def verify_perf_metric_config(perf_metric_config):
        prefixed_message = "in perf_metric config: "
        assert "type" in perf_metric_config, (
            prefixed_message + "type must be a field in aggregation_metric_config"
        )
        perf_metric_config_verifiers[perf_metric_config["type"]](perf_metric_config)

    @staticmethod
    def verify_delta_metrics_config(delta_metrics_config):
        prefixed_message = "in delta_metrics config: "
        for delta_metric_config in delta_metrics_config:
            assert "type" in delta_metric_config, (
                prefixed_message + "type must be a field in delta_metric_config"
            )
            delta_metric_config_verifiers[delta_metric_config["type"]](
                delta_metric_config
            )

    @staticmethod
    def verify_config(config):
        prefixed_message = "in config: "
        if "aggregation_metric" in config:
            Task.verify_aggregation_metric_config(config["aggregation_metric"])

        if "model_wrong_metric" in config:
            Task.verify_model_wrong_metric_config(config["model_wrong_metric"])

        assert "perf_metric" in config, (
            prefixed_message + "perf_metric must be a field in config"
        )
        Task.verify_perf_metric_config(config["perf_metric"])

        if "delta_metrics" in config:
            Task.verify_delta_metrics_config(config["delta_metrics"])

        if "train_file_metric" in config:
            Task.verify_train_file_metric_config(config["train_file_metric"])

        annotation_config_objs = get_name_to_full_annotation_config_obj(config).values()
        for obj in annotation_config_objs:
            assert "name" in obj, (
                prefixed_message + "name must be a field in annotation config objects"
            )
            assert isinstance(obj["name"], str), (
                prefixed_message + "name must be a string"
            )
            assert "type" in obj, (
                prefixed_message + "type must be a field in annotation config objects"
            )
            assert isinstance(obj["type"], str), (
                prefixed_message + "type must be a string"
            )
            annotation_components[obj["type"]].verify_config(obj, config)

    def verify_annotation(self, data, mode=AnnotationVerifierMode.default):
        config = yaml.load(self.config_yaml, yaml.SafeLoader)
        name_to_config_obj = get_name_to_full_annotation_config_obj(config)

        for name in data.keys():
            if (
                name in name_to_config_obj
            ):  # TODO This check is necessary for non-dynalab models.
                # Can be removed when dynatask-dynalab integration is complete.
                try:
                    annotation_components[name_to_config_obj[name]["type"]].verify(
                        name,
                        config,
                        data,
                        mode,
                    )
                except Exception as e:
                    logger.error(e)
                    return False, str(e)
        return True, "no problems detected"

    def convert_to_model_io(self, data):
        name_to_type = {}
        config = yaml.load(self.config_yaml, yaml.SafeLoader)
        annotation_config_objs = get_name_to_full_annotation_config_obj(config).values()

        for obj in annotation_config_objs:
            name_to_type[obj["name"]] = obj["type"]

        converted_data = util.json_decode(util.json_encode(data))
        for key, value in data.items():
            if key in name_to_type:
                converted_data[key] = annotation_components[
                    name_to_type[key]
                ].convert_to_model_io(value)

        return converted_data


class TaskModel(BaseModel):
    def __init__(self):
        super().__init__(Task)

    def getByTaskCode(self, task_code):
        try:
            return self.dbs.query(Task).filter(Task.task_code == task_code).one()
        except db.orm.exc.NoResultFound:
            return False

    def getByTaskId(self, tid):
        try:
            return self.dbs.query(Task).filter(Task.id == tid).one()
        except db.orm.exc.NoResultFound:
            return False

    def getByName(self, name):
        try:
            return self.dbs.query(Task).filter(Task.name == name).one()
        except db.orm.exc.NoResultFound:
            return False

    def listWithRounds(self, exclude_hidden=True):
        rows = self.dbs.query(Task, Round).join(
            Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round)
        )
        if exclude_hidden:
            rows = rows.filter(Task.hidden.is_(False))
        rows = rows.all()
        tasks = [x[0].to_dict() for x in rows]
        for ii, r in enumerate([x[1] for x in rows]):
            tasks[ii]["round"] = r.to_dict()
        self.dbs.expunge_all()
        return tasks

    def listSubmitable(self):
        rows = self.dbs.query(Task).filter(Task.submitable.is_(True)).all()
        tasks = [x.to_dict() for x in rows]
        return tasks

    def get_default_dataset_weight(self, task, name):
        # TODO:  allow this to be settable by the task owner?
        return 5

    def get_default_metric_weight(
        self, field_name, perf_metric_field_name, default_weights
    ):
        default_weight = default_weights.get(field_name)
        if default_weight is not None:
            return default_weight

        if field_name == perf_metric_field_name:
            return 4
        return 1

    def getWithRoundAndMetricMetadata(self, task_id_or_code):
        try:
            if isinstance(task_id_or_code, int) or task_id_or_code.isdigit():
                t, r = (
                    self.dbs.query(Task, Round)
                    .filter(Task.id == task_id_or_code)
                    .join(Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round))
                    .one()
                )
            else:
                t, r = (
                    self.dbs.query(Task, Round)
                    .filter(Task.task_code == task_id_or_code)
                    .join(Round, (Round.tid == Task.id) & (Round.rid == Task.cur_round))
                    .one()
                )
            dm = DatasetModel()
            datasets = dm.getByTid(t.id)
            dataset_list = []
            scoring_dataset_list = []
            for dataset in datasets:
                dataset_list.append({"id": dataset.id, "name": dataset.name})
                if dataset.access_type == AccessTypeEnum.scoring:
                    scoring_dataset_list.append(
                        {
                            "id": dataset.id,
                            "name": dataset.name,
                            "default_weight": self.get_default_dataset_weight(
                                t, dataset.name
                            ),
                        }
                    )
            dataset_list.sort(key=lambda dataset: dataset["id"])
            scoring_dataset_list.sort(key=lambda dataset: dataset["id"])

            t_dict = t.to_dict()
            r_dict = r.to_dict()
            t_dict["ordered_scoring_datasets"] = scoring_dataset_list
            t_dict["ordered_datasets"] = dataset_list
            config = yaml.load(t_dict["config_yaml"], yaml.SafeLoader)
            # TODO: make the frontend use perf_metric instead of perf_metric_field_name?
            if "perf_metric" in config:
                t_dict["perf_metric_field_name"] = config["perf_metric"]["type"]
                metrics_meta, ordered_field_names = get_task_metrics_meta(t)
                ordered_metrics = [
                    dict(
                        {
                            "name": metrics_meta[field_name]["pretty_name"],
                            # TODO: make the frontend use pretty_name?
                            "field_name": field_name,
                            "default_weight": self.get_default_metric_weight(
                                field_name,
                                t_dict["perf_metric_field_name"],
                                config.get("aggregation_metric", {}).get(
                                    "default_weights", {-1: 1}
                                ),
                            ),
                        },
                        **metrics_meta[field_name],
                    )
                    for field_name in ordered_field_names
                ]

                t_dict["ordered_metrics"] = ordered_metrics
            t_dict["round"] = r_dict
            return t_dict
        except db.orm.exc.NoResultFound:
            return False

    def to_dict(self, model):
        task_dict = {}
        for c in model.__table__.columns:
            task_dict[c.name] = getattr(model, c.name)
        return task_dict
