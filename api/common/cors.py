# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import urllib

import bottle


# Add Access-Control-Allow-Origin for turk endpoints OPTIONS
@bottle.route("/contexts/<tid:int>/<rid:int>", method="OPTIONS")
@bottle.route("/contexts/<tid:int>/<rid:int>/min", method="OPTIONS")
@bottle.route("/contexts/<tid:int>/<rid:int>/uniform", method="OPTIONS")
@bottle.route("/contexts/<tid:int>/<rid:int>/least_fooled", method="OPTIONS")
@bottle.route("/contexts/<tid:int>/<rid:int>/validation_failed", method="OPTIONS")
@bottle.route("/examples/<tid:int>/<rid:int>", method="OPTIONS")
@bottle.route("/examples/<eid:int>", method="OPTIONS")
@bottle.route("/examples", method="OPTIONS")
@bottle.route("/tasks/<task_id_or_code>", method="OPTIONS")
@bottle.route("/tasks/admin_or_owner/<tid:int>", method="OPTIONS")
@bottle.route("/validations/<eid:int>", method="OPTIONS")
def turk_preflight(**args):
    bottle.default_app()
    bottle.response.headers["Access-Control-Allow-Origin"] = "*"
    add_cors_headers()


@bottle.route("/<:re:.*>", method="OPTIONS")
def enable_cors_generic_route():
    add_cors_headers()


@bottle.hook("after_request")
def enable_cors_after_request_hook():
    add_cors_headers()


def add_cors_headers():
    mode = bottle.default_app().config["mode"]
    valid_hostnames = []
    if mode == "prod":
        valid_hostnames = [
            "dynabench.org",
            "dev.dynabench.org",
            "www.dynabench.org",
            "beta.dynabench.org",
            "api.dynabench.org",
            "dynabench.mlcommons.org",
            "api-prod.dynabench.org",
            "api-dev.dynabench.org",
        ]
    else:
        valid_hostnames = ["localhost"]

    parsed_origin_url = urllib.parse.urlparse(bottle.request.get_header("origin"))
    req_from_known_hostname = (
        hasattr(parsed_origin_url, "hostname")
        and parsed_origin_url.hostname is not None
        and (parsed_origin_url.hostname in valid_hostnames)
    )

    if req_from_known_hostname:
        origin = bottle.request.get_header("origin")
    else:
        origin = "https://dynabench.org"

    bottle.default_app()

    if (req_from_known_hostname) or (
        "Access-Control-Allow-Origin" not in bottle.response.headers
    ):
        bottle.response.headers["Access-Control-Allow-Origin"] = origin

    bottle.response.headers[
        "Access-Control-Allow-Methods"
    ] = "GET, POST, PUT, DELETE, OPTIONS"
    bottle.response.headers[
        "Access-Control-Allow-Headers"
    ] = "Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, Authorization"
    bottle.response.headers["Access-Control-Allow-Credentials"] = "true"
    bottle.response.headers["Vary"] = "Origin"


@bottle.hook("after_request")
def add_safety_headers():
    bottle.response.headers["X-Frame-Options"] = "deny"
