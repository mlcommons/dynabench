#!/usr/bin/env python3

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import sys

import boto3
import bottle

from common.config import config
from common.cors import *  # noqa
from common.helpers import check_fields, is_fields_blank
from common.logging import init_logger
from common.mail_service import get_mail_session
from common.migrator import run_migrations
from controllers.auth import *  # noqa
from controllers.badges import *  # noqa
from controllers.contexts import *  # noqa
from controllers.datasets import *  # noqa
from controllers.endpoints import *  # noqa
from controllers.examples import *  # noqa
from controllers.index import *  # noqa
from controllers.models import *  # noqa
from controllers.notifications import *  # noqa
from controllers.task_proposals import *  # noqa
from controllers.tasks import *  # noqa
from controllers.users import *  # noqa
from controllers.validations import *  # noqa


assert len(sys.argv) == 2, "Missing arg (prod or dev?)"
assert sys.argv[1] in ["prod", "dev"], "Unknown running mode"

running_mode = sys.argv[1]


init_logger(running_mode)


# Run migration only for the parent
if not os.environ.get("BOTTLE_CHILD", False):
    run_migrations()

app = bottle.default_app()
for k in [
    "jwtsecret",
    "jwtexp",
    "trial_jwtexp",
    "jwtalgo",
    "cookie_secret",
    "refreshexp",
    "smtp_from_email_address",
    "smtp_host",
    "smtp_port",
    "smtp_secret",
    "smtp_user",
    "email_sender_name",
    "aws_s3_bucket_name",
    "aws_s3_profile_base_url",
    "profile_img_max_size",
]:
    app.config[k] = config[k]

# set up mail service
if "smtp_user" in config and config["smtp_user"] != "":
    mail = get_mail_session(
        host=config["smtp_host"],
        port=config["smtp_port"],
        smtp_user=config["smtp_user"],
        smtp_secret=config["smtp_secret"],
    )
    app.config["mail"] = mail

# initialize sagemaker endpoint if set
if "aws_access_key_id" in config and config["aws_access_key_id"] != "":
    sagemaker_client = boto3.client(
        "runtime.sagemaker",
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    app.config["sagemaker_client"] = sagemaker_client

    # setup s3 service for profile picture upload
    s3_service = boto3.client(
        "s3",
        aws_access_key_id=config["aws_access_key_id"],
        aws_secret_access_key=config["aws_secret_access_key"],
        region_name=config["aws_region"],
    )
    app.config["s3_service"] = s3_service


if running_mode == "dev":
    """
    if not check_fields(
        config, ["ssl_cert_file_path", "ssl_org_pem_file_path"]
    ) or is_fields_blank(config, ["ssl_cert_file_path", "ssl_org_pem_file_path"]):
        raise AssertionError("Configure SSL certificates detail")
    """
    app.config["mode"] = "dev"
    bottle.run(
        host="0.0.0.0",
        port=8081,
        debug=True,
        server="cheroot",
        reloader=True,
        timeout=60,
    )
elif running_mode == "prod":

    # Assertion for necessary configuration
    if not check_fields(
        config, ["smtp_user", "smtp_host", "smtp_port", "smtp_secret"]
    ) or is_fields_blank(
        config, ["smtp_user", "smtp_host", "smtp_port", "smtp_secret"]
    ):
        raise AssertionError("Config SMTP server detail")

    if not check_fields(
        config,
        [
            "aws_access_key_id",
            "aws_secret_access_key",
            "aws_region",
            "aws_s3_bucket_name",
        ],
    ) or is_fields_blank(
        config,
        [
            "aws_access_key_id",
            "aws_secret_access_key",
            "aws_region",
            "aws_s3_bucket_name",
        ],
    ):
        raise AssertionError("Config AWS service detail")

    app.config["mode"] = "prod"
    bottle.run(
        host="0.0.0.0", port=8080, debug=True, server="cheroot", timeout=60
    )  # , certfile='', keyfile=''
