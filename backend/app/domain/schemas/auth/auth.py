# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from pydantic import BaseModel, EmailStr


class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    username: str


class CreateUserResponse(BaseModel):
    email: EmailStr
    password: str
    username: str
    id: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    access_token: str
    token_type: str


class IsAdminOrOwnerRequest(BaseModel):
    user_id: int = 0
    task_id: int
