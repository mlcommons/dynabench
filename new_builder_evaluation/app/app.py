# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.
import logging

from dotenv import load_dotenv
from fastapi import FastAPI

from app.api.endpoints import builder, evaluation
from app.domain.evaluation import Evaluation


logging.basicConfig(level=logging.INFO)
load_dotenv()

app = FastAPI()


@app.get("/")
def read_root():
    return Evaluation().trigger_sqs()


app.include_router(builder.router, prefix="/builder", tags=["builder"])
app.include_router(evaluation.router, prefix="/evaluation", tags=["evaluation"])

server = Evaluation()
server.evaluation("flores_small1", "s3://submissions/flores_small1-dummy.zip", "311")
