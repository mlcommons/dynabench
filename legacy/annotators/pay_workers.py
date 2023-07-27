#!/usr/bin/env python3
# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import sys

import pandas as pd


if os.path.exists("./Mephisto"):  # noqa
    sys.path.append(os.path.abspath("./Mephisto"))  # noqa
    print("WARNING: Loading Mephisto from local directory")  # noqa

from mephisto.core.data_browser import DataBrowser as MephistoDataBrowser  # isort:skip
from mephisto.core.local_database import LocalMephistoDB  # isort:skip
from mephisto.data_model.assignment import Unit  # isort:skip
from mephisto.data_model.worker import Worker  # isort:skip


parsed_validations = pd.read_csv(
    input("Enter name of the file outputted by your processing script "), sep="\t"
)
disqualification_name = None
# Change this to the name of your local qualification that you should
# have already registered with MTurk and Mephisto

db = LocalMephistoDB()
mephisto_data_browser = MephistoDataBrowser(db=db)

DO_REVIEW = True
AUTO_REJECT = True

BONUS = 0.15


def format_for_printing_data(data):
    # Custom tasks can define methods for how to display their data in a
    # relevant way
    worker_name = Worker(db, data["worker_id"]).worker_name
    contents = data["data"]
    duration = contents["times"]["task_end"] - contents["times"]["task_start"]
    duration = int(duration)
    metadata_string = (
        f"Worker: {worker_name}\nUnit: {data['unit_id']}\n"
        f"Duration: {duration}\nStatus: {data['status']}\n"
    )

    inputs = contents["inputs"]
    if inputs and len(inputs) > 0:
        inputs_string = (
            f"Character: {inputs['character_name']}\n"
            f"Description: {inputs['character_description']}\n"
        )
    else:
        inputs_string = "Character: None\nDescription: None\n"
    outputs = contents["outputs"]
    output_string = f"   Outputs: {outputs}\n"
    found_files = outputs.get("files")
    if found_files is not None:
        file_dir = Unit(db, data["unit_id"]).get_assigned_agent().get_data_dir()
        output_string += f"   Files: {found_files}\n"
        output_string += f"   File directory {file_dir}\n"
    else:
        output_string += "   Files: No files attached\n"
    return f"-------------------\n{metadata_string}{inputs_string}{output_string}"


#### CONDITION WHETHER VALIDATION EXISTS

for itr, agentId in enumerate(parsed_validations["agentId"]):
    unit_list = db.find_units(agent_id=int(agentId))
    if len(unit_list) == 0:
        continue
    unit = unit_list[0]
    if unit.get_assigned_agent() is None:
        continue
    if unit.get_status() == "completed":
        try:
            print(
                format_for_printing_data(mephisto_data_browser.get_data_from_unit(unit))
            )
        except Exception as e:
            print(e.message)
            if unit.get_assigned_agent() is None:
                continue
        keep = parsed_validations.loc[itr, "keep"]
        sendbonus = parsed_validations.loc[itr, "sendbonus"]
        if keep == "a":
            unit.get_assigned_agent().approve_work()
            sendbonus = round(sendbonus, 2)
            if sendbonus > 0:
                unit.get_assigned_agent().get_worker().bonus_worker(
                    amount=sendbonus,
                    reason="Bonus for questions that fooled the model",
                    unit=unit,
                )
        elif keep == "r":
            if AUTO_REJECT:
                reason = (
                    "We validated your work and over 3 out of 5 questions "
                    + "do not satisfy the instructions. Unfortunately we'll have "
                    + "to reject this HIT."
                )
            else:
                reason = input("Why are you rejecting this work?")
            unit.get_assigned_agent().reject_work(reason)
        elif keep == "p":
            # General best practice is to accept borderline work and then disqualify
            # the worker from working on more of these tasks
            agent = unit.get_assigned_agent()
            agent.soft_reject_work()
            sendbonus = round(sendbonus, 2)
            if sendbonus > 0:
                unit.get_assigned_agent().get_worker().bonus_worker(
                    amount=sendbonus,
                    reason="Bonus for questions that fooled the model",
                    unit=unit,
                )
            worker = agent.get_worker()
            worker.grant_qualification(disqualification_name, 1)
    else:
        continue
