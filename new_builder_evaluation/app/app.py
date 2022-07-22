# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.api.endpoints import builder, evaluation
from fastapi import FastAPI


app = FastAPI()


@app.get("/")
def read_root():
    return "hello word"


app.include_router(builder.router, prefix="/builder", tags=["builder"])
app.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])
