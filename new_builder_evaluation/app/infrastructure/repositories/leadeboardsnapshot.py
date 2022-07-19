from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import LeaderboardSnapshot

class LeaderboardSnapshotRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(LeaderboardSnapshot)