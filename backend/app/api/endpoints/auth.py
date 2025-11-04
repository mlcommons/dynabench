# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Depends, Header, Request, Response

from app.api.middleware.authentication import validate_access_token
from app.domain.auth.authentication import LoginService
from app.domain.schemas.auth.auth import (
    CreateUserRequest,
    IsAdminOrOwnerRequest,
    LoginRequest,
    LoginResponse,
)


router = APIRouter()


@router.post("/create_user")
async def create_user(model: CreateUserRequest):
    return LoginService().create_user(model.email, model.password, model.username)


@router.post("/is_admin_or_owner", response_model=bool)
async def is_admin_or_owner(
    model: IsAdminOrOwnerRequest, token_payload=Depends(validate_access_token)
):
    return LoginService().is_admin_or_owner(model.user_id, model.task_id)


@router.get("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    authorization: str = Header(..., description="Bearer token required"),
):
    return LoginService().refresh_token(request, response, authorization)


@router.post("/login", response_model=LoginResponse)
async def login(model: LoginRequest, response: Response):
    return LoginService().login(model.email, model.password, response)


@router.post("/logout")
async def logout(
    request: Request, response: Response, token_payload=Depends(validate_access_token)
):
    return LoginService().logout(request, response)
