# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter

from app.domain.auth.authentication import LoginService
from app.domain.schemas.auth.auth import CreateUserRequest, LoginRequest
from app.domain.services.base.user import UserService


router = APIRouter()


@router.get("/get_user_with_badges/{user_id}", response_model={})
async def get_task_id_by_task_code(user_id: str):
    return UserService().get_user_with_badges(user_id)


@router.get("/get_stats_per_user_id/{user_id}", response_model={})
async def get_stats_per_user_id(user_id: str):
    return UserService().get_stats_per_user_id(user_id)


@router.post("/authenticate")
async def authenticate(model: LoginRequest):
    return LoginService().login(model.email, model.password)


@router.post("/create_user")
async def create_user(model: CreateUserRequest):
    return LoginService().create_user(model.email, model.password, model.username)
