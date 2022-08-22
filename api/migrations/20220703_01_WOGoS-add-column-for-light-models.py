# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Add log access type to datasets.
"""

from yoyo import step


__depends__ = {"20220504_01_WOGoS-add-context-parameter-task"}
url_nli = "https://26d2flibrxcgm453pupq7xx4pi0mgnwy.lambda-url.eu-west-3.on.aws/"
url_sen = "https://i327m3hentejqdymbrrxaqppby0lbhqj.lambda-url.eu-west-3.on.aws/"
url_hs = "https://7qezcrvld5pf72jxktulyv7ssa0nwwin.lambda-url.eu-west-3.on.aws/"
url_vqa = "https://mmwlt7wnruuc5nmcxlwfugwnd40vjotj.lambda-url.eu-west-3.on.aws/"
url_qb = "https://x3rgzv7ermzkymu3fp3ieciat40hcqlq.lambda-url.eu-west-3.on.aws/"
url_qa = "https://ostags6bh3qftqoll3336o2wgq0wshmi.lambda-url.eu-west-3.on.aws"

steps = [
    step(
        """
        UPDATE rounds
        SET url="{}/model/single_evaluation"
        WHERE tid=1 AND rid=4
        """.format(
            url_nli
        )
    ),
    step(
        """
        UPDATE rounds
        SET url="{}/model/single_evaluation"
        WHERE tid=3 AND rid=3
        """.format(
            url_sen
        )
    ),
    step(
        """
        UPDATE rounds
        SET url="{}/model/single_evaluation"
        WHERE tid=5 AND rid=8
        """.format(
            url_hs
        )
    ),
    step(
        """
        UPDATE rounds
        SET url="{}/model/single_evaluation"
        WHERE tid=12 AND rid=1
        """.format(
            url_vqa
        )
    ),
    step(
        """
        UPDATE rounds
        SET url="{}/model/single_evaluation"
        WHERE tid=14 AND rid=1
        """.format(
            url_vqa
        )
    ),
    step(
        """
        UPDATE rounds
        SET url="{}/model/single_evaluation"
        WHERE tid=25 AND rid=1
        """.format(
            url_qb
        )
    ),
    step(
        """
        UPDATE rounds
        SET url="{}/model/single_evaluation"
        WHERE tid=2 AND rid=4
        """.format(
            url_qa
        )
    ),
]
