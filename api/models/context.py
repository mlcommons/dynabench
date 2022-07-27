# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db
from sqlalchemy import case

from .base import Base, BaseModel


class Context(Base):
    __tablename__ = "contexts"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)

    r_realid = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    round = db.orm.relationship("Round", foreign_keys="Context.r_realid")

    context_json = db.Column(db.Text)

    tag = db.Column(db.Text)

    metadata_json = db.Column(db.Text)  # e.g. source, or whatever

    total_used = db.Column(db.Integer, default=0)

    last_used = db.Column(db.DateTime, nullable=True)

    def __repr__(self):
        return f"<Context {self.context_json}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class ContextModel(BaseModel):
    def __init__(self):
        super().__init__(Context)

    def getRandom(self, rid, n=1, tags=None):
        # https://stackoverflow.com/questions/60805/getting-random-row-through-sqlalchemy
        # return dbs.query(Context).filter(Context.tid == tid).filter(
        #       Context.rid == rid).options(db.orm.load_only('id')).offset(
        #        db.sql.func.floor(
        #            db.sql.func.random() *
        #            dbs.query(db.sql.func.count(Context.id))
        #        )
        #    ).limit(n).all()

        result = self.dbs.query(Context)

        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa

        return (
            result.filter(Context.r_realid == rid)
            .order_by(db.sql.func.rand())
            .limit(n)
            .all()
        )

    def getRandomMin(self, rid, n=1, tags=None):
        result = self.dbs.query(Context)

        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa

        return (
            result.filter(Context.r_realid == rid)
            .order_by(Context.total_used.asc(), db.sql.func.rand())
            .limit(n)
            .all()
        )

    def getRandomLeastFooled(self, rid, n=1, tags=None):
        from models.example import Example

        result = self.dbs.query(Context).filter(Context.r_realid == rid)
        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa

        least_fooled_examples_sub_query = (
            self.dbs.query(
                Example.cid,
                db.sql.func.sum(
                    db.case(value=Example.model_wrong, whens={1: 1}, else_=0)
                ).label("num_fooled"),
            )
            .group_by(Example.cid)
            .subquery()
        )

        return (
            result.join(
                least_fooled_examples_sub_query,
                Context.id == least_fooled_examples_sub_query.c.cid,
                isouter=True,
            )
            .order_by(
                least_fooled_examples_sub_query.c.num_fooled.asc(), db.sql.func.rand()
            )
            .limit(n)
            .all()
        )

    def getContextValidationResults(
        self, num_matching_validations, validate_non_fooling=False, example_tags=None
    ):
        from sqlalchemy import distinct

        from models.example import Example
        from models.validation import LabelEnum, Validation

        cnt_correct_val = db.sql.func.sum(
            case([(Validation.label == LabelEnum.correct, 1)], else_=0)
        ).label("cnt_correct_val")
        cnt_incorrect_val = db.sql.func.sum(
            case([(Validation.label == LabelEnum.incorrect, 1)], else_=0)
        ).label("cnt_incorrect_val")
        cnt_flagged_val = db.sql.func.sum(
            case([(Validation.label == LabelEnum.flagged, 1)], else_=0)
        ).label("cnt_flagged_val")
        cnt_total_val = db.sql.func.count(distinct(Validation.id)).label(
            "cnt_total_val"
        )

        example_with_validation = (
            self.dbs.query(
                Example.cid,
                Example.id,
                cnt_correct_val,
                cnt_incorrect_val,
                cnt_flagged_val,
                cnt_total_val,
            )
            .join(Validation, Validation.eid == Example.id, isouter=True)
            .group_by(Example.cid, Example.id)
        )

        if not validate_non_fooling:
            example_with_validation = example_with_validation.filter(
                Example.model_wrong.is_(True)  # noqa
            )

        if example_tags:
            example_with_validation = example_with_validation.filter(
                Example.tag.in_(example_tags)
            )

        example_with_validation_data = example_with_validation.subquery()

        cnt_correct_examples = db.sql.func.sum(
            case(
                [
                    (
                        example_with_validation_data.c.cnt_correct_val
                        >= num_matching_validations,
                        1,
                    )
                ],
                else_=0,
            )
        ).label("cnt_correct_examples")
        cnt_failed_examples = db.sql.func.sum(
            case(
                [
                    (
                        db.and_(
                            example_with_validation_data.c.cnt_correct_val
                            < num_matching_validations,
                            db.or_(
                                example_with_validation_data.c.cnt_incorrect_val
                                >= num_matching_validations,
                                example_with_validation_data.c.cnt_flagged_val
                                >= num_matching_validations,
                            ),
                        ),
                        1,
                    )
                ],
                else_=0,
            )
        ).label("cnt_failed_examples")
        cnt_inflight_examples = db.sql.func.sum(
            case(
                [
                    (
                        db.and_(
                            example_with_validation_data.c.cnt_correct_val
                            < num_matching_validations,
                            example_with_validation_data.c.cnt_incorrect_val
                            < num_matching_validations,
                            example_with_validation_data.c.cnt_flagged_val
                            < num_matching_validations,
                            example_with_validation_data.c.cnt_total_val > 0,
                        ),
                        1,
                    )
                ],
                else_=0,
            )
        ).label("cnt_inflight_examples")
        cnt_pre_val_examples = db.sql.func.sum(
            case([(example_with_validation_data.c.cnt_total_val == 0, 1)], else_=0)
        ).label("cnt_pre_val_examples")
        contexts_with_example_stats = self.dbs.query(
            example_with_validation_data.c.cid,
            cnt_correct_examples,
            cnt_failed_examples,
            cnt_inflight_examples,
            cnt_pre_val_examples,
        ).group_by(example_with_validation_data.c.cid)
        return (
            contexts_with_example_stats,
            example_with_validation,
            # context stats
            (
                cnt_correct_examples,
                cnt_failed_examples,
                cnt_inflight_examples,
                cnt_pre_val_examples,
            ),
            # example stats
            (cnt_correct_val, cnt_incorrect_val, cnt_flagged_val, cnt_total_val),
        )

    def getRandomValidationFailed(self, rid, num_matching_validations, n=1, tags=None):
        result = self.dbs.query(Context).filter(Context.r_realid == rid)
        if tags:
            result = result.filter(Context.tag.in_(tags))  # noqa
        contexts_with_example_stats, _, _, _ = self.getContextValidationResults(
            num_matching_validations
        )
        contexts_with_example_stats = contexts_with_example_stats.subquery()
        return_result = (
            result.join(
                contexts_with_example_stats,
                contexts_with_example_stats.c.cid == Context.id,
            )
            .filter(
                db.and_(
                    contexts_with_example_stats.c.cnt_inflight_examples == 0,
                    contexts_with_example_stats.c.cnt_correct_examples == 0,
                    contexts_with_example_stats.c.cnt_failed_examples > 0,
                    contexts_with_example_stats.c.cnt_pre_val_examples == 0,
                )
            )
            .order_by(db.sql.func.rand())
            .limit(n)
        )

        return return_result.all()

    def incrementCountDate(self, cid):
        c = self.get(cid)
        if c:
            c.total_used = (c.total_used + 1) if c.total_used is not None else 1
            c.last_used = db.sql.func.now()
            self.dbs.commit()
