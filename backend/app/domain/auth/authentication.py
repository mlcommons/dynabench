# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Union

from fastapi import HTTPException, Request, status
from jose import jwt
from werkzeug.security import check_password_hash, generate_password_hash

import app.domain.helpers.helper as util
from app.domain.helpers.email import EmailHelper
from app.domain.helpers.exceptions import (
    bad_token,
    credentials_exception,
    password_is_incorrect,
    refresh_token_expired,
    user_does_not_exist,
    user_with_email_already_exists,
)
from app.domain.services.base.user import UserService
from app.infrastructure.repositories.badge import BadgeRepository
from app.infrastructure.repositories.refreshtoken import RefreshTokenRepository
from app.infrastructure.repositories.taskuserpermission import (
    TaskUserPermissionRepository,
)
from app.infrastructure.repositories.user import UserRepository


class LoginService:
    def __init__(self) -> None:
        self.AUTH_JWT_SECRET_KEY = os.getenv("AUTH_JWT_SECRET_KEY")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = int(
            os.getenv("AUTH_ACCESS_TOKEN_EXPIRE_MINUTES")
        )
        self.REFRESH_TOKEN_EXPIRE_DAYS = int(
            os.getenv("AUTH_REFRESH_TOKEN_EXPIRE_DAYS")
        )
        self.AUTH_COOKIE_SECRET_KEY = os.getenv("AUTH_COOKIE_SECRET_KEY", "")
        self.AUTH_HASH_ALGORITHM = os.getenv("AUTH_HASH_ALGORITHM", "HS256")
        self.users_service = UserService()
        self.task_user_permission_repository = TaskUserPermissionRepository()
        self.badges_repository = BadgeRepository()
        self.refresh_token_repository = RefreshTokenRepository()
        self.users_repository = UserRepository()
        self.email_helper = EmailHelper()
        self.email_sender = os.getenv("MAIL_LOGIN")

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
            expires_delta = datetime.now(timezone.utc) + expires_delta
        else:
            expires_delta = datetime.now(timezone.utc) + timedelta(minutes=int(minutes))

        to_encode = {"exp": expires_delta, **subject}
        encoded_jwt = jwt.encode(to_encode, secret_key, algorithm)
        return encoded_jwt

    def set_refresh_token(self, response, user_id: int) -> str:
        """Create a refresh token using secure random generation"""
        refresh_token = secrets.token_hex(32)
        cookie_expires = datetime.now(timezone.utc) + timedelta(
            days=self.REFRESH_TOKEN_EXPIRE_DAYS
        )

        self.cleanup_old_refresh_tokens(user_id)

        self.refresh_token_repository.add(
            {
                "token": refresh_token,
                "uid": user_id,
                "generated_datetime": datetime.now(timezone.utc),
            }
        )

        response.set_cookie(
            key="dynabench_refresh_token",
            value=refresh_token,
            httponly=True,
            path="/",
            expires=cookie_expires,
            # For localhost testing set secure to False in Prod to True
            secure=False,
            samesite="lax",
            # For localhost testing set domain to localhost
            domain="localhost",
        )
        return refresh_token

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
        user_id = self.users_service.create_user(email, password, username)["id"]
        self.badges_repository.add_badge(user_id, "WELCOME_NOOB")

    def login(self, email: str, password: str, response) -> dict:
        email_provider = email.split("@")[1]
        user = self.users_service.get_by_email(email)
        if not user and email_provider in ["prolific", "amazonturk"]:
            user = self.create_user(email, password, email.split("@")[0])
        if user is None:
            user_does_not_exist()
        hashed_pass = user["password"]
        if not self.verify_password(password, hashed_pass):
            password_is_incorrect()
        token = self.create_access_token({"id": user["id"]})
        self.set_refresh_token(response, user["id"])
        return {
            "token": token,
            "user": user,
        }

    def logout(self, request, response) -> dict:
        """
        Logout the user by deleting the refresh token from cookies and database

        Args:
            request: Request object to extract cookies
            response: Response object to delete refresh token cookie
        """
        current_refresh_token = self.get_refresh_token_from_cookie(request)
        db_token = self.refresh_token_repository.get_by_token(current_refresh_token)

        if db_token:
            uid = db_token.get("uid", None)
        else:
            credentials_exception()

        user = self.users_repository.get_by_id(uid)
        if not user or user["id"] != request.state.user:
            raise credentials_exception()
        if current_refresh_token and db_token:
            self.refresh_token_repository.delete(db_token["id"])
            response.delete_cookie("dynabench_refresh_token")
            return {"message": "Logged out successfully"}
        else:
            refresh_token_expired()

    def is_admin_or_owner(self, task_id: int, request: Request) -> bool:
        user_id = request.state.user
        if not user_id:
            return False
        return self.task_user_permission_repository.is_task_owner(
            user_id, task_id
        ) or self.users_service.get_is_admin(user_id)

    def refresh_token(self, request, response, authorization_header: str) -> dict:
        """
        Refresh the JWT token using the refresh token from cookie

        Args:
            request: Request object to extract cookies
            response: Response object to set new refresh token cookie
            authorization_header: Optional current access token to get user info

        Returns:
            Dict with new access token and user info
        """
        try:
            current_refresh_token = None
            user_id = None

            # Step 1: Validate that authorization header is provided
            if not authorization_header:
                raise Exception("Invalid or expired bearer token")

            current_refresh_token = self.get_refresh_token_from_cookie(request)

            if not current_refresh_token:
                refresh_token_expired()

            # Step 2: Find user by refresh token in database and validate if user owns it
            db_token = self.refresh_token_repository.get_by_token(current_refresh_token)
            if not db_token:
                refresh_token_expired()

            user_id = db_token["uid"]
            # Step 3: Validate user exists
            user = self.users_repository.get_by_id(user_id)
            if not user:
                raise Exception("User not found")

            # Step 4: Validate refresh token is not expired and the user from the token matches the user
            if not self.validate_refresh_token_in_db(
                db_token, authorization_header, user
            ):
                refresh_token_expired()

            # Step 5: Create new access token
            new_access_token = self.create_access_token({"id": user["id"]})

            # Step 6: Create new refresh token and store it
            self.set_refresh_token(response, user_id)

            return {
                "token": new_access_token,
                "message": "Token refreshed successfully",
            }

        except Exception as e:
            # Clean up any invalid tokens
            if "current_refresh_token" in locals():
                try:
                    db_token = self.refresh_token_repository.get_by_token(
                        current_refresh_token
                    )
                    if db_token:
                        self.refresh_token_repository.delete(db_token["id"])
                except Exception:
                    pass

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Token refresh failed: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    def get_refresh_token_from_cookie(self, request) -> str:
        """Extract refresh token from HTTP-only cookie"""
        return request.cookies.get("dynabench_refresh_token", None)

    def validate_refresh_token_in_db(
        self, refresh_token: dict, authorization_header: str, user: dict
    ) -> bool:
        """Validate if refresh token exists in database and is not expired also if it is from the user"""
        try:
            # Check if token is expired (assuming 60 days expiration)
            # Maybe verify the age from the token itself?
            deadline = refresh_token.get("generated_datetime", None)
            if not deadline:
                return False

            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=timezone.utc)

            token_age = datetime.now(timezone.utc) - deadline

            if token_age.days > self.REFRESH_TOKEN_EXPIRE_DAYS:
                # Clean up expired token
                self.refresh_token_repository.delete(refresh_token["id"])
                return False

            access_token = authorization_header[7:]
            payload = jwt.decode(
                access_token,
                self.AUTH_JWT_SECRET_KEY,
                algorithms=[self.AUTH_HASH_ALGORITHM],
                options={"verify_exp": False},  # Allow expired tokens for refresh
            )

            payload_user_id = payload.get("id", None)
            user_id = user.get("id", None)

            if payload_user_id != user_id or payload_user_id is None:
                return False

            return True
        except (jwt.JWTError, ValueError, KeyError, Exception) as e:
            print(f"Token validation error: {e}")
            return False

    def cleanup_old_refresh_tokens(self, user_id: int):
        """Remove old refresh tokens for the user (keep only the latest)"""
        try:
            old_tokens = self.refresh_token_repository.get_all_by_user_id(user_id)
            for token in old_tokens:
                self.refresh_token_repository.delete(token["id"])
        except Exception as e:
            print(f"Error cleaning up old refresh tokens: {e}")
            pass

    def initiate_password_recovery(self, email: str, request: Request):
        """Initiate password recovery process by sending a recovery email with temporal token"""
        parsed_origin_url = request.headers.get("origin")
        if not (
            (hasattr(parsed_origin_url, "hostname"))
            and (parsed_origin_url.hostname is not None)
            and (
                parsed_origin_url.hostname
                in [
                    "dynabench.org",
                    "dev.dynabench.org",
                    "www.dynabench.org",
                    "beta.dynabench.org",
                    "api.dynabench.org",
                ]
            )
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid origin header",
            )

        user = self.users_service.get_by_email(email)
        if not user:
            user_does_not_exist()
        try:
            forgot_password_token = secrets.token_hex(64)
            expiry_datetime = datetime.now() + timedelta(hours=4)
            self.users_service.store_password_recovery_token(
                user["id"], forgot_password_token, expiry_datetime
            )
            ui_server_host = util.parse_url(request.url._url, parsed_origin_url)

            self.email_helper.send(
                contact=email,
                cc_contact=self.email_sender,
                template_name="forgot_password.txt",
                msg_dict={
                    "username": user["username"],
                    "token": forgot_password_token,
                    "ui_server_host": ui_server_host,
                },
                subject="Password Reset Request",
            )

            return {"status": "success"}
        except Exception as e:
            print(f"Error initiating password recovery: {e}")

    def resolve_password_recovery(self, forgot_token, email, new_password):
        """Resolve password recovery by validating the token and updating the user's password"""
        print("password", new_password)
        user = self.users_service.get_by_forgot_token(forgot_token)
        if not user:
            print("User does not exist")
            user_does_not_exist()
        if datetime.now() > user["forgot_password_token_expiry_date"]:
            bad_token()
        if user["email"] != email:
            user_does_not_exist()

        self.users_repository.update_password(
            user["id"], self.get_hashed_password(new_password)
        )
