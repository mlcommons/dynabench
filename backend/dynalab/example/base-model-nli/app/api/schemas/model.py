# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel


class ModelSingleInput(BaseModel):
    context: str
    hypothesis: str


class ModelSingleOutputProbabilities(BaseModel):
    entailed: float
    contradictory: float
    neutral: float


class ModelSingleOutput(BaseModel):
    label: str
    prob: ModelSingleOutputProbabilities
