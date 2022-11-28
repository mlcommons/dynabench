# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import HTTPException, status


def user_with_email_already_exists(email: str) -> HTTPException:
    return HTTPException(
        detail=f"User with email {email} already exists",
        status_code=status.HTTP_400_BAD_REQUEST,
    )


def password_is_incorrect() -> HTTPException:
    return HTTPException(
        detail="Password is incorrect", status_code=status.HTTP_401_UNAUTHORIZED
    )


def user_does_not_exist() -> HTTPException:
    return HTTPException("User does not exist", status_code=status.HTTP_404_NOT_FOUND)


def credentials_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def bad_token() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )
