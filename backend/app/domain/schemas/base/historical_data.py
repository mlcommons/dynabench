# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import BaseModel


class GetHistoricalDataRequest(BaseModel):
    task_id: int
    user_id: int


class GetHistoricalData(BaseModel):
    task_id: int


class GetSaveHistoricalDataRequest(BaseModel):
    task_id: int
    user_id: int
    data: str


class DeleteHistoricalDataRequest(BaseModel):
    task_id: int
    user_id: int
