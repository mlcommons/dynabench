from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Model

class ModelRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Model)