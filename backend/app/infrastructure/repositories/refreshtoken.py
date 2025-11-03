# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import RefreshToken
from app.infrastructure.repositories.abstract import AbstractRepository


class RefreshTokenRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(RefreshToken)

    def get_by_token(self, token: str) -> RefreshToken:
        instance = (
            self.session.query(RefreshToken).filter(RefreshToken.token == token).first()
        )
        return self.instance_converter.instance_to_dict(instance)

    def get_all_by_user_id(self, user_id: int):
        instances = (
            self.session.query(RefreshToken).filter(RefreshToken.uid == user_id).all()
        )
        return [
            self.instance_converter.instance_to_dict(instance) for instance in instances
        ]
