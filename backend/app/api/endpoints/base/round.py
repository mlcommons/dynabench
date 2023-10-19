# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.services.base.round import RoundService


router = APIRouter()


@router.get("/get_examples_collected_per_round/{round_id}-{task_id}")
def get_examples_collected_per_round(round_id: int, task_id: int):
    return RoundService().get_examples_collected_per_round(round_id, task_id)
