import functools
from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Task
from app import utils
import requests

class TaskRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Task)
        
    def get_id_and_code(self, task):
        instance = self.session.query(self.model).filter((self.model.id == task) |
                                                          (self.model.task_code == task)).first()
        return instance

class DecenTaskRepository():
    def get_by_id(self, task):
        return self.get_id_and_code(task)

    @functools.lru_cache()
    def get_id_and_code(self, task):
        assert task
        r = utils.dynabench_get(f"tasks/{task}")
        j = r.json()
        assert "error" not in j, f"Task not found {task}"
        task = utils.dotdict(j)
        task.task_id = task.id
        return task

