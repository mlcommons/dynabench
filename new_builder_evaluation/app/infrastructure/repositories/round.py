from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Round

class RoundRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Round)