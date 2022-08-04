# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.

import json
import pickle
import sys
import time

import boto3
import uuid

from build_config import build_config
from utils.deployer import ModelDeployer
from utils.helpers import load_queue_dump
from utils.logging import init_logger, logger


sys.path.append("../api")  # noqa
import common.mail_service as mail  # isort:skip
from infrastructure.email.mail_service import Email


from common.config import config  # noqa isort:skip
from models.model import DeploymentStatusEnum, ModelModel  # isort:skip
from models.notification import NotificationModel  # isort:skip

if __name__ == "__main__":
    init_logger("builder")
    logger.info("Start build server")
    sqs = boto3.resource(
        "sqs",
        aws_access_key_id=build_config["aws_access_key_id"],
        aws_secret_access_key=build_config["aws_secret_access_key"],
        region_name=build_config["aws_region"],
    )
    queue = sqs.get_queue_by_name(QueueName=config["builder_sqs_queue"])
    eval_queue = sqs.get_queue_by_name(QueueName=config["evaluation_sqs_queue"])
    redeployment_queue = load_queue_dump(build_config["queue_dump"], logger=logger)
    if redeployment_queue:
        for msg in redeployment_queue:  # ask for redeployment
            queue.send_message(MessageBody=json.dumps(msg))
        redeployment_queue = []

    mail_session = None
    if "smtp_user" in config and config["smtp_user"] != "":
        mail_session = mail.get_mail_session(
            host=config["smtp_host"],
            port=config["smtp_port"],
            smtp_user=config["smtp_user"],
            smtp_secret=config["smtp_secret"],
        )
    if not mail_session:
        logger.warning(
            "Couldn't setup the mail server, will not send mails on build failures !"
        )

    while True:
        for message in queue.receive_messages():
            msg = json.loads(message.body)
            logger.info(f"Build server received SQS message {msg}")
            if set(msg.keys()) <= {"model_id", "s3_uri", "endpoint_only"}:
                model_id = msg["model_id"]
                s3_uri = msg["s3_uri"]
                endpoint_only = msg.get("endpoint_only", False)

                m = ModelModel()
                model = m.getUnpublishedModelByMid(model_id)

                if (
                    model.deployment_status == DeploymentStatusEnum.uploaded
                    or model.deployment_status
                    == DeploymentStatusEnum.takendownnonactive
                ):
                    # deploy model
                    logger.info(f"Start to deploy model {model_id}")
                    m.update(
                        model_id, deployment_status=DeploymentStatusEnum.processing
                    )
                    deployer = ModelDeployer(model)
                    response = deployer.deploy(s3_uri, endpoint_only=endpoint_only)

                    # process deployment result
                    msg["name"] = model.name
                    msg["exception"] = response["ex_msg"]
                    # TODO: BE, make this code block more elegant
                    if response["status"] == "delayed":
                        redeployment_queue.append(msg)
                        pickle.dump(
                            redeployment_queue, open(build_config["queue_dump"], "wb")
                        )
                        m.update(
                            model_id, deployment_status=DeploymentStatusEnum.uploaded
                        )
                        subject = f"Model {model.name} deployment delayed"
                        template = "model_deployment_fail"
                    elif response["status"] == "failed":
                        m.update(
                            model_id, deployment_status=DeploymentStatusEnum.failed
                        )
                        subject = f"Model {model.name} deployment failed"
                        template = "model_deployment_fail"
                    elif (
                        response["status"] == "deployed"
                        or response["status"] == "created"
                    ):
                        if response["status"] == "deployed":
                            m.update(
                                model_id,
                                deployment_status=DeploymentStatusEnum.deployed,
                            )
                        else:
                            m.update(
                                model_id, deployment_status=DeploymentStatusEnum.created
                            )
                        subject = f"Model {model.name} deployment successful"
                        template = "model_deployment_successful"
                        eval_message = {
                            "model_id": model_id,
                            "eval_server_id": model.task.eval_server_id,
                        }
                        eval_queue.send_message(MessageBody=json.dumps(eval_message))

                    # send email
                    if mail_session:
                        _, user = m.getModelUserByMid(model_id)

                        Email().send(
                            contact=user.email,
                            cc_contact="dynabench-site@mlcommons.org",
                            template_name=f"{template}.txt",
                            msg_dict=msg,
                            subject=subject,
                        )

                        nm = NotificationModel()
                        nm.create(user.id, "MODEL_DEPLOYMENT_STATUS", template.upper())
                elif model.deployment_status == DeploymentStatusEnum.failed:
                    logger.info(f"Clean up failed model {model.endpoint_name}")
                    deployer = ModelDeployer(model)
                    deployer.cleanup_on_failure(s3_uri)
                    m.update(model_id, deployment_status=DeploymentStatusEnum.takendown)
            queue.delete_messages(
                Entries=[
                    {"Id": str(uuid.uuid4()), "ReceiptHandle": message.receipt_handle}
                ]
            )
        time.sleep(5)
