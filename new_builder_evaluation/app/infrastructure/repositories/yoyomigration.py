from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import YoyoMigration

class YoyoMigrationRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(YoyoMigration)