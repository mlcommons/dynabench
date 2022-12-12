# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import auth, model_centric
from app.api.endpoints.base import model, task
from app.api.endpoints.builder_and_evaluation import evaluation


load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(
    model_centric.router, prefix="/model_centric", tags=["model_centric"]
)
app.include_router(
    evaluation.router, prefix="/builder_evaluation/evaluation", tags=["evaluation"]
)
