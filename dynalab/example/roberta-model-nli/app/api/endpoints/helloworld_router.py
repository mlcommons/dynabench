# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter


router = APIRouter()


@router.get("/")
async def hello():
    return {"message": "Hello World"}
