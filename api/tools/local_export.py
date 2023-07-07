# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sys


import common.helpers as util  # noqa isort:skip

if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Usage: python local_export.py TID RID FILENAME.json")
        quit()
    tid, rid, output_fname = sys.argv[1], sys.argv[2], sys.argv[3]
    data = util.get_round_data_for_export(tid, rid)
    assert data is not False, "No data! Task or round not found?"
    encoded = util.json_encode(data)
    with open(output_fname, "w") as fw:
        fw.write(encoded)
