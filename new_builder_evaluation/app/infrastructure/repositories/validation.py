from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Validation

class ValidationRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Validation)