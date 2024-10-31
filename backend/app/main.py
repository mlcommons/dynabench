# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import auth
from app.api.endpoints.base import (
    context,
    dataset,
    example,
    historical_data,
    model,
    round,
    rounduserexample,
    score,
    task,
    task_proposals,
    user,
)
from app.api.endpoints.builder_and_evaluation import evaluation
from app.infrastructure.connection import Connection


load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://www.dynabench.org",
    "https://front-dev.dynabench.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(model.router, prefix="/model", tags=["model"])
app.include_router(task.router, prefix="/task", tags=["task"])
app.include_router(context.router, prefix="/context", tags=["context"])
app.include_router(example.router, prefix="/example", tags=["example"])
app.include_router(score.router, prefix="/score", tags=["score"])
app.include_router(dataset.router, prefix="/dataset", tags=["dataset"])
app.include_router(
    rounduserexample.router, prefix="/rounduserexample", tags=["rounduserexample"]
)
app.include_router(
    evaluation.router, prefix="/builder_evaluation/evaluation", tags=["evaluation"]
)
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(
    task_proposals.router, prefix="/task_proposals", tags=["task_proposals"]
)
app.include_router(
    historical_data.router, prefix="/historical_data", tags=["historical_data"]
)
app.include_router(round.router, prefix="/round", tags=["round"])
