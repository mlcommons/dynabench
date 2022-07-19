from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import TaskUserPermission

class TaskUserPermissionRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(TaskUserPermission)