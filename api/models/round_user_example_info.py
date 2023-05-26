# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import sqlalchemy as db

from common import helpers as util

from .base import Base, BaseModel
from .round import RoundModel
from .user import User


class RoundUserExampleInfo(Base):
    __tablename__ = "round_user_example_info"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)
    uid = db.Column(db.Integer, db.ForeignKey("users.id"))
    r_realid = db.Column(db.Integer, db.ForeignKey("rounds.id"))
    total_verified_not_correct_fooled = db.Column(db.Integer, default=0)
    total_fooled = db.Column(db.Integer, default=0)
    examples_submitted = db.Column(db.Integer, default=0)

    def __repr__(self):
        return f"<RoundUserExampleInfo {self.id}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class RoundUserExampleInfoModel(BaseModel):
    def __init__(self):
        super().__init__(RoundUserExampleInfo)

    def create(self, uid, r_realid):
        info = RoundUserExampleInfo(uid=uid, r_realid=r_realid)
        self.dbs.add(info)
        return self.dbs.commit()

    def getWithCreateIfNotExist(self, uid, r_realid):
        try:
            info = (
                self.dbs.query(RoundUserExampleInfo)
                .filter(
                    db.and_(
                        RoundUserExampleInfo.r_realid == r_realid,
                        RoundUserExampleInfo.uid == uid,
                    )
                )
                .one()
            )
        except db.orm.exc.NoResultFound:
            self.create(uid, r_realid)
            info = (
                self.dbs.query(RoundUserExampleInfo)
                .filter(
                    db.and_(
                        RoundUserExampleInfo.r_realid == r_realid,
                        RoundUserExampleInfo.uid == uid,
                    )
                )
                .one()
            )
        return info

    def incrementVerifiedNotCorrectFooledCount(self, uid, r_realid):
        info = self.getWithCreateIfNotExist(uid, r_realid)
        info.total_verified_not_correct_fooled = (
            info.total_verified_not_correct_fooled + 1
        )
        self.dbs.commit()

    def incrementFooledCount(self, uid, r_realid):
        info = self.getWithCreateIfNotExist(uid, r_realid)
        info.total_fooled = info.total_fooled + 1
        self.dbs.commit()

    def incrementExamplesSubmittedCount(self, uid, r_realid):
        info = self.getWithCreateIfNotExist(uid, r_realid)
        info.examples_submitted = info.examples_submitted + 1
        self.dbs.commit()

    def getUserLeaderByTidAndRid(self, tid, rid, n=5, offset=0):
        rm = RoundModel()
        return self.getUserLeaderByRoundRealids(
            [rm.getByTidAndRid(tid, rid).id], n, offset
        )

    def getUserLeaderByTid(self, tid, n=5, offset=0):
        rm = RoundModel()
        task_r_realids = []
        for round in rm.getByTid(tid):
            task_r_realids.append(round.id)
        return self.getUserLeaderByRoundRealids(task_r_realids, n, offset)

    def getUserLeaderByRoundRealids(self, r_realids, n=5, offset=0):
        total_fooled_cnt = db.sql.func.sum(RoundUserExampleInfo.total_fooled).label(
            "total_fooled_cnt"
        )
        total_verified_not_correct_fooled_cnt = db.sql.func.sum(
            RoundUserExampleInfo.total_verified_not_correct_fooled
        ).label("total_verified_not_correct_fooled_cnt")
        examples_submitted_cnt = db.sql.func.sum(
            RoundUserExampleInfo.examples_submitted
        ).label("examples_submitted_cnt")

        query_res = (
            self.dbs.query(
                User.id,
                User.username,
                User.avatar_url,
                total_fooled_cnt - total_verified_not_correct_fooled_cnt,
                (total_fooled_cnt - total_verified_not_correct_fooled_cnt)
                / examples_submitted_cnt,
                examples_submitted_cnt,
            )
            .join(RoundUserExampleInfo, RoundUserExampleInfo.uid == User.id)
            .filter(RoundUserExampleInfo.r_realid.in_(r_realids))
            .group_by(RoundUserExampleInfo.uid)
            .order_by(examples_submitted_cnt.desc())
        )

        return query_res.limit(n).offset(n * offset), util.get_query_count(query_res)
