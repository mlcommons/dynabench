from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import User

class UserRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(User)