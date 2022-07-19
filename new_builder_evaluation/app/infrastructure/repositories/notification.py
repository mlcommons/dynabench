from app.infrastructure.repositories.abstract import AbstractRepository
from app.infrastructure.models.models import Notification

class NotificationRepository(AbstractRepository):
    def __init__(self)-> None:
        super().__init__(Notification)