from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Context

class ContextRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Context)