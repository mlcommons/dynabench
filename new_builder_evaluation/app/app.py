# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import FastAPI

from app.api.endpoints import aimodels, builder, evaluation


app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(builder.router, prefix="/builder", tags=["builder"])
app.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])
app.include_router(aimodels.router, prefix="/aimodels", tags=["aimodels"])
