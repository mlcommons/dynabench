from fastapi import APIRouter
from pydantic import BaseModel

from app.domain.evaluation_decentralized import Evaluation


class ModelSingleInput(BaseModel):
    text: str


router = APIRouter()

@router.get("/test_des")
async def test_des():
    model = Evaluation()
    api = model.test_eval(
        "sentiment",
        "models/sentiment/123-julian_sentiment.zip",
        3333
        )
    return {"api": api}
