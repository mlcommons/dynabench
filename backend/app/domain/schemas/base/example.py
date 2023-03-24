# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel


class GetExampleRequest(BaseModel):
    real_round_id: int
    user_id: int
    num_matching_validations: int
    validate_non_fooling: bool
