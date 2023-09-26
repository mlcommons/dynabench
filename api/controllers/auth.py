# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import secrets

import bottle
import requests

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.refresh_token import RefreshTokenModel
from models.user import UserModel


@bottle.post("/authenticate")
def authenticate():
    data = bottle.request.json
    if not data or "email" not in data or "password" not in data:
        bottle.abort(400, "Missing or bad credentials")
    email_provider = data["email"].split("@")[1]
    user_name = data["email"].split("@")[0]
    if any(provider in email_provider for provider in ["prolific", "amazonturk"]):
        requests.post(
            "http://127.0.0.1:8000/user/create_user",
            json={
                "email": data["email"],
                "password": data["password"],
                "username": user_name,
            },
        )
    try:
        u = UserModel()
        user = u.getByEmailAndPassword(data["email"], data["password"])
    except Exception as error_message:
        logger.exception("Authentication failure (%s)" % (data["email"]))
        bottle.abort(403, "Authentication failed: %s" % (error_message))

    if not user:
        logger.exception("Authentication failure (%s)" % (data["email"]))
        bottle.abort(403, "Authentication failed")

    # we logged in successfully, also update the refresh token
    token = _auth.get_token({"id": user.id, "username": user.username})
    refresh_token = _auth.set_refresh_token()
    rtm = RefreshTokenModel()
    rtm.create(user.id, refresh_token)

    logger.info("Authentication successful for %s" % (user.username))
    return util.json_encode({"user": user.to_dict(), "token": token})


@bottle.get("/authenticate/get_trial_token")
def get_trial_auth_token():
    token = _auth.get_token({"username": "temp_user"}, "trial_jwtexp")
    return util.json_encode({"token": token})


@bottle.get("/authenticate/refresh")
def refresh_auth():
    payload = _auth.get_expired_token_payload()
    refresh_token = _auth.get_refresh_token()
    logger.info("Received refresh token request with token")
    rtm = RefreshTokenModel()
    rt = rtm.getByToken(refresh_token)
    if rt:
        uid = rt.uid
    else:
        logger.info("Old refresh token not found")
        bottle.abort(403, "Access denied")
    um = UserModel()
    user = um.get(uid)
    if not user or user.id != payload["id"]:
        logger.info("User not found")
        bottle.abort(403, "Access denied")
    token = _auth.get_token(payload)
    # also issue new refresh token
    rtm.deleteByToken(refresh_token)
    refresh_token = _auth.set_refresh_token()
    rtm.create(user.id, refresh_token)
    return util.json_encode({"token": token})


@bottle.post("/authenticate/logout")
@_auth.requires_auth
def remove_refresh_token(credentials):
    refresh_token = _auth.get_refresh_token()
    rtm = RefreshTokenModel()
    rt = rtm.getByToken(refresh_token)
    if rt:
        uid = rt.uid
    else:
        logger.info("Old refresh token not found")
        bottle.abort(403, "Access denied")
    um = UserModel()
    user = um.get(uid)
    if not user or user.id != credentials["id"]:
        logger.info("This is not your token")
        bottle.abort(403, "Access denied")
    rtm.deleteByToken(refresh_token)
    return {"status": "success"}


@bottle.get("/authenticate/refresh_from_api")
def refresh_api_auth():
    api_token = bottle.request.query.get("api_token")
    logger.info(f"Received refresh api token request with token {api_token}")
    u = UserModel()
    user = u.getByAPIToken(api_token)
    token = _auth.get_token({"id": user.id, "username": user.username})
    # We don't update api_token because it is a long lived token.
    # and needs to be persistent
    return util.json_encode({"token": token})


@bottle.get("/authenticate/generate_api_token")
@_auth.requires_auth
def get_api_token(credentials):
    u = UserModel()
    user = u.get(credentials["id"])
    logger.info(f"Received generate api token request from user with id {user.id}")
    if user.api_token:
        api_token = user.api_token
        logger.info(
            f"Token already exists, won't regenerate for user with id {user.id}"
        )
    else:
        api_token = secrets.token_hex()
        u.update(user.id, {"api_token": api_token})

    return util.json_encode({"api_token": api_token})
