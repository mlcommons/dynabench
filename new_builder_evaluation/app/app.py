from fastapi import FastAPI

from app.api.endpoints import builder, evaluation
from app.domain.evaluation import Evaluation


app = FastAPI()

@app.get("/")
def read_root():
    return Evaluation().trigger_sqs()

app.include_router(builder.router, prefix='/builder', tags=['builder'])
app.include_router(evaluation.router, prefix='/evaluation', tags=['evaluation'])
