# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.auth.authentication import LoginService
from app.domain.schemas.auth.auth import CreateUserRequest


router = APIRouter()


@router.post("/create_user")
async def create_user(model: CreateUserRequest):
    return LoginService().create_user(model.email, model.password, model.username)
