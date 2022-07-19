from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import LeaderboardConfiguration

class LeaderboardConfigurationRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(LeaderboardConfiguration)