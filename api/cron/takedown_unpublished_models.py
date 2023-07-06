# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This script will take down all unpublished models from sagemaker
# These models can be redeployed by sending a message to the build
# server, for example:
# {"model_id": MODEL_ID, "s3_uri": s3_PATH_TO_SAVED_MODEL}
import argparse
import traceback

from models.model import DeploymentStatusEnum, ModelModel
from models.task import TaskModel


from builder.utils.deployer import ModelDeployer  # # noqa isort:skip


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--task_code",
        type=str,
        default="",
        help=(
            "The script will take down all unpublished model endpoints for every task."
            "Here, you can additionally specify a task where you want to take down"
            "all published model endpoints as well."
        ),
    )
    args = parser.parse_args()

    return args


def main():
    args = parse_args()
    m = ModelModel()

    # Takedown all unpublished models
    models_to_takedown = set(m.getByPublishStatus(publish_status=False))

    if args.task_code.strip() != "":
        ops = input(
            f"Take down all model endpoints associated with task code {args.task_code},"
            "including published models? [y/n]"
        )
        if ops.lower() not in ("y", "yes"):
            print(f"Aborting takedown script")
            exit(1)

        tm = TaskModel()
        task = tm.getByTaskCode(args.task_code)
        task_code_models = set(m.getByTid(task.id))
        models_to_takedown = models_to_takedown.union(task_code_models)

    for model in models_to_takedown:
        if (
            model.deployment_status == DeploymentStatusEnum.deployed
            or model.deployment_status == DeploymentStatusEnum.created
        ):
            print(f"Removing model: {model.name} at endpoint {model.endpoint_name}")
            try:
                deployer = ModelDeployer(model)
                deployer.delete_existing_endpoints(
                    sort_order="Descending", max_results=10
                )

                # Update the model to have status `taken_down`
                m.update(
                    model.id, deployment_status=DeploymentStatusEnum.takendownnonactive
                )

                # Note that we keep the model on s3, so that we can
                # redeploy the model whenever we want

            except Exception as e:
                print(f"Ran into exception when taking down model {model.name}")
                print(traceback.format_exc())
                print(e)


if __name__ == "__main__":
    main()
