from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Task

class TaskRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Task)