# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Utility functions for simple text preprocessing and post-processing
import re


def preprocess(sent):
    sent = re.sub(r"([.,!?'\:\-])", r" \1 ", sent)
    return sent


def postprocess(sent):
    sent = re.sub(r'\s+([.,!?"\'\:\-])', r"\1", sent).strip()
    return sent
