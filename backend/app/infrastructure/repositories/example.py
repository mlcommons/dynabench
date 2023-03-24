# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import Json
from sqlalchemy import func

from app.infrastructure.models.models import Context, Example
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
                "retracted": 0,
                "split": "undecided",
                "flagged": 0,
                "total_verified": 0,
            }
        )

    def get_example_to_validate(
        self,
        real_round_id: int,
        user_id: int,
        num_matching_validations: int,
        validate_non_fooling: bool,
    ):
        return (
            self.session.query(Example, Context)
            .join(Context, Example.cid == Context.id)
            .filter(Context.r_realid == real_round_id)
            .filter(Example.uid != user_id)
            .filter(Example.retracted == 0)
            .filter(Example.total_verified < num_matching_validations)
            .order_by(func.random())
            .first()
        )

    def increment_counter_total_verified(self, example_id: int):
        example = self.get_by_id(example_id)
        example.total_verified += 1
        self.session.commit()

    def increment_counter_total_correct(self, example_id: int):
        example = self.get_by_id(example_id)
        example.verified_correct += 1
        self.session.commit()

    def increment_counter_total_incorrect(self, example_id: int):
        example = self.get_by_id(example_id)
        example.verified_incorrect += 1
        self.session.commit()

    def increment_counter_total_flagged(self, example_id: int):
        example = self.get_by_id(example_id)
        example.verified_flagged += 1
        self.session.commit()
