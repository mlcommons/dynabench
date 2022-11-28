# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt

from app.domain.helpers.exceptions import credentials_exception


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        return jwt.decode(
            token, os.getenv("JWT_SECRET_KEY"), algorithms=[os.getenv("ALGORITHM")]
        )
    except Exception:
        return credentials_exception()
