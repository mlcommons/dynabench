# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.domain.auth.authentication import Login
from app.domain.schemas.auth.auth import (
    CreateUserRequest,
    CreateUserResponse,
    LoginResponse,
)


router = APIRouter()


@router.post("/login", response_model=LoginResponse)
async def login(model: OAuth2PasswordRequestForm = Depends()):
    return Login().login(model.username, model.password)


@router.post("/create_user", response_model=CreateUserResponse)
async def create_user(model: CreateUserRequest):
    return Login().create_user(model.email, model.password, model.username)
