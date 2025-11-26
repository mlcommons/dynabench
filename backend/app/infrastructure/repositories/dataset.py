# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.domain.schemas.base.dataset import UpdateDatasetInfo
from app.infrastructure.models.models import Dataset
from app.infrastructure.repositories.abstract import AbstractRepository


class DatasetRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Dataset)

    def get_scoring_datasets(self, task_id: int, dataset_name: str = None) -> dict:
        scoring_datasets = self.session.query(self.model).filter(
            (self.model.access_type == "scoring") & (self.model.tid == task_id)
        )
        if dataset_name:
            scoring_datasets = scoring_datasets.filter(self.model.name == dataset_name)
        jsonl_scoring_datasets = []
        for scoring_dataset in scoring_datasets:
            jsonl_scoring_dataset = {}
            jsonl_scoring_dataset["dataset"] = scoring_dataset.name
            jsonl_scoring_dataset["round_id"] = scoring_dataset.rid
            jsonl_scoring_dataset["dataset_id"] = scoring_dataset.id
            jsonl_scoring_dataset["tags"] = scoring_dataset.tags
            jsonl_scoring_datasets.append(jsonl_scoring_dataset)
        return jsonl_scoring_datasets

    def get_not_scoring_datasets(self, task_id: int) -> dict:
        no_scoring_datasets = self.session.query(self.model).filter(
            (self.model.access_type != "scoring") & (self.model.tid == task_id)
        )

        jsonl_no_scoring_datasets = []
        for no_scoring_dataset in no_scoring_datasets:
            jsonl_no_scoring_dataset = {}
            jsonl_no_scoring_dataset["dataset"] = no_scoring_dataset.name
            jsonl_no_scoring_dataset["round_id"] = no_scoring_dataset.rid
            jsonl_no_scoring_dataset["dataset_id"] = no_scoring_dataset.id
            jsonl_no_scoring_datasets.append(jsonl_no_scoring_dataset)

        return jsonl_no_scoring_datasets

    def get_dataset_info_by_name(self, dataset_name: str) -> dict:
        instance = (
            self.session.query(self.model).filter(self.model.name == dataset_name).one()
        )
        instance = self.instance_converter.instance_to_dict(instance)
        return instance

    def get_order_datasets_by_task_id(self, task_id: int) -> dict:
        return (
            self.session.query(self.model)
            .order_by(self.model.id)
            .filter(self.model.tid == task_id)
            .all()
        )

    def get_order_scoring_datasets_by_task_id(self, task_id: int) -> dict:
        return (
            self.session.query(self.model)
            .order_by(self.model.id)
            .filter(self.model.tid == task_id)
            .filter(self.model.access_type == "scoring")
            .all()
        )

    def get_dataset_name_by_id(self, dataset_id: int) -> dict:
        return (
            self.session.query(self.model.name)
            .filter(self.model.id == dataset_id)
            .one()
        )

    def get_dataset_has_downstream(self, dataset_id: int) -> dict:
        return (
            self.session.query(self.model.has_downstream)
            .filter(self.model.id == dataset_id)
            .one()
        )

    def get_dataset_info_by_id(self, dataset_id: int) -> dict:
        instance = (
            self.session.query(self.model).filter(self.model.id == dataset_id).one()
        )
        instance = self.instance_converter.instance_to_dict(instance)
        return instance

    def get_scoring_datasets_by_task_id(self, task_id: int) -> dict:
        return (
            self.session.query(self.model.id)
            .filter(self.model.tid == task_id)
            .filter(self.model.access_type == "scoring")
            .all()
        )

    def create_dataset_in_db(
        self, task_id: int, dataset_name: str, access_type: str
    ) -> dict:
        dataset = Dataset(
            tid=task_id, name=dataset_name, access_type=access_type, rid=0
        )
        with self.session as session:
            session.add(dataset)
            session.commit()
            return dataset

    def get_downstream_datasets(self, task_id: int) -> dict:
        downstream_datasets = (
            self.session.query(self.model)
            .filter(self.model.tid == task_id)
            .filter(self.model.access_type == "scoring")
        )
        jsonl_downstream_datasets = []
        for downstream_dataset in downstream_datasets:
            jsonl_downstream_dataset = {}
            jsonl_downstream_dataset["dataset"] = downstream_dataset.name
            jsonl_downstream_dataset["round_id"] = downstream_dataset.rid
            jsonl_downstream_dataset["dataset_id"] = downstream_dataset.id
            jsonl_downstream_datasets.append(jsonl_downstream_dataset)

        return jsonl_downstream_datasets

    def get_dataset_weight(self, dataset_id: int) -> dict:
        return (
            self.session.query(self.model.weight)
            .filter(self.model.id == dataset_id)
            .one()
        )

    def get_datasets_by_task_id(self, task_id: int):
        return self.session.query(self.model).filter(self.model.tid == task_id).all()

    def update_dataset_info(self, dataset_id: int, update_data: UpdateDatasetInfo):
        self.session.query(self.model).filter(self.model.id == dataset_id).update(
            update_data
        )
        with self.session as session:
            session.commit()

    def hide_dataset(self, dataset_id: int):
        self.session.query(self.model).filter(self.model.id == dataset_id).update(
            {"tid": 0}
        )
        with self.session as session:
            session.commit()
