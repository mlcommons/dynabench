from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import YoYoLog

class YoYoLogRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(YoYoLog)