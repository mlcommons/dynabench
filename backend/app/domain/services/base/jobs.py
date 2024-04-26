from app.infrastructure.repositories.jobs import JobRepository


class JobService:
    def __init__(self):
        self.job_repository = JobRepository()

    def metadata_exists(self, model: dict):
        exists =  self.job_repository.metadata_exists(model)
        if exists:
            return True
        return False
    
    def create_registry(self, model: dict):
        self.job_repository.create_registry(model)
    
    def remove_registry(self, model: dict):
        self.job_repository.remove_registry(model)