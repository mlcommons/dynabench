# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add AdVQA
"""
import secrets

from yoyo import step


__depends__ = {"20201201_01_Eau7B-switch-sentiment-to-three-class"}

MODEL_URL = (
    "https://fhcxpbltv0.execute-api.us-west-1.amazonaws.com/predict?model=vqa-r1-1"
)


def get_tid(cursor):
    assert cursor.execute("SELECT * FROM tasks WHERE shortname='VQA'") == 1
    results = cursor.fetchall()
    assert len(results) == 1
    tid = results[0][0]
    return tid


def apply_step(conn):
    cursor = conn.cursor()
    tid = get_tid(cursor)
    cursor.execute(
        "INSERT INTO `rounds` (tid, rid, secret, url) VALUES (%s, 1, %s, %s)",
        (tid, secrets.token_hex(), MODEL_URL),
    )


def rollback_step(conn):
    cursor = conn.cursor()
    tid = get_tid(cursor)
    cursor.execute("DELETE FROM `rounds` WHERE tid=%s AND url=%s", (tid, MODEL_URL))


steps = [
    step(
        "INSERT INTO `tasks` (name, shortname, `desc`, targets, cur_round "
        + ", last_updated, has_context, hidden) "
        + "VALUES ('Visual Question Answering', 'VQA', "
        + "'Visual Question Answering involves answering a "
        + " question based on an image', "
        + "'na', 1, NOW(), 0, 1)",
        "DELETE FROM `tasks` WHERE shortname='VQA'",
    ),
    step(apply_step, rollback_step),
]
