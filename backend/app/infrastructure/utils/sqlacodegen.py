# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

from dotenv import load_dotenv
from sqlacodegen.codegen import CodeGenerator
from sqlalchemy import MetaData, create_engine


load_dotenv()


DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
CONNECTION_URI = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4"
)
engine = create_engine(CONNECTION_URI)
metadata = MetaData(bind=engine)
metadata.reflect()
generator = CodeGenerator(metadata)
with open("outfile.py", "w+") as f:
    generator.render(f)
