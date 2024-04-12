# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.repositories.historical_data import HistoricalDataRepository


class HistoricalDataService:
    def __init__(self):
        self.historical_data_repository = HistoricalDataRepository()

    def get_historical_data_by_task_and_user(self, task_id: int, user_id: int):
        return self.historical_data_repository.get_historical_data_by_task_and_user(
            task_id, user_id
        )

    def save_historical_data(self, task_id: int, user_id: int, data: str):
        if not self.historical_data_repository.check_if_historical_data_exists(
            task_id, user_id, data
        ):
            return self.historical_data_repository.save_historical_data(
                task_id, user_id, data
            )

    def check_if_historical_data_exists(self, task_id: int, user_id: int, data: str):
        check_if_exist = (
            self.historical_data_repository.check_if_historical_data_exists(
                task_id, user_id, data
            )
        )
        if check_if_exist:
            return True
        return False

    def get_occurrences_with_more_than_one_hundred(self, task_id: int):
        historical_data = (
            self.historical_data_repository.get_occurrences_with_more_than_one_hundred(
                task_id
            )
        )
        return [item["history"] for item in historical_data]

    def delete_historical_data(self, task_id: int, user_id: int):
        self.historical_data_repository.delete_historical_data(task_id, user_id)
