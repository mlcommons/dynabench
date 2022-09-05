# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import secrets
import urllib
from datetime import datetime, timedelta

import boto3
import bottle
import uuid
from infrastructure.email.mail_service import Email

import common.auth as _auth
import common.helpers as util
from common.config import config as config_file
from common.logging import logger
from models.badge import BadgeModel
from models.leaderboard_configuration import LeaderboardConfigurationModel
from models.leaderboard_snapshot import LeaderboardSnapshotModel
from models.model import ModelModel
from models.notification import NotificationModel
from models.refresh_token import RefreshTokenModel
from models.task import TaskModel
from models.task_user_permission import TaskUserPermissionModel
from models.user import UserModel


@bottle.get("/users/<id:int>")
@_auth.requires_auth
def get_user(credentials, id):
    um = UserModel()
    user = um.get(id)
    if not user:
        bottle.abort(404, "Not found")

    if id != credentials["id"]:
        # only copy some sub fields if this is not us
        nu, u = {}, user.to_dict()
        for f in [
            "id",
            "username",
            "affiliation",
            "examples_submitted",
            "total_fooled",
            "total_verified_fooled",
            "total_verified_not_correct_fooled",
            "total_retracted",
            "avatar_url",
        ]:
            nu[f] = u[f]
        return util.json_encode(nu)
    else:
        user_dict = user.to_dict()
        user_dict["task_permissions"] = [
            task_permission.to_dict() for task_permission in user.task_permissions
        ]
        return util.json_encode(user_dict)


@bottle.get("/users/<id:int>/badges")
@_auth.requires_auth
def get_user_with_badges(credentials, id):
    um = UserModel()
    user = um.get(id)
    if not user:
        bottle.abort(404, "Not found")

    if id != credentials["id"]:
        # only copy some sub fields if this is not us
        nu, u = {}, user.to_dict()
        for f in [
            "id",
            "username",
            "affiliation",
            "examples_submitted",
            "total_fooled",
            "total_verified_fooled",
            "total_verified_not_correct_fooled",
            "total_retracted",
            "avatar_url",
        ]:
            nu[f] = u[f]

        bm = BadgeModel()
        badges = bm.getByUid(id)
        if badges:
            nu["badges"] = [b.to_dict() for b in badges]

        return util.json_encode(nu)
    else:
        user_dict = user.to_dict()
        user_dict["task_permissions"] = [
            task_permission.to_dict() for task_permission in user.task_permissions
        ]
        bm = BadgeModel()
        badges = bm.getByUid(id)
        if badges:
            user_dict["badges"] = [b.to_dict() for b in badges]

        return util.json_encode(user_dict)


@bottle.post("/users")
def create_user():
    u = UserModel()
    bm = BadgeModel()
    nm = NotificationModel()
    data = bottle.request.json
    if (
        not data
        or "email" not in data
        or "password" not in data
        or "username" not in data
    ):
        logger.info("Missing data")
        bottle.abort(400, "Missing data")
    if u.exists(email=data["email"]):
        logger.info("Email already exists")
        bottle.abort(409, "Email already exists")
    elif u.exists(username=data["username"]):
        logger.info("Username already exists")
        bottle.abort(409, "Username already exists")

    try:
        u.create(
            email=data["email"], password=data["password"], username=data["username"]
        )
        user = u.getByEmail(data["email"])
        user_dict = user.to_dict()
        refresh_token = _auth.set_refresh_token()
        rtm = RefreshTokenModel()
        rtm.create(user.id, refresh_token)
        bm.addBadge({"uid": user_dict["id"], "name": "WELCOME_NOOB"})
        nm.create(user_dict["id"], "NEW_BADGE_EARNED", "WELCOME_NOOB")

    except Exception as error_message:
        logger.info("Could not create user: %s" % (error_message))
        bottle.abort(400, "Could not create user")

    token = _auth.get_token({"id": user_dict["id"], "username": user_dict["username"]})
    logger.info(
        "Registration and authentication successful for %s" % (user_dict["username"])
    )
    return {"user": user_dict, "token": token}


@bottle.post("/recover/resolve/<forgot_token>")
def reset_password(forgot_token):
    """
    Validate forgot password token and update new password in user
    In token validation we used the forgot password token expiry date and time column
    :param forgot_token:
    :return: Success or Error
    """

    data = bottle.request.json
    if not data or "password" not in data or "email" not in data:
        logger.info("Missing data")
        bottle.abort(400, "Missing data")
    try:
        u = UserModel()
        user = u.getByForgotPasswordToken(forgot_password_token=forgot_token)
        if not user:
            raise AssertionError("Invalid token")
        if datetime.now() > user.forgot_password_token_expiry_date:
            raise AssertionError("Invalid token")
        if user.email != data["email"]:
            raise AssertionError("Invalid user")

        user.set_password(data["password"])
        u.update(
            user.id,
            {
                "forgot_password_token": None,
                "forgot_password_token_expiry_date": None,
                "password": user.password,
            },
        )
    except AssertionError as e:
        logger.exception("Invalid token : %s" % (e))
        bottle.abort(401, str(e))
    except Exception as error_message:
        logger.exception("Could not reset user password: %s" % (error_message))
        bottle.abort(400, "Could not reset user password")

    logger.info("User password reset successful for %s" % (user.username))
    return {"status": "success"}


@bottle.post("/recover/initiate")
def recover_password():
    """
    Generate forgot password token and send email to respective user
    The reset password host reads from  requested url
    :return: Success if true else raise exception
    """

    # only allow sending recover password emails from certain domains
    parsed_origin_url = urllib.parse.urlparse(bottle.request.get_header("origin"))
    if (bottle.default_app().config["mode"] == "prod") and not (
        (hasattr(parsed_origin_url, "hostname"))
        and (parsed_origin_url.hostname is not None)
        and (
            parsed_origin_url.hostname
            in [
                "dynabench.org",
                "dev.dynabench.org",
                "www.dynabench.org",
                "beta.dynabench.org",
                "api.dynabench.org",
            ]
        )
    ):
        bottle.abort(403, "Invalid recover password attempt")

    data = bottle.request.json
    if not data or "email" not in data:
        bottle.abort(400, "Missing email")

    u = UserModel()
    user = u.getByEmail(email=data["email"])
    if not user:
        return {"status": "success"}
    try:
        # issuing new forgot password token
        forgot_password_token = u.generate_password_reset_token()
        expiry_datetime = datetime.now() + timedelta(hours=4)
        u.update(
            user.id,
            {
                "forgot_password_token": forgot_password_token,
                "forgot_password_token_expiry_date": expiry_datetime,
            },
        )

        #  send email
        subject = "Password Reset Request"
        msg = {
            "ui_server_host": util.parse_url(bottle.request.url),
            "token": forgot_password_token,
        }

        Email().send(
            contact=user.email,
            template_name="forgot_password.txt",
            msg_dict=msg,
            subject=subject,
        )

        return {"status": "success"}
    except Exception as error_message:
        logger.exception(
            "Reset password failure ({}): ({})".format(data["email"], error_message)
        )
        bottle.abort(403, "Reset password failed")


@bottle.get("/users/<uid:int>/forks")
@_auth.requires_auth
def get_user_forks(credentials, uid):

    if not util.is_current_user(uid=uid, credentials=credentials):
        logger.error("Not authorized to view forks")
        bottle.abort(403, "Not authorized to view forks")

    limit, offset = util.get_limit_and_offset_from_request()
    lcm = LeaderboardConfigurationModel()

    results, total_count = lcm.getUserForksByUid(uid, limit=limit, offset=offset)
    dicts = [fork_obj.to_dict() for fork_obj in results]
    if dicts:
        return util.json_encode({"count": total_count, "data": dicts})
    return util.json_encode({"count": 0, "data": []})


@bottle.get("/users/<uid:int>/snapshots")
@_auth.requires_auth
def get_user_snapshots(credentials, uid):

    if not util.is_current_user(uid=uid, credentials=credentials):
        logger.error("Not authorized to view snapshots")
        bottle.abort(403, "Not authorized to view snapshots")

    limit, offset = util.get_limit_and_offset_from_request()
    lsm = LeaderboardSnapshotModel()

    results, total_count = lsm.getUserSnapshotsByUid(uid, limit=limit, offset=offset)
    dicts = [snapshot_obj.to_dict() for snapshot_obj in results]
    if dicts:
        return util.json_encode({"count": total_count, "data": dicts})
    return util.json_encode({"count": 0, "data": []})


@bottle.get("/users/<uid:int>/models")
def get_user_models(uid):
    """
    Fetch all user models based on user id
    :param uid:
    :return: Json Object
    """
    # check the current user and request user id are same
    is_current_user = util.is_current_user(uid=uid)
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        model = ModelModel()
        results, total_count = model.getUserModelsByUid(
            uid=uid, is_current_user=is_current_user, n=limit, offset=offset
        )
        dicts = [model_obj.to_dict() for model_obj in results]
        if dicts:
            return util.json_encode({"count": total_count, "data": dicts})
        return util.json_encode({"count": 0, "data": []})
    except Exception as e:
        logger.exception("Could not fetch user model(s) : %s" % (e))
        bottle.abort(400, "Could not fetch user model(s)")


@bottle.get("/users/<uid:int>/tasks")
def get_user_tasks(uid):
    """
    Fetch all user-owned tasks based on user id
    :param uid:
    :return: Json Object
    """
    # check the current user and request user id are same
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        tupm = TaskUserPermissionModel()
        results, total_count = tupm.getByOwnerUid(uid, n=limit, offset=offset)
        dicts = [task_obj.to_dict() for task_obj in results]
        if dicts:
            return util.json_encode({"count": total_count, "data": dicts})
        return util.json_encode({"count": 0, "data": []})
    except Exception as e:
        logger.exception("Could not fetch user task(s) : %s" % (e))
        bottle.abort(400, "Could not fetch user task(s)")


@bottle.get("/users/<uid:int>/models/<model_id:int>")
def get_user_model(uid, model_id):
    """
    Get users specific model detail
    :param uid: User Id
    :param model_id: Model Id
    :return: Json Object
    """
    # check the current user and request user id are same
    is_current_user = util.is_current_user(uid=uid)
    logger.info(f"Current user validation status ({is_current_user}) for {uid}")
    try:
        model = ModelModel()
        model_obj = model.getUserModelsByUidAndMid(
            uid=uid, mid=model_id, is_current_user=is_current_user
        )
        dicts = model_obj.to_dict()
        if dicts:
            return util.json_encode(dicts)
    except Exception as e:
        logger.exception("Could not fetch user model: %s" % (e))
        bottle.abort(400, "Could not fetch user model")

    bottle.abort(204, "No models found")


@bottle.put("/users/<id:int>")
@_auth.requires_auth
def update_user_profile(credentials, id):
    """
    Update user profile details
    :param credentials: Authentication detail
    :param id: User id
    :return: Json Object
    """
    data = bottle.request.json
    u = UserModel()

    # validate user detail
    if not util.is_current_user(uid=id, credentials=credentials):
        logger.error("Not authorized to update profile")
        bottle.abort(403, "Not authorized to update profile")

    user = u.get(id)
    if not user:
        logger.error("User does not exist (%s)" % id)
        bottle.abort(404, "User not found")

    if "username" in data:
        existing = u.getByUsername(data["username"])
        if existing and user.id != existing.id:
            logger.error("Username already exists (%s)" % data["username"])
            bottle.abort(409, "Username already exists")

    update_dict = {}
    updatable_fields = ["username", "affiliation", "realname", "settings_json"]
    for field in updatable_fields:
        if field in data:
            update_dict[field] = data[field]

    try:
        u.update(user.id, update_dict)
        return util.json_encode(user.to_dict())
    except Exception as ex:
        logger.exception("Could not update user fields: %s" % (ex))
        bottle.abort(400, "Could not update user fields")


@bottle.post("/users/<id:int>/avatar/upload")
@_auth.requires_auth
def upload_user_profile_picture(credentials, id):
    """
    Update user profile details like  real name, affiliation  and user name
    :param credentials: Authentication detail
    :param id: User id
    :return: Json Object
    """

    u = UserModel()
    upload = bottle.request.files.get("file")
    app = bottle.default_app()
    s3_service = app.config["s3_service"]
    file_name, ext = os.path.splitext(upload.filename)

    # validating file extension
    if ext not in (".png", ".jpg", ".jpeg"):
        bottle.abort(400, "File extension not allowed.")
    # validate user detail
    if not util.is_current_user(uid=id, credentials=credentials):
        bottle.abort(403, "Not authorized to update profile")

    user = u.get(id)
    if not user:
        bottle.abort(403, "Not authorized to update profile picture")

    try:
        # validate and read the file
        img_byte_str = util.read_file_content(
            upload.file, app.config["profile_img_max_size"]
        )

        # upload new avatar picture with new uuid into s3 bucket
        file_name = str(uuid.uuid4()) + ext
        response = s3_service.put_object(
            Body=img_byte_str,
            Bucket=app.config["aws_s3_bucket_name"],
            Key="profile/" + file_name,
            ACL="public-read",
            ContentType=upload.content_type,
        )
        if response["ResponseMetadata"]["HTTPStatusCode"] == 200:
            # removing old avatar picture from s3 bucket
            pic_url = user.avatar_url
            if pic_url and pic_url != "":
                s3_service.delete_object(
                    Bucket=app.config["aws_s3_bucket_name"],
                    Key="profile/" + pic_url.split("/")[-1],
                )
            # update avatar s3 ur in user object
            base_url = app.config["aws_s3_profile_base_url"] + "/profile/" + file_name
            u.update(user.id, {"avatar_url": base_url})
            return util.json_encode(user.to_dict())
        else:
            raise Exception("Avatar S3 upload failed")
    except AssertionError as ex:
        bottle.abort(413, str(ex))
    except Exception as ex:
        logger.exception("Could not upload user profile picture: %s" % (ex))
        bottle.abort(400, "Could not upload user profile picture")


@bottle.post("/users/model/upload")
@_auth.requires_auth
def model_upload_s3_dynalab_2(credentials):
    upload = bottle.request.files.get("file")
    model_name = bottle.request.forms.get("model_name")
    description = bottle.request.forms.get("description")
    num_paramaters = bottle.request.forms.get("num_paramaters")
    languages = bottle.request.forms.get("languages")
    license = bottle.request.forms.get("license")
    file_name = bottle.request.forms.get("file_name")
    file_type = bottle.request.forms.get("file_type")
    user_name = bottle.request.forms.get("user_name")
    user_id = bottle.request.forms.get("user_id")
    task_code = bottle.request.forms.get("task_code")

    task_model = TaskModel()
    task = task_model.getByTaskCode(task_code)
    if not task:
        bottle.abort(404, "Task not found")
    if not task.submitable:
        bottle.abort(403, "Task not available for model submission")
    if file_type != "application/zip":
        bottle.abort(403, "It's not a zip file")

    session = boto3.Session(
        aws_access_key_id=config_file["aws_access_key_id"],
        aws_secret_access_key=config_file["aws_secret_access_key"],
        region_name=config_file["aws_region"],
    )
    s3_service = session.client("s3")
    sqs_service = session.client("sqs")

    response = s3_service.put_object(
        Body=upload.file,
        Bucket=config_file["aws_s3_bucket_name"],
        Key=f"models/{task_code}/{user_id}-{file_name}",
        ContentType=upload.content_type,
    )

    models = ModelModel()
    model, model_id = models.create(
        task_id=task.id,
        user_id=user_id,
        name=model_name,
        shortname="",
        longdesc=description,
        desc=description,
        languages=languages,
        license=license,
        params=num_paramaters,
        upload_datetime=datetime.now(),
        endpoint_name="",
        light_model="",
        deployment_status="uploaded",
        secret=secrets.token_hex(),
    )

    user_model = UserModel()
    user = user_model.get(user_id)
    user_model.incrementModelSubmitCount(user.to_dict()["id"])
    if task.is_decen_task:
        model_dict = models.to_dict(model)
        task_dict = models.to_dict(model.task)
        full_model_info = util.json_encode(model_dict)
        full_task_info = util.json_encode(task_dict)
        queue = sqs_service.get_queue_url(
            QueueName=config_file["new_builder_sqs_queue"]
        )
        queue = sqs_service.get_queue_by_name(
            QueueName=task.build_sqs_queue,
            QueueOwnerAWSAccountId=task.task_aws_account_id,
        )
        s3_name = f"s3://{task.s3_bucket}/models/{task_code}/{user_id}-{file_name}"
        queue.send_message(
            MessageBody=util.json_encode(
                {
                    "model_id": model_id,
                    "s3_uri": s3_name,
                    "decen_eaas": True,
                    "model_info": full_model_info,
                    "task_info": full_task_info,
                    "model_secret": model.secret,
                }
            )
        )
    else:
        queue = sqs_service.get_queue_url(
            QueueName=config_file["new_builder_sqs_queue"]
        )
        sqs_service.send_message(
            QueueUrl=queue["QueueUrl"],
            MessageBody=util.json_encode(
                {
                    "s3_uri": f"models/{task_code}/{user_id}-{file_name}",
                    "user_id": user_id,
                    "user_name": user_name,
                    "task_code": task_code,
                    "model_id": model_id,
                    "model_secret": model.secret,
                }
            ),
        )
    return response
