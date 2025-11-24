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
    username: str
    id: int


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str
    user: CreateUserResponse


class TokenPayload(BaseModel):
    access_token: str
    token_type: str


class RecoverPasswordRequest(BaseModel):
    email: EmailStr


class NewPasswordRequest(RecoverPasswordRequest):
    new_password: str
