# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sys

from mephisto.abstractions.databases.local_database import LocalMephistoDB
from mephisto.abstractions.providers.mturk.mturk_utils import (
    expire_and_dispose_hits,
    get_outstanding_hits,
)


sys.path.append("./Mephisto")
db = LocalMephistoDB()
requester = db.find_requesters(requester_name=input("Enter requester name "))[0]

client = requester._get_client(requester._requester_name)
outstanding_hits = get_outstanding_hits(client)

for hit_type in outstanding_hits:
    expire_and_dispose_hits(client, outstanding_hits[hit_type])  # Linter fixed done
