# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import secrets
from urllib.parse import parse_qs, quote

import bottle
import sqlalchemy as db
import uuid
import yaml
from infrastructure.email.mail_service import Email

import common.auth as _auth
import common.helpers as util
from common.config import config as config_env
from common.logging import logger
from models.context import Context
from models.dataset import Dataset, DatasetModel
from models.leaderboard_configuration import LeaderboardConfigurationModel
from models.leaderboard_snapshot import LeaderboardSnapshotModel
from models.model import DeploymentStatusEnum, Model, ModelModel
from models.round import Round, RoundModel
from models.round_user_example_info import RoundUserExampleInfoModel
from models.score import ScoreModel
from models.task import Task, TaskModel
from models.task_proposal import TaskProposal, TaskProposalModel
from models.task_user_permission import TaskUserPermission
from models.user import User, UserModel


@bottle.put("/tasks/process_proposal/<tpid:int>")
@_auth.requires_auth
def process_proposal(credentials, tpid):

    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        bottle.abort(403, "Access denied")

    data = bottle.request.json
    if not util.check_fields(data, ["accept"]):
        bottle.abort(400, "Missing data")

    tpm = TaskProposalModel()
    tp = tpm.get(tpid)
    tp_creator = um.get(tp.uid)
    tp_creator_email = tp_creator.email

    if data["accept"]:
        t = Task(
            task_code=tp.task_code,
            name=tp.name,
            desc=tp.desc,
            config_yaml="""
aggregation_metric:
  type: dynascore
context:
- name: context
  placeholder: Enter context...
  type: string
delta_metrics:
- type: fairness
- type: robustness
input:
- name: statement
  placeholder: Enter statement...
  type: string
- labels:
  - negative
  - positive
  - neutral
  name: label
  type: multiclass
  as_goal_message: true
metadata:
  create:
  - display_name: example explanation
    name: example_explanation
    placeholder: Explain why your example is correct...
    type: string
  - display_name: model explanation
    model_wrong_condition: false
    name: model_explanation_right
    placeholder: Explain why you thought the model would make a mistake...
    type: string
  - display_name: model explanation
    model_wrong_condition: true
    name: model_explanation_wrong
    placeholder: Explain why you think the model made a mistake...
    type: string
  validate:
  - labels:
    - negative
    - positive
    - entailed
    name: corrected_label
    placeholder: Enter corrected label
    type: multiclass
    validated_label_condition: incorrect
  - name: target_explanation
    placeholder: Explain why your proposed target is correct...
    type: string
    validated_label_condition: incorrect
  - name: flag_reason
    placeholder: Enter the reason for flagging...
    type: string
    validated_label_condition: flagged
  - name: validator_example_explanation
    placeholder: Explain why the example is correct...
    type: string
    validated_label_condition: correct
  - name: validator_model_explanation
    placeholder: Enter what you think was done to try to trick the model...
    type: string
model_wrong_metric:
  reference_names:
  - label
  type: exact_match
output:
- name: label
- name: prob
  reference_name: label
  type: prob
perf_metric:
  reference_name: label
  type: macro_f1
            """,
            cur_round=1,
            last_updated=db.sql.func.now(),
            s3_bucket=config_env["aws_s3_bucket_name"],
            context="min",
        )  # Annotation config is sentiment example.

        tpm.dbs.add(t)
        tpm.dbs.flush()
        logger.info("Added task (%s)" % (t.id))

        tup = TaskUserPermission(uid=tp.uid, type="owner", tid=t.id)
        tpm.dbs.add(tup)
        tpm.dbs.flush()
        logger.info("Added task owner")

        r = Round(tid=t.id, rid=1, secret=secrets.token_hex())

        tpm.dbs.add(r)
        tpm.dbs.flush()
        tpm.dbs.commit()
        logger.info("Added round (%s)" % (r.id))

        Email().send(
            contact=tp_creator_email,
            template_name="task_proposal_approval.txt",
            subject=f"Your Task Proposal has been Accepted",
        )

    else:
        msg = {
            "rejection_message": data["changes"],
        }
        Email().send(
            contact=tp_creator_email,
            template_name="task_proposal_rejection.txt",
            msg_dict=msg,
            subject=f"Your Task Proposal has been Rejected",
        )

    tpm.dbs.query(TaskProposal).filter(TaskProposal.id == tpid).delete()
    tpm.dbs.flush()
    tpm.dbs.commit()
    return util.json_encode({"success": "ok"})


@bottle.get("/tasks/owners/<tid:int>")
@_auth.requires_auth
def get_owners(credentials, tid):
    ensure_owner_or_admin(tid, credentials["id"])
    tm = TaskModel()
    tups = tm.dbs.query(TaskUserPermission).filter(
        db.and_(TaskUserPermission.type == "owner", TaskUserPermission.tid == tid)
    )
    um = UserModel()
    users = []
    for obj in tups:
        user = um.get(obj.uid)
        users.append({"id": user.id, "username": user.username})
    return util.json_encode(users)


def ensure_owner_or_admin(tid, uid):
    um = UserModel()
    user = um.get(uid)
    if not user.admin:
        if not (tid, "owner") in [
            (perm.tid, perm.type) for perm in user.task_permissions
        ]:
            bottle.abort(
                403, "Access denied (you are not an admin or owner of this task)"
            )


@bottle.post("/tasks/<tid:int>/convert_to_model_io")
def convert_to_model_io(tid):
    data = bottle.request.json
    tm = TaskModel()
    task = tm.get(tid)
    return util.json_encode(task.convert_to_model_io(data))


@bottle.get("/tasks/get_all_rounds/<tid:int>")
@_auth.requires_auth
def get_all_rounds(credentials, tid):
    ensure_owner_or_admin(tid, credentials["id"])
    rm = RoundModel()
    r_dicts = []
    for r in rm.getByTid(tid):
        r_dicts.append(r.to_dict())
    r_dicts.sort(key=lambda r: r["rid"])
    return util.json_encode(r_dicts)


@bottle.get("/tasks/datasets/<tid:int>")
@_auth.requires_auth
def get_datasets(credentials, tid):
    dm = DatasetModel()
    dataset_list = []
    datasets = dm.getByTid(tid)
    if datasets:
        for dataset in datasets:
            dataset_list.append(dataset.to_dict())

    return util.json_encode(dataset_list)


@bottle.get("/tasks/admin_or_owner/<tid:int>")
@_auth.requires_auth_or_turk
@_auth.turk_endpoint
def get_admin_or_owner(credentials, tid):
    if credentials["id"] == "turk":
        return util.json_encode({"admin_or_owner": False})

    um = UserModel()
    user = um.get(credentials["id"])
    admin_or_owner = True
    if not user.admin:
        if not (tid, "owner") in [
            (perm.tid, perm.type) for perm in user.task_permissions
        ]:
            admin_or_owner = False

    return util.json_encode({"admin_or_owner": admin_or_owner})


@bottle.post("/tasks/create_round/<tid:int>")
@_auth.requires_auth
def create_round(credentials, tid):

    ensure_owner_or_admin(tid, credentials["id"])

    tm = TaskModel()
    task = tm.get(tid)
    task.cur_round += 1
    tm.dbs.add(task)
    tm.dbs.flush()

    r = Round(tid=tid, rid=task.cur_round, secret=secrets.token_hex())

    tm.dbs.add(r)
    tm.dbs.flush()
    tm.dbs.commit()
    logger.info("Added round (%s)" % (r.id))

    return util.json_encode({"success": "ok"})


@bottle.put("/tasks/update_round/<tid:int>/<rid:int>")
@_auth.requires_auth
def update_round(credentials, tid, rid):
    data = bottle.request.json

    ensure_owner_or_admin(tid, credentials["id"])

    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)

    if "model_ids" in data:
        tm = TaskModel()
        task = tm.get(tid)
        endpoint_urls = []
        for model_id in data["model_ids"]:
            mm = ModelModel()
            model = mm.get(model_id)
            if not model.is_published:
                bottle.abort(400, "Can't use an unpublished model as a target model")
            if model.tid != tid:
                bottle.abort(
                    400, "Can't add a model for another task as a target model"
                )

            # TODO: store the endpoint url in the models table?
            endpoint_url = (
                "https://obws766r82.execute-api."
                + task.aws_region
                + ".amazonaws.com/predict?model="
                + model.endpoint_name
            )
            endpoint_urls.append(endpoint_url)
        if endpoint_urls == []:
            round.url = None
        else:
            round.url = "|".join(endpoint_urls)

    round.longdesc = data.get("longdesc", round.longdesc)
    rm.dbs.add(round)
    rm.dbs.flush()
    rm.dbs.commit()
    logger.info("Updated round (%s)" % (round.id))

    return util.json_encode({"success": "ok"})


@bottle.get("/tasks/get_model_identifiers_for_target_selection/<tid:int>")
@_auth.requires_auth
def get_model_identifiers_for_target_selection(credentials, tid):
    ensure_owner_or_admin(tid, credentials["id"])
    tm = TaskModel()
    task = tm.get(tid)
    mm = ModelModel()
    models = mm.getByTid(tid)
    rm = RoundModel()
    rounds = rm.getByTid(tid)
    rid_to_model_identifiers = {}
    for round in rounds:
        model_identifiers = []
        for model in models:
            if (
                model.endpoint_name is not None
            ):  # This if-statement is needed for models that predate dynalab
                # TODO: store the endpoint url in the models table?
                endpoint_url = (
                    "https://obws766r82.execute-api."
                    + task.aws_region
                    + ".amazonaws.com/predict?model="
                    + model.endpoint_name
                )
                is_target = False
                if round.url is not None and endpoint_url in round.url:
                    is_target = True

                if is_target or (
                    model.is_published
                    and model.deployment_status == DeploymentStatusEnum.deployed
                ):
                    model_identifiers.append(
                        {
                            "model_name": model.name,
                            "model_id": model.id,
                            "uid": model.uid,
                            "username": model.user.username,
                            "is_target": is_target,
                        }
                    )
        rid_to_model_identifiers[round.rid] = model_identifiers

    return util.json_encode(rid_to_model_identifiers)


@bottle.get("/tasks/get_model_identifiers/<tid:int>")
@_auth.requires_auth
def get_model_identifiers(credentials, tid):
    ensure_owner_or_admin(tid, credentials["id"])
    mm = ModelModel()
    models = mm.getByTid(tid)
    model_identifiers = []
    for model in models:
        model_identifiers.append(
            {
                "model_name": model.name,
                "model_id": model.id,
                "deployment_status": model.deployment_status.name,
                "is_published": model.is_published,
                "uid": model.uid,
                "username": model.user.username,
            }
        )

    return util.json_encode(model_identifiers)


@bottle.put("/tasks/toggle_owner/<tid:int>/<username>")
@_auth.requires_auth
def toggle_owner(credentials, tid, username):
    ensure_owner_or_admin(tid, credentials["id"])
    um = UserModel()
    user_to_toggle = um.getByUsername(username)
    if (tid, "owner") in [
        (perm.tid, perm.type) for perm in user_to_toggle.task_permissions
    ]:
        tup = (
            um.dbs.query(TaskUserPermission)
            .filter(
                db.and_(
                    TaskUserPermission.uid == user_to_toggle.id,
                    TaskUserPermission.type == "owner",
                    TaskUserPermission.tid == tid,
                )
            )
            .delete()
        )
        um.dbs.flush()
        um.dbs.commit()
        logger.info("Removed task owner: " + username)
    else:
        tup = TaskUserPermission(uid=user_to_toggle.id, type="owner", tid=tid)
        um.dbs.add(tup)
        um.dbs.flush()
        um.dbs.commit()
        logger.info("Added task owner: " + username)

    return util.json_encode({"success": "ok"})


@bottle.put("/tasks/update/<tid:int>")
@_auth.requires_auth
def update(credentials, tid):
    ensure_owner_or_admin(tid, credentials["id"])

    data = bottle.request.json
    for field in data:
        if field not in (
            "unpublished_models_in_leaderboard",
            "validate_non_fooling",
            "num_matching_validations",
            "instructions_md",
            "predictions_upload_instructions_md",
            "train_file_upload_instructions_md",
            "mlcube_tutorial_markdown",
            "hidden",
            "submitable",
            "create_endpoint",
            "build_sqs_queue",
            "eval_sqs_queue",
            "is_decen_task",
            "task_aws_account_id",
            "task_gateway_predict_prefix",
            "config_yaml",
            "context",
        ):
            bottle.abort(
                403,
                """Can only modify unpublished_models_in_leaderboard,
                validate_non_fooling, num_matching_validations,
                instructions_md, hidden, predictions_upload_instructions_md,
                train_file_upload_instructions_md, mlcube_tutorial_markdown, submitable,
                create_endpoint, config_yaml""",
            )

    tm = TaskModel()

    if "config_yaml" in data:
        new_config = yaml.load(data["config_yaml"], yaml.SafeLoader)
        try:
            Task.verify_config(new_config)
        except Exception as ex:
            logger.exception(str(ex))
            bottle.abort(400, str(ex))
        task = tm.get(tid)
        old_config = yaml.load(task.config_yaml, yaml.SafeLoader)
        allowed_fields = ("aggregation_metric",)

        # ensure only allowed_fields changed
        if {k: v for k, v in new_config.items() if k not in allowed_fields} != {
            k: v for k, v in old_config.items() if k not in allowed_fields
        }:
            bottle.abort(
                400,
                f"You can only modify the {allowed_fields} fields "
                + "of the annotation config",
            )

    tm.update(tid, data)
    return util.json_encode({"success": "ok"})


@bottle.put("/tasks/activate/<tid:int>")
@_auth.requires_auth
def activate(credentials, tid):
    data = bottle.request.json
    if not util.check_fields(data, ["config_yaml"]):
        bottle.abort(400, "Missing data")

    ensure_owner_or_admin(tid, credentials["id"])

    tm = TaskModel()
    task = tm.get(tid)
    if task.active:
        bottle.abort(
            403,
            """Access denied. Cannot change the config_yaml of an
            already active task.""",
        )

    try:
        Task.verify_config(yaml.load(data["config_yaml"], yaml.SafeLoader))
    except Exception as ex:
        logger.exception(str(ex))
        bottle.abort(400, str(ex))

    tm.update(tid, {"config_yaml": data["config_yaml"], "active": True})

    if len(yaml.load(data["config_yaml"], yaml.SafeLoader).get("context", [])) == 0:
        # If there is no context in the config, then add an empty context.
        # The task owner should not need to do this, because we already know
        # that the context will be empty.
        rm = RoundModel()
        round = rm.getByTidAndRid(tid, task.cur_round)
        r_realid = round.id
        context = Context(
            r_realid=r_realid,
            context_json=util.json_encode({}),
            metadata_json=util.json_encode({}),
            tag=None,
        )

        rm.dbs.add(context)
        rm.dbs.flush()
        rm.dbs.commit()

    return util.json_encode({"success": "ok"})


@bottle.get("/tasks")
def tasks():
    t = TaskModel()
    tasks = t.listWithRounds()
    return util.json_encode(tasks)


@bottle.get("/tasks/submitable")
def get_submitable_tasks():
    t = TaskModel()
    tasks = t.listSubmitable()
    return util.json_encode(tasks)


@bottle.get("/tasks/<task_id_or_code>")
@_auth.turk_endpoint
def get_task(task_id_or_code):
    t = TaskModel()
    task = t.getWithRoundAndMetricMetadata(task_id_or_code)

    if not task:
        bottle.abort(404, "Not found")
    return util.json_encode(task)


@bottle.get("/tasks/<task_code>/dynalab")
def get_dynalab_task(task_code):
    bucket = "https://models-dynalab.s3.eu-west-3.amazonaws.com"
    return util.json_encode(f"""{bucket}/{task_code}/dynalab-base-{task_code}.zip""")


@bottle.get("/tasks/<tid:int>/<rid:int>")
def get_task_round(tid, rid):
    rm = RoundModel()
    round = rm.getByTidAndRid(tid, rid)
    if not round:
        bottle.abort(404, "Not found")
    return util.json_encode(round.to_dict())


@bottle.get("/tasks/<tid:int>/users")
def get_user_leaderboard(tid):
    """
    Return users and MER based on their examples score based on tasks
    :param tid:
    :return: Json Object
    """
    info = RoundUserExampleInfoModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result, total_count = info.getUserLeaderByTid(
            tid=tid, n=limit, offset=offset
        )
        return construct_user_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("User leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task detail")


@bottle.get("/tasks/<tid:int>/rounds/<rid:int>/users")
def get_leaderboard_by_task_and_round(tid, rid):
    """
    Get top leaders based on their examples score for specific task and round
    :param tid: task id
    :param rid: round id
    :return: Json Object
    """
    info = RoundUserExampleInfoModel()
    limit, offset = util.get_limit_and_offset_from_request()
    try:
        query_result, total_count = info.getUserLeaderByTidAndRid(
            tid=tid, rid=rid, n=limit, offset=offset
        )
        return construct_user_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("User leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task/round detail")


@bottle.get("/tasks/<tid:int>/rounds/<rid:int>/export")
@_auth.requires_auth
def export_current_round_data(credentials, tid, rid):
    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        if (tid, "owner") not in [
            (perm.tid, perm.type) for perm in user.task_permissions
        ]:
            bottle.abort(403, "Access denied")
    return util.json_encode(util.get_round_data_for_export(tid, rid))


@bottle.get("/tasks/<tid:int>/export")
@_auth.requires_auth
def export_task_data(credentials, tid):
    um = UserModel()
    user = um.get(credentials["id"])
    if not user.admin:
        if (tid, "owner") not in [
            (perm.tid, perm.type) for perm in user.task_permissions
        ]:
            bottle.abort(403, "Access denied")
    rm = RoundModel()
    example_and_validations_dicts = []
    for rid in [round.rid for round in rm.getByTid(tid)]:
        example_and_validations_dicts += util.get_round_data_for_export(tid, rid)
    return util.json_encode(example_and_validations_dicts)


def construct_user_board_response_json(query_result, total_count=0):
    list_objs = []
    # converting query result into json object
    for result in query_result:
        obj = {}
        obj["uid"] = result[0]
        obj["username"] = result[1]
        obj["avatar_url"] = result[2] if result[2] is not None else ""
        obj["count"] = int(result[3])
        obj["MER"] = str(round(result[4] * 100, 2))
        obj["total"] = str(result[3]) + "/" + str(result[5])
        list_objs.append(obj)
    if list_objs:
        # total_count = query_result[0][len(query_result[0]) - 1]
        resp_obj = {"count": total_count, "data": list_objs}
        return util.json_encode(resp_obj)
    else:
        resp_obj = {"count": 0, "data": []}
        return util.json_encode(resp_obj)


@bottle.get("/tasks/<tid:int>/models/topleaderboardtags")
def get_top_leaderboard_tags(tid):
    offset = 0
    limit = 5
    specific_tag = None
    query_dict = parse_qs(bottle.request.query_string)
    if "offset" in query_dict:
        offset = int(query_dict["offset"][0])
    if "limit" in query_dict:
        limit = int(query_dict["limit"][0])
    if "specific_tag" in query_dict:
        specific_tag = query_dict["specific_tag"][0]
    sm = ScoreModel()
    return sm.getLeaderboardTopPerformingTags(tid, limit, offset, specific_tag)


@bottle.get("/tasks/<tid:int>/models/dynaboard")
def get_dynaboard_info(tid):

    # defaults
    sort_by = "dynascore"
    sort_direction = "asc"
    offset = 0
    limit = 5

    query_dict = parse_qs(bottle.request.query_string)
    if "sort_by" in query_dict:
        sort_by = query_dict["sort_by"][0]
    if "sort_direction" in query_dict:
        sort_direction = query_dict["sort_direction"][0]

    if sort_direction != "asc" and sort_direction != "desc":
        bottle.abort(400, "unrecognized sort direction")

    if "offset" in query_dict:
        offset = int(query_dict["offset"][0])
    if "limit" in query_dict:
        limit = int(query_dict["limit"][0])

    if "ordered_metric_weights" in query_dict:
        ordered_metric_weights = [
            float(weight)
            for weight in query_dict["ordered_metric_weights"][0].split("|")
        ]
    else:
        bottle.abort(400, "missing metric weight data")

    if "ordered_scoring_dataset_weights" in query_dict:
        ordered_dataset_weights = [
            float(weight)
            for weight in query_dict["ordered_scoring_dataset_weights"][0].split("|")
        ]
    else:
        bottle.abort(400, "missing dataset weight data")

    return get_dynaboard_info_for_params(
        tid,
        ordered_metric_weights,
        ordered_dataset_weights,
        sort_by,
        sort_direction,
        limit,
        offset,
    )


def get_dynaboard_info_for_params(
    tid,
    ordered_metric_weights,
    ordered_dataset_weights,
    sort_by,
    sort_direction,
    limit,
    offset,
):
    if sort_direction == "asc":
        reverse_sort = False
    elif sort_direction == "desc":
        reverse_sort = True

    tm = TaskModel()
    t_dict = tm.getWithRoundAndMetricMetadata(tid)
    ordered_metrics = t_dict["ordered_metrics"]
    perf_metric_field_name = t_dict["perf_metric_field_name"]

    ordered_metric_and_weight = [
        dict({"weight": weight}, **metric)
        for weight, metric in zip(ordered_metric_weights, ordered_metrics)
    ]
    ordered_did_and_weight = [
        {"weight": weight, "did": did}
        for weight, did in zip(
            ordered_dataset_weights,
            [dataset["id"] for dataset in t_dict["ordered_scoring_datasets"]],
        )
    ]

    sm = ScoreModel()
    return sm.getDynaboardByTask(
        tid,
        perf_metric_field_name,
        ordered_metric_and_weight,
        ordered_did_and_weight,
        sort_by,
        reverse_sort,
        limit,
        offset,
    )


@bottle.get("/tasks/<tid:int>/models")
def get_model_leaderboard(tid):
    """
    Fetch Top perform models based on their test score
    :param tid: Task Id
    :return: Json Object
    """
    try:
        score = ScoreModel()
        limit, offset = util.get_limit_and_offset_from_request()
        query_result, total_count = score.getOverallModelPerfByTask(
            tid=tid, n=limit, offset=offset
        )
        return construct_model_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("Model leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task detail")


@bottle.get("/tasks/<tid:int>/rounds/<rid:int>/models")
def get_model_leaderboard_round(tid, rid):
    """
    Fetch  top perform models based on round and task
    :param tid: Task id
    :param rid: Round id
    :return: Json Object
    """
    score = ScoreModel()
    try:
        limit, offset = util.get_limit_and_offset_from_request()
        query_result, total_count = score.getModelPerfByTidAndRid(
            tid=tid, rid=rid, n=limit, offset=offset
        )
        return construct_model_board_response_json(
            query_result=query_result, total_count=total_count
        )
    except Exception as ex:
        logger.exception("Model leader board data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task/round detail")


@bottle.get("/tasks/<tid:int>/trends")
def get_task_trends(tid):
    """
    Get top perform models and its round wise performance metrics at task level
    It will fetch only top 10 models and its round wise performance metrics
    :param tid: Task id
    :return: Json Object
    """
    try:
        sm = ScoreModel()
        tm = TaskModel()
        task_dict = tm.getWithRoundAndMetricMetadata(tid)
        ordered_metric_and_weight = list(
            map(
                lambda metric: dict({"weight": metric["default_weight"]}, **metric),
                task_dict["ordered_metrics"],
            )
        )
        ordered_did_and_weight = list(
            map(
                lambda dataset: dict(
                    {"weight": dataset["default_weight"], "did": dataset["id"]},
                    **dataset,
                ),
                task_dict["ordered_scoring_datasets"],
            )
        )
        dynaboard_response = sm.getDynaboardByTask(
            tid,
            task_dict["perf_metric_field_name"],
            ordered_metric_and_weight,
            ordered_did_and_weight,
            "dynascore",
            True,
            10,
            0,
        )
        mid_and_rid_to_perf = {}
        did_to_rid = {}
        for dataset in sm.dbs.query(Dataset):
            did_to_rid[dataset.id] = dataset.rid
        rid_to_did_to_weight = {}
        for did_and_weight in ordered_did_and_weight:
            rid = did_to_rid[did_and_weight["did"]]
            if rid in rid_to_did_to_weight:
                rid_to_did_to_weight[rid][did_and_weight["did"]] = did_and_weight[
                    "weight"
                ]
            else:
                rid_to_did_to_weight[rid] = {
                    did_and_weight["did"]: did_and_weight["weight"]
                }
        mid_to_name = {}
        for model in sm.dbs.query(Model):
            mid_to_name[model.id] = model.name

        for model_results in util.json_decode(dynaboard_response)["data"]:
            for dataset_results in model_results["datasets"]:
                rid = did_to_rid[dataset_results["id"]]
                if rid != 0:
                    ordered_metric_field_names = list(
                        map(
                            lambda metric: metric["field_name"],
                            task_dict["ordered_metrics"],
                        )
                    )
                    perf = dataset_results["scores"][
                        ordered_metric_field_names.index(
                            task_dict["perf_metric_field_name"]
                        )
                    ]
                    mid_and_rid = (model_results["model_id"], rid)
                    # Weighting is needed in case there are multiple scoring
                    # datasets for the same round.
                    weighted_perf = (
                        perf
                        * rid_to_did_to_weight[rid][dataset_results["id"]]
                        / sum(rid_to_did_to_weight[rid].values())
                    )
                    if mid_and_rid in mid_and_rid_to_perf:
                        mid_and_rid_to_perf[
                            (model_results["model_id"], rid)
                        ] += weighted_perf
                    else:
                        mid_and_rid_to_perf[
                            (model_results["model_id"], rid)
                        ] = weighted_perf
        query_result = []
        for (mid, rid), perf in mid_and_rid_to_perf.items():
            query_result.append((mid, mid_to_name[mid], perf, rid))

        return construct_trends_response_json(query_result=query_result)
    except Exception as ex:
        logger.exception("User trends data loading failed: (%s)" % (ex))
        bottle.abort(400, "Invalid task detail")


@bottle.get("/tasks/<tid:int>/leaderboard_configuration/<name>")
def get_leaderboard_configuration(tid, name):
    name = quote(name)
    lcm = LeaderboardConfigurationModel()
    leaderboard_configuration = lcm.getByTaskIdAndLeaderboardName(tid, name)

    if not leaderboard_configuration:
        bottle.abort(404, "Not found")

    leaderboard_configuration = leaderboard_configuration.to_dict()
    return util.json_encode(leaderboard_configuration)


@bottle.put("/tasks/<tid:int>/leaderboard_configuration")
@_auth.requires_auth
def create_leaderboard_configuration(credentials, tid):
    data = bottle.request.json
    if not util.check_fields(data, ["name", "configuration_json"]):
        bottle.abort(400, "Missing data")

    name = data["name"]
    if not is_valid_fork_or_snapshot_name(tid, name):
        bottle.abort(
            409, "A fork or a snapshot with the same name already exists for this task."
        )

    lcm = LeaderboardConfigurationModel()

    leaderboard_configuration = lcm.create(
        tid,
        name,
        credentials["id"],
        configuration_json=data["configuration_json"],
        desc=data.get("description", None),
    )

    return util.json_encode(leaderboard_configuration.to_dict())


@bottle.get("/tasks/<tid:int>/leaderboard_snapshot/<name>")
def get_leaderboard_snapshot(tid, name):
    name = quote(name)
    lsm = LeaderboardSnapshotModel()
    snapshot_with_creator = lsm.getByTidAndNameWithCreatorData(tid, name)

    if not snapshot_with_creator:
        bottle.abort(404, "Not found")

    ls, u = snapshot_with_creator

    return util.json_encode({"snapshot": ls.to_dict(), "creator": u.to_dict()})


@bottle.put("/tasks/<tid:int>/leaderboard_snapshot")
@_auth.requires_auth
def create_leaderboard_snapshot(credentials, tid):
    data = bottle.request.json
    if not util.check_fields(
        data,
        [
            "sort",
            "metricWeights",
            "datasetWeights",
            "orderedMetricWeights",
            "orderedDatasetWeights",
            "totalCount",
        ],
    ):
        bottle.abort(400, "Missing data")

    name = data.get("name", None)
    if name is None or len(name) == 0:
        while not is_valid_fork_or_snapshot_name(tid, name):
            name = str(uuid.uuid4())[:8]
    elif not is_valid_fork_or_snapshot_name(tid, name):
        bottle.abort(
            409, "A fork or a snapshot with the same name already exists for this task."
        )

    lsm = LeaderboardSnapshotModel()

    dynaboard_info = get_dynaboard_info_for_params(
        tid,
        data["orderedMetricWeights"],
        data["orderedDatasetWeights"],
        data["sort"]["field"],
        data["sort"]["direction"],
        data["totalCount"],
        0,
    )
    dynaboard_info = util.json_decode(dynaboard_info)
    dynaboard_info["metricWeights"] = data["metricWeights"]
    dynaboard_info["datasetWeights"] = data["datasetWeights"]
    dynaboard_info["miscInfoJson"] = {"sort": data["sort"]}

    dynaboard_info = util.json_encode(dynaboard_info)

    leaderboard_snapshot = lsm.create(
        tid,
        name,
        credentials["id"],
        data_json=dynaboard_info,
        desc=data.get("description", None),
    )

    return util.json_encode(leaderboard_snapshot.to_dict())


@bottle.get("/tasks/<task_code>/disambiguate_forks_and_snapshots/<name>")
def disambiguate_forks_and_snapshots(task_code, name):

    tm = TaskModel()
    tid = tm.getByTaskCode(task_code).id
    name = quote(name)
    lcm = LeaderboardConfigurationModel()
    if lcm.exists(tid, name):
        return util.json_encode({"type": "fork"})

    lsm = LeaderboardSnapshotModel()
    if lsm.exists(tid, name):
        return util.json_encode({"type": "snapshot"})

    bottle.abort(404, "Not found")


def is_valid_fork_or_snapshot_name(tid, name):
    if name is None or len(name) == 0:
        return False

    lcm = LeaderboardConfigurationModel()
    lsm = LeaderboardSnapshotModel()

    return not lcm.exists(tid, name) and not lsm.exists(tid, name)


def construct_model_board_response_json(query_result, total_count):
    fields = [
        "model_id",
        "model_name",
        "owner",
        "owner_id",
        "accuracy",
        "metadata_json",
    ]
    list_objs = []
    leaderboard_tags = []
    for d in query_result:
        obj = dict(zip(fields, d))
        if obj.get("metadata_json", None):
            obj["metadata_json"] = util.json_decode(obj["metadata_json"])
            # Check tags for every model to allow flexibility for adding or
            # removing tags in future
            if "perf_by_tag" in obj["metadata_json"]:
                for tag in obj["metadata_json"]["perf_by_tag"]:
                    if tag["tag"] not in leaderboard_tags:
                        leaderboard_tags.append(tag["tag"])
        else:
            obj["metadata_json"] = {}
        list_objs.append(obj)

    if list_objs:
        resp_obj = {
            "count": total_count,
            "data": list_objs,
            "leaderboard_tags": leaderboard_tags,
        }
        return util.json_encode(resp_obj)
    else:
        resp_obj = {"count": 0, "data": [], "leaderboard_tags": []}
        return util.json_encode(resp_obj)


def construct_trends_response_json(query_result):
    # construct response to support UI render
    response_obj = {}
    for reslt in query_result:
        if reslt[3] in response_obj.keys():
            val = response_obj[reslt[3]]
            val[reslt[1] + "_" + str(reslt[0])] = reslt[2]
            response_obj[reslt[3]] = val
        else:
            response_obj[reslt[3]] = {
                "round": reslt[3],
                reslt[1] + "_" + str(reslt[0]): reslt[2],
            }
    if response_obj:
        return util.json_encode(
            sorted(list(response_obj.values()), key=lambda value: value["round"])
        )
    else:
        return util.json_encode([])


def get_secret_for_task_id(tid):
    tm = TaskModel()
    tups = (
        tm.dbs.query(User.api_token)
        .join(TaskUserPermission, TaskUserPermission.uid == User.id)
        .filter(
            db.and_(TaskUserPermission.type == "owner", TaskUserPermission.tid == tid)
        )
        .all()
    )

    ret = [tup[0] for tup in tups]
    return ret


@bottle.get("/tasks/listdatasets")
def decen_eaas_list_datasets():
    dm = DatasetModel()
    tm = TaskModel()
    req_data = bottle.request.json
    data = req_data["data"]
    task_code = data["task_code"]

    # Get the TID for the task code
    task = tm.getByTaskCode(task_code)

    if not task:
        # This means the task code the decen eval server
        # started is wrong => return a useful message
        bottle.abort(
            400,
            "That task code does not exist! "
            "Please check eval_config.py to ensure your"
            " task_code is correct.",
        )

    task_secrets = get_secret_for_task_id(task.id)

    verified_across_keys = False
    for task_sec in task_secrets:
        if util.verified_data(req_data, task_sec):
            verified_across_keys = True
            break

    if not verified_across_keys:
        bottle.abort(401, "Operation not authorized")

    # The only thing so far we need to update is the deployment_status
    if set(data.keys()) != {"task_code"}:
        bottle.abort(401, "Operation not authorized")

    try:
        # Get all datasets related to the task code
        datasets = dm.getByTid(task.id)
        json_encoded_datasets = []
        for dataset in datasets:
            json_encoded_datasets.append(util.json_encode(dm.to_dict(dataset)))

        resp = {
            "datasets_metadata": json_encoded_datasets,
            "task_metadata": util.json_encode(tm.to_dict(task)),
        }

        return util.json_encode(resp)

    except Exception as e:
        logger.exception("Could not retrieve datasets for task: %s" % (e))
        bottle.abort(400, "Could not retrieve datasets for task: %s" % (e))


@bottle.get("/tasks/listmodelsids")
def decen_eaas_list_model_ids():
    mm = ModelModel()
    tm = TaskModel()
    req_data = bottle.request.json
    data = req_data["data"]
    task_code = data["task_code"]

    # Get the TID for the task code
    task = tm.getByTaskCode(task_code)

    task_secrets = get_secret_for_task_id(task.id)

    verified_across_keys = False
    for task_sec in task_secrets:
        if util.verified_data(req_data, task_sec):
            verified_across_keys = True
            break

    if not verified_across_keys:
        bottle.abort(401, "Operation not authorized")

    # The only thing so far we need to update is the deployment_status
    if set(data.keys()) != {"task_code"}:
        bottle.abort(401, "Operation not authorized")

    try:

        # Get all datasets related to the task code
        models = mm.getByTid(task.id)
        model_ids = []
        for model in models:
            if model.deployment_status in {
                DeploymentStatusEnum.deployed,
                DeploymentStatusEnum.created,
                DeploymentStatusEnum.predictions_upload,
            }:
                model_ids.append(model.id)

        return util.json_encode(model_ids)

    except Exception as e:
        logger.exception("Could not list model ids for task: %s" % (e))
        bottle.abort(400, "Could not list model ids for task: %s" % (e))
