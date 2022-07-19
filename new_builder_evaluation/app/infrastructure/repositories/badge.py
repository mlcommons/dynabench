from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Badge

class BadgeRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Badge)