from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Dataset

class DatasetRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Dataset)

    def get_scoring_datasets(self, task_id:int, round_id:int) -> dict:
        instances = self.session.query(self.model).filter((self.model.access_type == 'scoring') &
                                                          (self.model.tid == task_id) &
                                                          (self.model.rid == round_id))
        return instances