# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from datetime import datetime, timedelta
from typing import Any, Union

from jose import jwt
from passlib.context import CryptContext

from app.domain.helpers.exceptions import (
    password_is_incorrect,
    user_does_not_exist,
    user_with_email_already_exists,
)
from app.infrastructure.repositories.user import UserRepository


class Login:
    def __init__(self) -> None:
        self.JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
        self.JWT_REFRESH_SECRET_KEY = os.getenv("JWT_REFRESH_SECRET_KEY")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
        self.REFRESH_TOKEN_EXPIRE_MINUTES = os.getenv("REFRESH_TOKEN_EXPIRE_MINUTES")
        self.ALGORITHM = os.getenv("ALGORITHM")
        self.users_repository = UserRepository()
        self.password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def get_hashed_password(self, password: str) -> str:
        return self.password_context.hash(password)

    def verify_password(self, password: str, hashed_pass: str) -> bool:
        return self.password_context.verify(password, hashed_pass)

    def create_token(
        self,
        subject: Union[str, Any],
        minutes: int,
        secret_key: str,
        algorithm: str,
        expires_delta: int = None,
    ) -> str:
        if expires_delta:
            expires_delta = datetime.utcnow() + expires_delta
        else:
            expires_delta = datetime.utcnow() + timedelta(minutes=int(minutes))

        to_encode = {"exp": expires_delta, "sub": str(subject)}
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm)
        return encoded_jwt

    def create_access_token(
        self, subject: Union[str, Any], expires_delta: int = None
    ) -> str:
        return self.create_token(
            subject,
            self.ACCESS_TOKEN_EXPIRE_MINUTES,
            self.JWT_SECRET_KEY,
            self.ALGORITHM,
            expires_delta,
        )

    def create_user(self, email: str, password: str, username: str) -> dict:
        user = self.users_repository.get_by_email(email)
        if user:
            return user_with_email_already_exists(email)
        return self.users_repository.create_user(
            email, self.get_hashed_password(password), username
        )

    def login(self, email: str, password: str) -> dict:
        user = self.users_repository.get_by_email(email)
        if user is None:
            return user_does_not_exist()
        hashed_pass = user["password"]
        if not self.verify_password(password, hashed_pass):
            return password_is_incorrect()
        return {
            "access_token": self.create_access_token(user["email"]),
            "token_type": "bearer",
        }
