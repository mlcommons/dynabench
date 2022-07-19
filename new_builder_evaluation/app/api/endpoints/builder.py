from fastapi import APIRouter
from app.domain.builder import Builder
from pydantic import BaseModel

class ModelSingleInput(BaseModel):
    text: str
    
router = APIRouter()

@router.get("/")
async def hello():
    model = Builder()
    api = model.heavy_evaluation()
    return {"api": api}

@router.post("/test")
async def test(model_name):
    model = Builder()
    api = model.principal(model_name)
    return {"api": api}
