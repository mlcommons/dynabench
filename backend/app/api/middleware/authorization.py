# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from typing import TypedDict

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt

from app.domain.helpers.exceptions import credentials_exception
from app.infrastructure.repositories.user import UserRepository


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def verify_token(token: str):
    try:
        decoded_token = jwt.decode(
            token,
            os.getenv("JWT_SECRET"),
            algorithms=[os.getenv("AUTH_HASH_ALGORITHM")],
        )
        return decoded_token
    except Exception as e:
        print(f"Token verification failed: {e}")
        credentials_exception()


class AccessTokenPayload(TypedDict):
    email: str


def get_find_user_repository():
    return UserRepository()


async def validate_access_token(
    request: Request,
    token: str = Depends(oauth2_scheme),
    repository=Depends(get_find_user_repository),
) -> None:
    # The OAuth2PasswordBearer already extracts and validates the Bearer token format
    # So we don't need to manually extract it from headers
    decoded: AccessTokenPayload = await verify_token(token)
    # While we migrate the login into Backend we are using id
    # That is what the API sends in the token.
    # email = decoded.get("email", None)
    id = decoded.get("id", None)
    if not id:
        raise credentials_exception()
    user = repository.get_by_id(id)
    # Once we have mirated the login into Backend we will use email.
    # user = repository.get_by_email(email)
    if user is None or not user:
        raise credentials_exception()
    request.state.user = user
