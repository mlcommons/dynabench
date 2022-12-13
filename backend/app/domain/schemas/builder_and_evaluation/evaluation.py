# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel


class InitializeModelEvaluationRequest(BaseModel):
    task_code: str
    s3_url: str
    model_id: int
