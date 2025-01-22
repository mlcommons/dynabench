# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import List, Optional, Union

from pydantic import BaseModel


class GetCsvScore(BaseModel):
    task_id: int
    round_id: Optional[int] = None


class GetLeaderboardMetadata(BaseModel):
    task_id: int
    round_id: Optional[int] = None


class CsvResponseModel(BaseModel):
    data: Union[str, List]
    rounds: Union[List[int], None]


class HeavyEvaluationScoresRequest(BaseModel):
    model_id: int
    message: str
    scores: dict
    status_code: int
