#!/usr/bin/env python3

# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# This scripts helps to create a local qualification that
# maps to a known qualification on mturk.

"""
This script is useful to create a local softban, or a local
restricted user pool that only certain users can access your
HIT.
(1) Create a new qualification using UI. Record qualification ID.
(2) Use this script to assign users to that qualification.
(3) Add this qualification in util.py and task related *.json.

e.g.,
    "restricted_user_pool": {
        "QualificationTypeId": Restricted_user_pool,
        "Comparator":"Exists",
        "ActionsGuarded": "DiscoverPreviewAndAccept",
    }
"""

from mephisto.core.local_database import LocalMephistoDB


db = LocalMephistoDB()
reqs = db.find_requesters(provider_type="mturk")
names = [r.requester_name for r in reqs]
print("Available Requesters: ", names)

requester_name = input("Select a requester to grant/query qualification: ")
requester = None
for r in reqs:
    if r.requester_name == requester_name:
        requester = r
        break
mturk_client = requester._get_client(requester._requester_name)

restricted_pool_qual_id = input("Provide the qualification id: ")

update_or_query = input("(g)rant or (q)uery? : ")
if update_or_query == "g":
    user_id = input(
        "Provide the worker id that you want to add into the qualification: "
    )
    restricted_jsons = mturk_client.associate_qualification_with_worker(
        QualificationTypeId=restricted_pool_qual_id,
        SendNotification=True,
        IntegerValue=0,
        WorkerId=user_id,
    )
elif update_or_query == "q":
    restricted_pool = set()
    pagination_token = None
    while 1:
        if pagination_token:
            restricted_jsons = mturk_client.list_workers_with_qualification_type(
                QualificationTypeId=restricted_pool_qual_id,
                Status="Granted",
                MaxResults=100,
                NextToken=pagination_token,
            )
        else:
            restricted_jsons = mturk_client.list_workers_with_qualification_type(
                QualificationTypeId=restricted_pool_qual_id,
                Status="Granted",
                MaxResults=100,
            )
        if len(restricted_jsons["Qualifications"]) == 0:
            break
        pagination_token = restricted_jsons["NextToken"]

        for qual in restricted_jsons["Qualifications"]:
            restricted_pool.add(qual["WorkerId"])
    for u in restricted_pool:
        print(u)
# add other supports here based on reference of boto3 APIs here:
# https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/mturk.html#id48
else:
    print("ERR: invalid inputs")
    assert False
