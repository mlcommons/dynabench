from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Task

class TaskRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Task)
        
    def get_id_and_code(self, task):
        instance = self.session.query(self.model).filter((self.model.id == task) |
                                                          (self.model.task_code == task)).first()
        return instance