# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.schemas.base.rounduserexample import (
    AmountExamplesCreatedToday,
    IncrementExamplesSubmittedToday,
    RedirectThirdPartyProvider,
    StillAllowedToSubmit,
)
from app.domain.services.base.rounduserexampleinfo import RoundUserExampleInfoService


router = APIRouter()


@router.post("/still_allowed_to_submit", response_model={})
async def still_allowed_to_submit(model: StillAllowedToSubmit):
    return RoundUserExampleInfoService().still_allowed_to_submit(
        model.round_id, model.user_id
    )


@router.post("/number_of_examples_created", response_model={})
async def number_of_examples_created(model: StillAllowedToSubmit):
    return RoundUserExampleInfoService().number_of_examples_created(
        model.round_id, model.user_id
    )


@router.post("/amounts_examples_created_today", response_model={})
async def amounts_examples_created_today(model: AmountExamplesCreatedToday):
    return RoundUserExampleInfoService().amounts_examples_created_today(
        model.round_id, model.user_id
    )[0]


@router.post("/increment_counter_examples_submitted_today", response_model={})
async def increment_counter_examples_submitted_today(
    model: IncrementExamplesSubmittedToday,
):
    return RoundUserExampleInfoService().increment_counter_examples_submitted_today(
        model.round_id, model.user_id
    )


@router.post("/redirect_to_third_party_provider", response_model={})
async def redirect_to_third_party_provider(model: RedirectThirdPartyProvider):
    return RoundUserExampleInfoService().redirect_to_third_party_provider(
        model.task_id, model.user_id, model.round_id, model.url
    )
