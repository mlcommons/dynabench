from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import RoundUserExampleInfo

class RoundUserExampleInfoRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(RoundUserExampleInfo)