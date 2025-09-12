# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from typing import Dict, List, Optional

from pydantic import BaseModel


class GetTaskInfoByIdResponse(BaseModel):
    task_id: int


class GetTaskInfoByCodeResponse(BaseModel):
    task_code: str


class UpdateTaskInstructions(BaseModel):
    task_id: int
    instructions: str


class GetDynaboardInfoByTaskIdRequest(BaseModel):
    task_id: int
    ordered_metric_weights: List[float]
    ordered_scoring_dataset_weights: List[float]
    sort_by: str
    sort_direction: str
    offset: int
    limit: int
    metrics: List[str]
    filtered: Optional[str] = None


class SignInConsentRequest(BaseModel):
    task_id: int
    user_id: int


class PreliminaryQuestionsRequest(BaseModel):
    task_id: int
    user_id: int
    preliminary_questions: Dict


class CheckSignConsentRequest(BaseModel):
    task_id: int
    user_id: int


class UpdateYamlConfiguration(BaseModel):
    task_id: int
    config_yaml: str
