# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

from dotenv import load_dotenv
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import sessionmaker

from app.infrastructure.utils.singleton import Singleton


load_dotenv()


DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
CONNECTION_URI = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"
)


class Connection(metaclass=Singleton):
    def __init__(self) -> None:
        self.engine = create_engine(
            CONNECTION_URI, echo=False, pool_pre_ping=True, pool_size=6, pool_recycle=60
        )
        self.metadata = MetaData()

    def refresh_session(self):
        self.session = self.Session()

    def close_session(self):
        self.session.close()

    @property
    def session(self):
        return sessionmaker(bind=self.engine, expire_on_commit=True)()
