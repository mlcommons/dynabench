# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
from fastapi import FastAPI
from mangum import Mangum

from app.api.endpoints import helloworld_router, model


app = FastAPI()

app.include_router(helloworld_router.router, prefix="/hello", tags=["hello"])
app.include_router(model.router, prefix="/model", tags=["hello"])


@app.get("/")
def read_root():
    return {"Hello": "Welcome to the jungle"}


handler = Mangum(app)
