#!/usr/bin/env python3

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import importlib
import os

import sqlalchemy as db
from werkzeug.security import generate_password_hash

import common.helpers as util


def get_cls_name_helper(ss):
    ret, ii = "", 0
    while ii < len(ss):
        if ii == 0:
            ret += ss[ii].upper()
        elif ss[ii] == "_":
            ret += ss[ii + 1].upper()
            ii += 1
        else:
            ret += ss[ii]
        ii += 1
    return ret


if __name__ == "__main__":

    ##
    # Create a config.py if it doesn't exist
    ##
    if not os.path.exists("common/config.py"):
        print("Config does not exist yet, let's create it.")
        print("NOTE: Use absolute paths where applicable!")

        example_config_str = open("common/config.py.example").read()
        config = {}
        exec(example_config_str)

        required_fields = [
            "db_name",
            "db_user",
            "db_password",
            "ssl_cert_file_path",
            "ssl_org_pem_file_path",
        ]
        for field in required_fields:
            tmp = input(f"Please enter your {field}: ")
            config[field] = tmp

        with open("common/config.py", "w") as fw:
            fw.write("config = " + util.json_encode(config, indent=4, sort_keys=True))
            print("Wrote config to common/config.py - feel free to edit.")
    else:
        print("Config already exists.")
        from common.config import config

    ##
    # Mark all existing migrations done
    ##
    from common.migrator import first_time_migrations
    from models.base import Base

    first_time_migrations()

    ##
    # Create all tables
    ##
    engine = db.create_engine(
        "mysql+pymysql://{}:{}@localhost:3306/{}".format(
            config["db_user"], config["db_password"], config["db_name"]
        ),
        # in case you want to debug:
        # echo="debug",
        # echo_pool=True,
    )
    connection = engine.connect()
    Base.metadata.bind = engine
    mods = {}
    for m in os.listdir("models/"):
        if m.endswith(".py") and not m.startswith("__"):
            name = m[:-3]
            mod = importlib.import_module("models." + name)
            cls = get_cls_name_helper(name)
            constructor = getattr(mod, cls)
            mods[cls] = constructor()

    Base.metadata.create_all(engine)

    ##
    # Create one admin user and one task with one round
    ##
    import getpass

    from models.base import DBSession as dbs
    from models.round import Round
    from models.task import Task
    from models.task_user_permission import TaskUserPermission
    from models.user import User

    dbs.flush()
    u = User(
        admin=True,
        username=input("Enter admin username: "),
        email=input("Enter admin email: "),
        password=generate_password_hash(
            getpass.getpass(prompt="Enter admin password (remains hidden): ")
        ),
    )
    dbs.add(u)
    dbs.flush()
    t = Task(
        name="Test",
        task_code="test",
        desc="Your test task",
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
    )
    dbs.add(t)
    dbs.flush()
    tup = TaskUserPermission(user=u, task=t, type="owner")
    dbs.add(tup)
    dbs.flush()
    r = Round(task=t, rid=1, desc="Your test round", secret="TBD", url="https://TBD")
    dbs.add(r)
    dbs.flush()
    t.cur_round = r.rid
    dbs.commit()
    dbs.close()
