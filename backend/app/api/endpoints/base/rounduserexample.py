# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.schemas.base.rounduserexample import StillAllowedToSubmit
from app.domain.services.base.rounduserexampleinfo import RoundUserExampleInfoService


router = APIRouter()


@router.post("/still_allowed_to_submit", response_model={})
async def still_allowed_to_submit(model: StillAllowedToSubmit):
    return RoundUserExampleInfoService().still_allowed_to_submit(
        model.round_id, model.user_id, model.max_amount_examples_on_a_day
    )


@router.post("/amounts_examples_created_today", response_model={})
async def amounts_examples_created_today(model: StillAllowedToSubmit):
    return RoundUserExampleInfoService().amounts_examples_created_today(
        model.round_id, model.user_id
    )[0]
