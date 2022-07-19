from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import YoYoLock

class YoYoLockRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(YoYoLock)