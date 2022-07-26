# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel


class ModelSingleInput(BaseModel):
    input_text: str


class ModelSingleOutput(BaseModel):
    output_text: str
