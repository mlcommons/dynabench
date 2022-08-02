# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from urllib.parse import parse_qs

import bottle
import yaml

import common.auth as _auth
import common.helpers as util
from common.logging import logger
from models.badge import BadgeModel
from models.context import ContextModel
from models.example import ExampleModel
from models.round import RoundModel
from models.round_user_example_info import RoundUserExampleInfoModel
from models.task import TaskModel, model_wrong_metrics
from models.user import UserModel


@bottle.get(
    "/examples/<tid:int>/<rid:int>/filtered/<min_num_flags:int>/"
    + "<max_num_flags:int>/<min_num_disagreements:int>/<max_num_disagreements:int>"
)
@_auth.requires_auth
def get_random_filtered_example(
    credentials,
    tid,
    rid,
    min_num_flags,
    max_num_flags,
    min_num_disagreements,
    max_num_disagreements,
):
    query_dict = parse_qs(bottle.request.query_string)
    tags = None
    if "tags" in query_dict and len(query_dict["tags"]) > 0:
        tags = query_dict["tags"][0].split("|")

    tm = TaskModel()
    task = tm.get(tid)
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    em = ExampleModel()
    example = em.getRandomFiltered(
        round.id,
        min_num_flags,
        max_num_flags,
        min_num_disagreements,
        max_num_disagreements,
        task.validate_non_fooling,
        n=1,
        tags=tags,
    )
    if not example:
        bottle.abort(500, f"No examples available ({round.id})")
    example = example[0].to_dict()
    return util.json_encode(example)


@bottle.get("/examples/<tid:int>/<rid:int>")
@_auth.requires_auth_or_turk
@_auth.turk_endpoint
def get_random_example(credentials, tid, rid):
    query_dict = parse_qs(bottle.request.query_string)
    tags = None
    if "tags" in query_dict and len(query_dict["tags"]) > 0:
        tags = query_dict["tags"][0].split("|")

    tm = TaskModel()
    task = tm.get(tid)
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    em = ExampleModel()
    if credentials["id"] != "turk":
        example = em.getRandomOptimized(
            round.id,
            task.validate_non_fooling,
            task.num_matching_validations,
            n=1,
            my_uid=credentials["id"],
            tags=tags,
        )
    else:
        curr_uid = None

        if "annotator_id" in query_dict and isinstance(
            query_dict["annotator_id"], list
        ):
            curr_uid = query_dict["annotator_id"][0]

        example = em.getRandom(
            round.id,
            task.validate_non_fooling,
            task.num_matching_validations,
            n=1,
            tags=tags,
            my_uid=curr_uid,
            turk=True,
        )
    if not example:
        bottle.abort(500, f"No examples available ({round.id})")
    example = example[0].to_dict()
    return util.json_encode(example)


@bottle.get("/examples/<eid:int>")
@_auth.requires_auth
def get_example(credentials, eid):
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, "Not found")
    if example.uid != credentials["id"]:
        bottle.abort(403, "Access denied")
    return util.json_encode(example.to_dict())


@bottle.get("/examples/<eid:int>/metadata")
@_auth.requires_auth
def get_example_metadata(credentials, eid):
    em = ExampleModel()
    example = em.get(eid)
    if not example:
        bottle.abort(404, "Not found")
    if example.uid != credentials["id"]:
        bottle.abort(403, "Access denied")
    return util.json_encode(example.metadata_json)


@bottle.put("/examples/<eid:int>")
@_auth.requires_auth_or_turk
@_auth.turk_endpoint
def update_example(credentials, eid):
    try:
        em = ExampleModel()
        example = em.get(eid)

        if not example:
            bottle.abort(404, "Not found")
        if credentials["id"] != "turk" and example.uid != credentials["id"]:
            bottle.abort(403, "Access denied")
        data = bottle.request.json
        if credentials["id"] == "turk":
            if not util.check_fields(data, ["uid"]):
                bottle.abort(400, "Missing data")
            metadata = util.json_decode(example.metadata_json)
            if (
                "annotator_id" not in metadata
                or metadata["annotator_id"] != data["uid"]
            ):
                bottle.abort(403, "Access denied")
            del data["uid"]  # don't store this

        for field in data:
            if field not in ("model_wrong", "flagged", "retracted", "metadata"):
                bottle.abort(
                    403, "Can only modify  model_wrong, retracted, and metadata"
                )

        if (
            "model_wrong" in data
            and data["model_wrong"] is True
            and example.model_wrong is False
        ):
            cm = ContextModel()
            rm = RoundModel()
            context = cm.get(example.cid)
            rm.updateLastActivity(context.r_realid)
            rm.incrementFooledCount(context.r_realid)
            if credentials["id"] != "turk":
                um = UserModel()
                info = RoundUserExampleInfoModel()
                um.incrementFooledCount(example.uid)
                info.incrementFooledCount(example.uid, context.r_realid)

        if "metadata" in data:
            cm = ContextModel()
            context = cm.get(example.cid)
            all_user_annotation_data = {}
            all_user_annotation_data.update(util.json_decode(context.context_json))
            all_user_annotation_data.update(util.json_decode(example.input_json))
            all_user_annotation_data.update(data["metadata"])
            verified, message = (
                TaskModel()
                .get(example.context.round.tid)
                .verify_annotation(all_user_annotation_data)
            )
            if not verified:
                bottle.abort(403, message)
            # Make sure to keep fields in the metadata_json from before if they aren't
            # in the new metadata_json
            if example.metadata_json is not None:
                for key, value in util.json_decode(example.metadata_json).items():
                    if key not in data["metadata"]:
                        data["metadata"][key] = value
            data["metadata_json"] = util.json_encode(data["metadata"])
            del data["metadata"]

        logger.info(f"Updating example {example.id} with {data}")
        em.update(example.id, data)

        if credentials["id"] != "turk":
            if "retracted" in data and data["retracted"] is True:
                um = UserModel()
                um.incrementRetractedCount(example.uid)
                if example.model_wrong:
                    um.incrementVerifiedNotCorrectFooledCount(example.uid)
                    info = RoundUserExampleInfoModel()
                    info.incrementVerifiedNotCorrectFooledCount(
                        example.uid, example.context.r_realid
                    )
        return util.json_encode({"success": "ok"})
    except Exception as e:
        logger.error(f"Error updating example {eid}: {e}")
        bottle.abort(500, {"error": str(e)})


@bottle.post("/examples/evaluate")
def evaluate_model_correctness():
    data = bottle.request.json

    if not util.check_fields(data, ["tid", "target", "output"]):
        bottle.abort(400, "Missing data")

    tm = TaskModel()
    task = tm.get(data["tid"])
    task_config = yaml.load(task.config_yaml, yaml.SafeLoader)
    model_wrong_metric = model_wrong_metrics[
        task_config.get("model_wrong_metric", {"type": "ask_user"})["type"]
    ]
    output_keys = set(map(lambda item: item["name"], task_config.get("output", [])))
    input_keys = set(map(lambda item: item["name"], task_config.get("input", [])))
    target_keys = input_keys.intersection(output_keys)
    pruned_target = {}
    pruned_output = {}
    for key, value in data["target"].items():
        if key in target_keys:
            pruned_target[key] = value
    for key, value in data["output"].items():
        if key in target_keys:
            pruned_output[key] = value

    model_wrong = model_wrong_metric(
        pruned_output, pruned_target, task_config.get("model_wrong_metric", {})
    )
    missing_keys = len(pruned_target.keys()) != len(target_keys) or len(
        pruned_output.keys()
    ) != len(target_keys)

    if missing_keys:
        bottle.abort(400, "Missing keys")

    return util.json_encode({"success": "ok", "model_wrong": model_wrong})


@bottle.post("/examples")
@_auth.requires_auth_or_turk
@_auth.turk_endpoint
def post_example(credentials):
    data = bottle.request.json
    if not util.check_fields(
        data,
        [
            "tid",
            "rid",
            "uid",
            "cid",
            "input",
            "output",
            "model_signature",
            "metadata",
            "model_endpoint_name",
            "model_wrong",
        ],
    ):
        bottle.abort(400, "Missing data")

    if credentials["id"] == "turk":
        if "annotator_id" not in data["metadata"]:
            bottle.abort(400, "Missing annotator data")
    elif int(data["uid"]) != credentials["id"]:
        bottle.abort(403, "Access denied")

    tag = None
    if "tag" in data:
        tag = data["tag"]

    em = ExampleModel()
    example = em.create(
        tid=data["tid"],
        rid=data["rid"],
        uid=data["uid"] if credentials["id"] != "turk" else "turk",
        cid=data["cid"],
        input=data["input"],
        output=data["output"],
        model_signature=data["model_signature"],
        metadata=data["metadata"],
        model_wrong=data["model_wrong"],
        tag=tag,
        model_endpoint_name=data["model_endpoint_name"],
    )
    if not example:
        bottle.abort(400, "Could not create example")

    rm = RoundModel()
    rm.incrementCollectedCount(data["tid"], data["rid"])
    cm = ContextModel()
    cm.incrementCountDate(data["cid"])
    context = cm.get(example.cid)
    rm.updateLastActivity(context.r_realid)
    if example.model_wrong:
        rm.incrementFooledCount(context.r_realid)

    if credentials["id"] != "turk":
        um = UserModel()
        info = RoundUserExampleInfoModel()
        info.incrementExamplesSubmittedCount(example.uid, context.r_realid)
        if example.model_wrong:
            um.incrementFooledCount(example.uid)
            info.incrementFooledCount(example.uid, context.r_realid)

        bm = BadgeModel()
        user = um.get(credentials["id"])
        badge_names = bm.handleCreateInterface(user, em.get(example.id))

    return util.json_encode(
        {
            "success": "ok",
            "id": example.id,
            "badges": "|".join(badge_names) if (credentials["id"] != "turk") else None,
        }
    )
