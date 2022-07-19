from fastapi import FastAPI

from app.api.endpoints import builder, evaluation

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "Welcome to builder and evaluation"}

app.include_router(builder.router, prefix='/builder', tags=['builder'])
app.include_router(evaluation.router, prefix='/evaluation', tags=['evaluation'])

