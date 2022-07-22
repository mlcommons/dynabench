from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Score

class ScoreRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Score)
