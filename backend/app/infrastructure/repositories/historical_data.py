# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import HistoricalData
from app.infrastructure.repositories.abstract import AbstractRepository


class HistoricalDataRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(HistoricalData)

    def get_historical_data_by_task_and_user(self, task_id: int, user_id: int):
        return (
            self.session.query(HistoricalData.history)
            .filter(HistoricalData.task_id == task_id)
            .filter(HistoricalData.user_id == user_id)
            .all()
        )

    def save_historical_data(self, task_id: int, user_id: int, data: str):
        model = self.model(
            task_id=task_id,
            user_id=user_id,
            history=data,
        )
        self.session.add(model)
        self.session.flush()
        self.session.commit()
        return self.get_historical_data_by_task_and_user(task_id, user_id)

    def delete_historical_data(self, task_id: int, user_id: int):
        self.session.query(HistoricalData).filter(
            HistoricalData.task_id == task_id
        ).filter(HistoricalData.user_id == user_id).delete()
        self.session.flush()
        self.session.commit()

    def check_if_historical_data_exists(self, task_id: int, user_id: int, data: str):
        return (
            self.session.query(HistoricalData)
            .filter(HistoricalData.task_id == task_id)
            .filter(HistoricalData.user_id == user_id)
            .filter(HistoricalData.history == data)
            .first()
        )

    def check_signed_consent(self, task_id: int, user_id: int):
        return (
            self.session.query(HistoricalData)
            .filter(HistoricalData.task_id == task_id)
            .filter(HistoricalData.user_id == user_id)
            .filter(HistoricalData.history == "consent")
            .first()
        )
