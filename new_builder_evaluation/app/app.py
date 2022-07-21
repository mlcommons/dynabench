import logging

from fastapi import FastAPI
from dotenv import load_dotenv

from app.api.endpoints import builder, evaluation
from app.domain.evaluation import Evaluation

logging.basicConfig(level=logging.INFO)
load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    return Evaluation().trigger_sqs()

app.include_router(builder.router, prefix='/builder', tags=['builder'])
app.include_router(evaluation.router, prefix='/evaluation', tags=['evaluation'])


server = Evaluation()
server.evaluation("flores_small1", "s3://submissions/flores_small1-dummy.zip")
