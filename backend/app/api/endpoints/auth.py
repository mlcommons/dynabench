# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.domain.auth.authentication import LoginService
from app.domain.schemas.auth.auth import (
    CreateUserRequest,
    CreateUserResponse,
    IsAdminOrOwnerRequest,
    LoginResponse,
)


router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(model: OAuth2PasswordRequestForm = Depends()):
    return LoginService().login(model.username, model.password)


@router.post("/create_user", response_model=CreateUserResponse)
async def create_user(model: CreateUserRequest):
    return LoginService().create_user(model.email, model.password, model.username)


@router.post("/is_admin_or_owner", response_model=bool)
async def is_admin_or_owner(model: IsAdminOrOwnerRequest):
    return LoginService().is_admin_or_owner(model.user_id, model.task_id)
