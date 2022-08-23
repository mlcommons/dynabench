# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import FastAPI

from app.api.endpoints import evaluation_decentralized
from app.domain.evaluation_decentralized import Evaluation


app = FastAPI()


@app.get("/")
def read_root():
    return Evaluation().trigger_sqs()


app.include_router(
    evaluation_decentralized.router, prefix="/evaluation", tags=["evaluation"]
)
