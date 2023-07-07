# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script will take down all:
#
# (1) non in the loop models that have not been
# used in some amount of time (defined by endpoint_last_used_cutoff flag)
#
# (2) all endpoints not associated with any model in the DB
#
# By "remove" we mean taking down:
# (1) the endpoint,
# (2) the endpoint config
# (3) the sagemaker model
# These models can be redeployed by sending a message to the build
# server, for example:
# {"model_id": MODEL_ID, "s3_uri": s3_PATH_TO_SAVED_MODEL, "endpoint_only":True}
import argparse
import traceback
from datetime import datetime, timedelta

import boto3

from models.model import DeploymentStatusEnum, ModelModel


from builder.utils.deployer import ModelDeployer  # noqa isort:skip
from builder.build_config import build_config  # noqa isort:skip


class ModelPruner:
    def __init__(
        self, region, endpoint_last_used_cutoff, test_run, endpoints_name_not_touch
    ):
        self.region = region
        self.endpoint_last_used_cutoff = endpoint_last_used_cutoff
        self.test_run = test_run
        self.endpoints_name_not_touch = endpoints_name_not_touch

        # Setup AWS session
        session = boto3.Session(
            aws_access_key_id=build_config["aws_access_key_id"],
            aws_secret_access_key=build_config["aws_secret_access_key"],
            region_name=region,
        )

        self.sm = session.client("sagemaker")
        self.cw = session.client("cloudwatch")

        self.obj_type_to_sm_method = {
            "endpoint": self.sm.list_endpoints,
            "sagemaker_model": self.sm.list_models,
            "endpoint_config": self.sm.list_endpoint_configs,
        }

        self.obj_type_to_sm_resp_field = {
            "endpoint": "Endpoints",
            "sagemaker_model": "Models",
            "endpoint_config": "EndpointConfigs",
        }

        self.endpoints_deleted = []

    def _dont_touch_endpoint(self, ep_name):
        return len(self.endpoints_name_not_touch) > 0 and (
            any(
                ep_name in bad_endpoint
                for bad_endpoint in self.endpoints_name_not_touch
            )
        )

    def _delete_from_aws(self, endpoint_name):
        print(f"Removing model endpoint at: {endpoint_name}")

        # Delete Endpoint
        endpoint_to_delete = self._find_obj(endpoint_name, "endpoint")
        if endpoint_to_delete is not None:
            self.sm.delete_endpoint(EndpointName=endpoint_name)

        # Delete Sagemaker model
        model_to_delete = self._find_obj(endpoint_name, "sagemaker_model")
        if model_to_delete is not None:
            self.sm.delete_model(ModelName=endpoint_name)

        # Delete Endpoint Config
        endpoint_config_to_delete = self._find_obj(endpoint_name, "endpoint_config")
        if endpoint_config_to_delete is not None:
            self.sm.delete_endpoint_config(EndpointConfigName=endpoint_name)

    def _find_obj(self, ep_name, obj_name):
        sm_method = self.obj_type_to_sm_method[obj_name]
        sm_resp_field = self.obj_type_to_sm_resp_field[obj_name]

        endpoint_response = sm_method(
            NameContains=ep_name,
            MaxResults=100,
        )

        endpoints = endpoint_response[sm_resp_field]
        while "NextToken" in endpoint_response:
            next_token = endpoint_response["NextToken"]
            endpoint_response = sm_method(
                NameContains=ep_name,
                MaxResults=100,
                NextToken=next_token,
            )

            endpoints += endpoint_response[sm_resp_field]

        if len(endpoints) < 1:
            print(f"Found no AWS object of type {obj_name} for {ep_name}, skipping...")
            return

        if len(endpoints) > 1:
            print(
                f"Found multiple AWS objects of type {obj_name} for {ep_name}"
                ", skipping..."
            )
            return

        return endpoints[0]

    def delete_models_not_in_the_loop(self):
        m = ModelModel()
        models_not_in_loop = m.getByInTheLoopStatus(in_the_loop=False)
        for model in models_not_in_loop:
            if (
                model.deployment_status == DeploymentStatusEnum.deployed
                or model.deployment_status == DeploymentStatusEnum.created
            ):

                try:
                    # Check if the endpoint has been used in the last hour
                    ep_to_analyze = self._find_obj(model.endpoint_name, "endpoint")

                    if ep_to_analyze is None:
                        continue

                    ep_describe = self.sm.describe_endpoint(
                        EndpointName=ep_to_analyze["EndpointName"]
                    )

                    metric_response = self.cw.get_metric_statistics(
                        Namespace="AWS/SageMaker",
                        MetricName="Invocations",
                        Dimensions=[
                            {
                                "Name": "EndpointName",
                                "Value": ep_to_analyze["EndpointName"],
                            },
                            {
                                "Name": "VariantName",
                                "Value": ep_describe["ProductionVariants"][0][
                                    "VariantName"
                                ],
                            },
                        ],
                        StartTime=datetime.utcnow()
                        - timedelta(hours=self.endpoint_last_used_cutoff),
                        EndTime=datetime.utcnow(),
                        Period=int(self.endpoint_last_used_cutoff * 60 * 60),
                        Statistics=["Sum"],
                        Unit="None",
                    )

                    if (
                        len(metric_response["Datapoints"]) <= 0
                        or metric_response["Datapoints"][0]["Sum"] <= 0.0
                    ):

                        if self._dont_touch_endpoint(model.endpoint_name):
                            continue

                        self.endpoints_deleted.append(model.endpoint_name)
                        if self.test_run:
                            continue

                        self._delete_from_aws(model.endpoint_name)

                        # Update status to show that model endpoint was deleted
                        m.update(
                            model.id,
                            deployment_status=DeploymentStatusEnum.takendownnonactive,
                        )

                except Exception as e:
                    print(f"Ran into exception when analyzing model {model.name}")
                    print(traceback.format_exc())
                    print(e)

    def delete_non_prod_model_endpoints(self):
        m = ModelModel()
        endpoint_response = self.sm.list_endpoints(
            SortBy="Name",
            MaxResults=100,
        )

        endpoints = endpoint_response["Endpoints"]
        while "NextToken" in endpoint_response:
            next_token = endpoint_response["NextToken"]
            endpoint_response = self.sm.list_endpoints(
                SortBy="Name", MaxResults=100, NextToken=next_token
            )

            endpoints += endpoint_response["Endpoints"]

        for ep in endpoints:

            try:
                ep_name = ep["EndpointName"]

                models_with_endpoint_name = m.getByDeployedAndEndpointName(
                    endpoint_name=ep_name
                )

                # If the endpoints do not correspond to any model in the DB
                if len(models_with_endpoint_name) < 1:

                    if self._dont_touch_endpoint(ep_name):
                        continue

                    self.endpoints_deleted.append(ep_name)
                    if self.test_run:
                        continue

                    self._delete_from_aws(ep_name)

                    # We don't update any model status here,
                    # because by definition there is no
                    # model in the DB to associate with this endpoint

            except Exception as e:
                print(f"Ran into exception when deleting endpoint {ep_name}")
                print(traceback.format_exc())
                print(e)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--region",
        type=str,
        default="us-west-1",
        help=("Region to use when creating AWS session."),
    )
    parser.add_argument(
        "--endpoint_last_used_cutoff",
        type=int,
        default=72,
        help=(
            "One of the functions of this script is to delete models whose"
            " been used in a while. How long this cutoff is defined by"
            " `endpoint_last_used_cutoff` (in hours). For example, setting"
            " this flag to 1 will delete all endpoints that have not been"
            " in the last hour."
        ),
    )

    # You cannot use `test_run` and `real_run` at the same time
    feature_parser = parser.add_mutually_exclusive_group(required=False)
    feature_parser.add_argument("--test_run", dest="test_run", action="store_true")
    feature_parser.add_argument("--real_run", dest="test_run", action="store_false")
    parser.set_defaults(test_run=True)
    args = parser.parse_args()

    return args


def main():
    args = parse_args()

    if not args.test_run:
        ops = input(
            f"You've chosen to actually delete prod endpoints "
            "(via flag `--real_run`),"
            " are you sure? [y/n]"
        )
        if ops.lower() not in ("y", "yes"):
            print(f"Aborting takedown script")
            exit(1)

    # Parse the DONT_TOUCH_MODELS
    endpoints_name_not_touch = None
    with open("cron/DONT_TOUCH_ENDPOINTS.txt") as f:
        endpoints_name_not_touch = [t.strip() for t in f.readlines()]

    ops = input(
        "You've chosen not to touch endpoints with names: "
        + ", ".join(endpoints_name_not_touch)
        + "\nPlease make sure any additional endpoints you do not want delete are "
        "added in cron/DONT_TOUCH_ENDPOINTS.txt. Continue? [y/n]"
    )
    if ops.lower() not in ("y", "yes"):
        print(f"Aborting takedown script")
        exit(1)

    model_pruner = ModelPruner(
        args.region,
        args.endpoint_last_used_cutoff,
        args.test_run,
        endpoints_name_not_touch,
    )
    model_pruner.delete_models_not_in_the_loop()
    model_pruner.delete_non_prod_model_endpoints()

    print("Endpoints deleted:")
    print(model_pruner.endpoints_deleted)
    print(f"# Endpoints deleted is: {len(model_pruner.endpoints_deleted)}")


if __name__ == "__main__":
    main()
