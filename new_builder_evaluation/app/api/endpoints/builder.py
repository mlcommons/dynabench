# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter
from pydantic import BaseModel


class ModelSingleInput(BaseModel):
    text: str


router = APIRouter()


@router.get("/hello")
async def test():
    return {"api": "Health check"}
