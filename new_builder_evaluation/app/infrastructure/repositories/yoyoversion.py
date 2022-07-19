from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import YoyoVersion

class YoyoVersionRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(YoyoVersion)