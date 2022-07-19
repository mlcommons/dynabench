from fastapi import APIRouter
from app.domain.evaluation import Evaluation
from pydantic import BaseModel

class ModelSingleInput(BaseModel):
    text: str
    
router = APIRouter()

@router.get("/")
async def hello():
    model = Evaluation()
    api = model.trigger_sqs()
    return {"api": api}