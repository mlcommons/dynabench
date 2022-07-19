from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import RefreshToken

class RefreshTokenRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(RefreshToken)