# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from pydantic import Json
from sqlalchemy import exists, func, not_

from app.infrastructure.models.models import Context, Example, Round, Validation
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
        text: str,
    ) -> dict:
        return self.add(
            {
                "cid": context_id,
                "uid": user_id,
                "model_wrong": model_wrong,
                "model_endpoint_name": model_endpoint_name,
                "input_json": input_json,
                "output_json": output_json,
                "metadata_json": metadata,
                "tag": tag,
                "retracted": 0,
                "split": "undecided",
                "flagged": 0,
                "total_verified": 0,
                "text": text,
            }
        )

    def get_validates_examples_by_user_id(self, user_id: int):
        return (
            self.session.query(Validation.eid).filter(Validation.uid == user_id).all()
        )

    def get_example_to_validate(
        self,
        real_round_id: int,
        user_id: int,
        num_matching_validations: int,
    ):
        validated_examples = self.get_validates_examples_by_user_id(user_id)
        return (
            self.session.query(Example, Context)
            .join(Context, Example.cid == Context.id)
            .filter(Context.r_realid == real_round_id)
            .filter(Example.uid != user_id)
            .filter(Example.retracted == 0)
            .filter(Example.total_verified < num_matching_validations)
            .filter(~Example.id.in_([item[0] for item in validated_examples]))
            .order_by(func.random())
            .first()
        )

    def get_example_to_validate_fooling(
        self, real_round_id: int, user_id: int, num_matching_validations: int
    ):
        validated_examples = self.get_validates_examples_by_user_id(user_id)

        return (
            self.session.query(Example, Context)
            .join(Context, Example.cid == Context.id)
            .filter(Context.r_realid == real_round_id)
            .filter(Example.uid != user_id)
            .filter(Example.retracted == 0)
            .filter(Example.total_verified < num_matching_validations)
            .filter(Example.model_wrong == 1)
            .filter(~Example.id.in_([item[0] for item in validated_examples]))
            .order_by(func.random())
            .first()
        )

    def increment_counter_total_verified(self, example_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == example_id).update(
                {self.model.total_verified: self.model.total_verified + 1}
            )
            session.flush()
            session.commit()

    def increment_counter_total_correct(self, example_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == example_id).update(
                {self.model.verified_correct: self.model.verified_correct + 1}
            )
            session.flush()
            session.commit()

    def increment_counter_total_incorrect(self, example_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == example_id).update(
                {self.model.verified_incorrect: self.model.verified_incorrect + 1}
            )
            session.flush()
            session.commit()

    def increment_counter_total_flagged(self, example_id: int):
        with self.session as session:
            session.query(self.model).filter(self.model.id == example_id).update(
                {self.model.verified_flagged: self.model.verified_flagged + 1}
            )
            session.flush()
            session.commit()

    def mark_as_verified(self, example_id: int):
        example = self.get_by_id(example_id)
        example["verified"] = 1
        with self.session as session:
            session.flush()
            session.commit()

    def update_creation_generative_example_by_example_id(
        self, example_id: int, model_input: Json, metadata: Json
    ):
        with self.session as session:
            session.query(self.model).filter_by(id=example_id).update(
                {"input_json": model_input, "metadata_json": metadata}
            )
            session.flush()
            session.commit()

    def download_created_examples_user(self, task_id: int, user_id: int, amount: int):
        return (
            self.session.query(self.model, Context)
            .join(Context, Example.cid == Context.id)
            .join(Round, Context.r_realid == Round.id)
            .filter(Round.tid == task_id)
            .filter(Example.uid == user_id)
            .order_by(func.random())
            .limit(amount)
            .all()
        )

    def download_all_created_examples(self, task_id: int):
        return (
            self.session.query(self.model, Context, Round.rid)
            .join(Context, Example.cid == Context.id)
            .join(Round, Context.r_realid == Round.id)
            .filter(Round.tid == task_id)
            .all()
        )

    def get_active_tasks_by_user_id(self, user_id: int):
        return (
            self.session.query(Round.tid)
            .join(Context, Round.id == Context.r_realid)
            .join(Example, Context.id == Example.cid)
            .filter(Example.uid == user_id)
            .distinct()
            .all()
        )

    def get_total_examples_by_user_id(self, user_id: int):
        return (
            self.session.query(func.count(Example.id))
            .filter(Example.uid == user_id)
            .scalar()
        )

    def get_model_fooling_rate_by_user_id(self, user_id: int):
        return (
            self.session.query(
                func.round(
                    func.coalesce(
                        func.sum(Example.model_wrong) / func.count(Example.id), 0
                    ),
                    2,
                )
            )
            .filter(Example.uid == user_id)
            .scalar()
        )

    def get_used_models_by_user_id_and_task_id(self, user_id: int, task_id: int):
        # Get the latest round (max rid) for the given task
        latest_round = (
            self.session.query(Round)
            .filter(Round.tid == task_id)
            .order_by(Round.rid.desc())
            .first()
        )

        if not latest_round:
            return []

        # Get all context IDs associated with this round
        context_ids = (
            self.session.query(Context.id)
            .filter(Context.r_realid == latest_round.id)
            .all()
        )

        if not context_ids:
            return []

        # Extract IDs from the result tuples
        context_id_list = [cid[0] for cid in context_ids]

        # Get all examples with matching contexts
        return (
            self.session.query(Example.model_endpoint_name)
            .filter(Example.uid == user_id if user_id else True)
            .filter(Example.cid.in_(context_id_list))
            .distinct()
            .all()
        )

    def get_examples_by_task_id_and_round_id_with_validations_ids(
        self, task_id: int, round_id: int
    ):
        try:
            validation_ids_concat = func.group_concat(Validation.id)
            validations_query = (
                self.session.query(Example, validation_ids_concat)
                .join(Context, Example.cid == Context.id)
                .join(Round, Context.r_realid == Round.id)
                .filter(Round.tid == task_id)
                .filter(Round.rid == round_id)
                .join(Validation, Validation.eid == Example.id)
                .group_by(Validation.eid)
            )
            empty_concat = func.group_concat("")

            no_validations_query = (
                self.session.query(Example, empty_concat)
                .join(Context, Example.cid == Context.id)
                .join(Round, Context.r_realid == Round.id)
                .filter(Round.tid == task_id)
                .filter(Round.rid == round_id)
                .filter(not_(exists().where(Validation.eid == Example.id)))
                .group_by(Example.id)
            )
            return validations_query.union(no_validations_query).all()
        except Exception as e:
            # Handle any database-related exceptions
            print(
                f"Error in get_examples_by_task_id_and_round_id_with_validations_ids: {e}"
            )
            return []
