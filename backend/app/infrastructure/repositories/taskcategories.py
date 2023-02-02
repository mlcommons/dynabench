# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from app.infrastructure.models.models import Category, TaskCategories
from app.infrastructure.repositories.abstract import AbstractRepository


class TaskCategoriesRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(TaskCategories)

    def get_tasks_categories(self):
        return (
            self.session.query(TaskCategories.id_task, Category.name)
            .join(Category, Category.id == TaskCategories.id_category)
            .all()
        )
