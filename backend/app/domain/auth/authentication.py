# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from datetime import datetime, timedelta
from typing import Any, Union

from jose import jwt
from werkzeug.security import check_password_hash, generate_password_hash

from app.domain.helpers.exceptions import (
    password_is_incorrect,
    user_does_not_exist,
    user_with_email_already_exists,
)
from app.domain.services.base.user import UserService
from app.infrastructure.repositories.taskuserpermission import (
    TaskUserPermissionRepository,
)


class Login:
    def __init__(self) -> None:
        self.AUTH_JWT_SECRET_KEY = os.getenv("AUTH_JWT_SECRET_KEY")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = os.getenv("AUTH_ACCESS_TOKEN_EXPIRE_MINUTES")
        self.REFRESH_TOKEN_EXPIRE_MINUTES = os.getenv(
            "AUTH_REFRESH_TOKEN_EXPIRE_MINUTES"
        )
        self.AUTH_HASH_ALGORITHM = os.getenv("AUTH_HASH_ALGORITHM")
        self.users_service = UserService()
        self.task_user_permission_repository = TaskUserPermissionRepository()

    def get_hashed_password(self, password: str) -> str:
        return generate_password_hash(password)

    def verify_password(self, password: str, hashed_pass: str) -> bool:
        return check_password_hash(hashed_pass, password)

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
            self.AUTH_JWT_SECRET_KEY,
            self.AUTH_HASH_ALGORITHM,
            expires_delta,
        )

    def create_user(self, email: str, password: str, username: str) -> dict:
        user = self.users_service.get_by_email(email)
        if user:
            user_with_email_already_exists(email)
        password = self.get_hashed_password(password)
        return self.users_service.create_user(email, password, username)

    def login(self, email: str, password: str) -> dict:
        user = self.users_service.get_by_email(email)
        if user is None:
            user_does_not_exist()
        hashed_pass = user["password"]
        if not self.verify_password(password, hashed_pass):
            password_is_incorrect()
        return {
            "access_token": self.create_access_token(user["email"]),
            "token_type": "bearer",
        }

    def is_admin_or_owner(self, user_id: int, task_id: int):
        return self.task_user_permission_repository.is_task_owner(
            user_id, task_id
        ) or self.users_service.get_is_admin(user_id)
