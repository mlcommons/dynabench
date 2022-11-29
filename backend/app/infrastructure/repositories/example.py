# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import Json

from app.infrastructure.models.models import Example
from app.infrastructure.repositories.abstract import AbstractRepository


class ExampleRepository(AbstractRepository):
    def __init__(self) -> None:
        super().__init__(Example)

    def create_example(
        self,
        context_id: int,
        user_id: int,
        model_wrong: int,
        model_endpoint_name: str,
        input_json: Json,
        output_json: Json,
        metadata: Json,
        tag: str,
    ) -> dict:

        return self.add(
            {
                "cid": context_id,
                "uid": user_id,
                "model_wrong": model_wrong,
                "model_endpoint_name": model_endpoint_name,
                "input_json": input_json,
                "output_json": output_json,
                "metadata": metadata,
                "tag": tag,
            }
        )
