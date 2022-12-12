# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import math

import pandas as pd
import sqlalchemy as db

import common.helpers as util
from models.dataset import AccessTypeEnum, Dataset
from models.round import Round
from models.task import TaskModel
from models.user import User

from .base import Base, BaseModel
from .model import Model


class Score(Base):
    __tablename__ = "scores"
    __table_args__ = {"mysql_charset": "utf8mb4", "mysql_collate": "utf8mb4_general_ci"}

    id = db.Column(db.Integer, primary_key=True)
    mid = db.Column(db.Integer, db.ForeignKey("models.id"), nullable=False)
    model = db.orm.relationship("Model", foreign_keys="Score.mid")
    r_realid = db.Column(db.Integer, db.ForeignKey("rounds.id"), nullable=False)
    round = db.orm.relationship("Round", foreign_keys="Score.r_realid")
    did = db.Column(db.Integer, db.ForeignKey("datasets.id"), nullable=False)

    desc = db.Column(db.String(length=255))
    longdesc = db.Column(db.Text)

    pretty_perf = db.Column(db.String(length=255))
    perf = db.Column(db.Float(), default=0.0)
    perf_std = db.Column(db.Float)

    raw_output_s3_uri = db.Column(db.Text)
    metadata_json = db.Column(db.Text)

    memory_utilization = db.Column(db.Float)
    examples_per_second = db.Column(db.Float)

    fairness = db.Column(db.Float)
    robustness = db.Column(db.Float)

    def __repr__(self):
        return f"<Score {self.id}>"

    def to_dict(self, safe=True):
        d = {}
        for column in self.__table__.columns:
            d[column.name] = getattr(self, column.name)
        return d


class ScoreModel(BaseModel):
    def __init__(self):
        super().__init__(Score)

    def create(self, r_realid, model_id, **kwargs):
        m = Score(r_realid=r_realid, mid=model_id, **kwargs)
        self.dbs.add(m)
        return self.dbs.commit()

    def update(self, id, **kwargs):
        u = self.dbs.query(Score).filter(Score.id == id)
        u.update(kwargs)
        self.dbs.commit()

    def delete(self, score):
        self.dbs.delete(score)
        self.dbs.commit()
        return True

    def bulk_create(self, model_id, score_objs=[], raw_upload_data=""):
        self.dbs.add_all(
            [
                Score(
                    r_realid=score_obj["r_realid"],
                    mid=model_id,
                    did=score_obj["did"],
                    desc=score_obj.get("desc", None),
                    longdesc=score_obj.get("longdesc", None),
                    pretty_perf=score_obj["pretty_perf"],
                    perf=score_obj["perf"],
                    raw_upload_data=raw_upload_data,
                    eval_id_start=score_obj.get("start_index", -1),
                    eval_id_end=score_obj.get("end_index", -1),
                    metadata_json=score_obj["metadata_json"],
                    memory_utilization=score_obj.get("memory_utilization", None),
                    examples_per_second=score_obj.get("examples_per_second", None),
                )
                for score_obj in score_objs
            ]
        )
        return self.dbs.commit()

    def getLeaderboardTopPerformingTags(
        self, tid, limit=5, offset=0, specific_tag=None
    ):
        tm = TaskModel()
        task = tm.get(tid)
        include_unpublished_models = task.unpublished_models_in_leaderboard

        scores_users_datasets_models = (
            self.dbs.query(Score, User, Dataset, Model)
            .join(Dataset, Dataset.id == Score.did)
            .join(Model, Score.mid == Model.id)
            .join(User, User.id == Model.uid)
            .filter(Model.tid == tid)
            .filter(Dataset.access_type == AccessTypeEnum.scoring)
        )
        if not include_unpublished_models:
            scores_users_datasets_models = scores_users_datasets_models.filter(
                Model.is_published
            )

        dataset_name_to_tag_performances = {}
        for score, user, dataset, model in scores_users_datasets_models:
            if dataset.name not in dataset_name_to_tag_performances:
                dataset_name_to_tag_performances[dataset.name] = {}
            if score.metadata_json is not None:
                metadata = util.json_decode(score.metadata_json)
                for tag_perf_dict in metadata.get("perf_by_tag", []):

                    # if we want only the top performance for a specific tag,
                    # don't include other tags.
                    if specific_tag is not None:
                        if tag_perf_dict["tag"] != specific_tag:
                            continue

                    if (
                        tag_perf_dict["tag"]
                        not in dataset_name_to_tag_performances[dataset.name]
                    ):
                        dataset_name_to_tag_performances[dataset.name][
                            tag_perf_dict["tag"]
                        ] = []
                    dataset_name_to_tag_performances[dataset.name][
                        tag_perf_dict["tag"]
                    ].append(
                        {
                            "model_id": model.id,
                            "model_name": model.name if model.is_published else None,
                            "uid": user.id if model.is_published else None,
                            "username": user.username if model.is_published else None,
                            "perf": tag_perf_dict["perf"],
                        }
                    )

                    # if we want only the top performance for a specific tag
                    # and we have already found this tag, don't loop anymore.
                    if specific_tag is not None:
                        if tag_perf_dict["tag"] == specific_tag:
                            break
        dataset_name_to_top_tag_performances = {}
        for (
            dataset_name,
            all_tag_performances,
        ) in dataset_name_to_tag_performances.items():
            if dataset_name not in dataset_name_to_top_tag_performances:
                dataset_name_to_top_tag_performances[dataset_name] = []
            for tag, tag_performances in all_tag_performances.items():
                dataset_name_to_top_tag_performances[dataset_name].append(
                    {
                        "tag": tag,
                        "top_perf_info": sorted(
                            tag_performances,
                            key=lambda tag_perf_info: tag_perf_info["perf"],
                            reverse=True,
                        )[0],
                    }
                )
        dataset_name_to_top_tag_performances_cutoff = {}
        for (
            dataset_name,
            top_tag_performances,
        ) in dataset_name_to_top_tag_performances.items():
            dataset_name_to_top_tag_performances_cutoff[dataset_name] = {
                "count": len(top_tag_performances),
                "data": sorted(
                    top_tag_performances,
                    key=lambda tag_info: tag_info["top_perf_info"]["perf"],
                    reverse=True,
                )[offset : offset + limit],
            }
        return util.json_encode(dataset_name_to_top_tag_performances_cutoff)

    # calculate the dynascore
    # normalization is automatically done via AMRS
    # e.g., raw FLOPs are on the scale of 10e7 but the AMRS-converted compute is
    # at approximately the same scale as all the other metrics (not necessarily
    # in a fixed range like [0, 100], though)
    def dynascore(
        self,
        perf_metric_field_name,
        data,
        weights,
        direction_multipliers,
        offsets,
        delta_cutoff_proportion=0.0001,
    ):
        converted_data = data.copy(deep=True)
        converted_data.sort_values(perf_metric_field_name, inplace=True)
        for metric in list(data):
            converted_data[metric] = (
                direction_multipliers[metric] * converted_data[metric] + offsets[metric]
            )
        converted_data["dynascore"] = 0

        denominator = sum(weights.values())
        for key in weights:
            weights[key] /= denominator

        # We don't want small denominators to make AMRS super sensitive to noise in
        # the model submissions.
        delta = converted_data.diff()
        delta_threshold = (
            converted_data[perf_metric_field_name].max() * delta_cutoff_proportion
        )
        satisfied_indices = []
        for index in range(len(delta[perf_metric_field_name])):
            if abs(delta[perf_metric_field_name][index]) > delta_threshold:
                satisfied_indices.append(index)

        for metric in list(data):
            AMRS = (
                delta[metric][satisfied_indices].abs()
                / delta[perf_metric_field_name][satisfied_indices]
            ).mean(skipna=True)
            converted_data[metric] = converted_data[metric] / abs(AMRS)
            converted_data["dynascore"] += converted_data[metric] * weights.get(
                metric, 0
            )

        return converted_data

    def getDynaboardByTask(
        self,
        tid,
        perf_metric_field_name,
        ordered_metrics_with_weight_and_conversion,
        ordered_dids_with_weight,
        sort_by="dynascore",
        reverse_sort=False,
        limit=5,
        offset=0,
    ):
        tm = TaskModel()
        task = tm.get(tid)
        include_unpublished_models = task.unpublished_models_in_leaderboard

        ordered_dids = [
            did_and_weight["did"] for did_and_weight in ordered_dids_with_weight
        ]
        try:
            scores_users_datasets_models = (
                self.dbs.query(Score, User, Dataset, Model)
                .join(Dataset, Dataset.id == Score.did)
                .join(Model, Score.mid == Model.id)
                .join(User, User.id == Model.uid)
                .filter(Model.tid == tid)
                .filter(Score.did.in_(ordered_dids))
            )
            if not include_unpublished_models:
                scores_users_datasets_models = scores_users_datasets_models.filter(
                    Model.is_published
                )

            scores, users, datasets, models = zip(*scores_users_datasets_models)
        except Exception:
            return util.json_encode({"count": 0, "data": []})

        scores, users, datasets, models = (
            set(scores),
            set(users),
            set(datasets),
            set(models),
        )

        # Order datasets as in ordered_dids, for display purposes
        ordered_datasets = []
        did_to_dataset = {}
        for dataset in datasets:
            did_to_dataset[dataset.id] = dataset
        for dataset in datasets:
            ordered_datasets.append(did_to_dataset[ordered_dids[len(ordered_datasets)]])
        datasets = ordered_datasets

        # Filter models and scores so that we have complete sets of scores.
        # Unclear what the "null" values should be if we wanted to complete them.
        mid_to_unique_dids = {}
        all_unique_dids = set(ordered_dids)
        for score in scores:
            complete_score_for_dataset = True
            for metric_info in ordered_metrics_with_weight_and_conversion:
                if (score.to_dict().get(metric_info["field_name"], None) is None) and (
                    score.metadata_json is None
                    or util.json_decode(score.metadata_json).get(
                        metric_info["field_name"], None
                    )
                    is None
                ):
                    complete_score_for_dataset = False
            if complete_score_for_dataset:
                if score.mid in mid_to_unique_dids:
                    mid_to_unique_dids[score.mid].add(score.did)
                else:
                    mid_to_unique_dids[score.mid] = {score.did}
        filtered_scores = []
        for score in scores:
            if mid_to_unique_dids.get(score.mid, set()) == all_unique_dids:
                filtered_scores.append(score)
        scores = filtered_scores
        filtered_models = []
        for model in models:
            if mid_to_unique_dids.get(model.id, set()) == all_unique_dids:
                filtered_models.append(model)
        models = filtered_models

        # Format the score data so that we can put it in Pandas data frames.
        mid_and_did_to_scores = {}
        for score in scores:
            mid_and_did_to_scores[(score.mid, score.did)] = score
        dataset_results_dict = {}
        for dataset in datasets:
            dataset_results_dict[dataset.id] = {
                metric_info["field_name"]: []
                for metric_info in ordered_metrics_with_weight_and_conversion
            }
            for model in models:
                score = mid_and_did_to_scores[(model.id, dataset.id)]
                for field_name in dataset_results_dict[dataset.id]:
                    result = score.to_dict().get(field_name, None)
                    if result is None:
                        result = util.json_decode(score.metadata_json)[field_name]
                    dataset_results_dict[dataset.id][field_name].append(result)

        # Average the results accross datasets.
        averaged_dataset_results = None
        print(ordered_dids_with_weight)
        did_to_weight = {
            did_and_weight["did"]: did_and_weight["weight"]
            for did_and_weight in ordered_dids_with_weight
        }
        print(did_to_weight)
        for key, value in dataset_results_dict.items():
            df = pd.DataFrame.from_dict(value)
            dataset_results_dict[key] = df
            if averaged_dataset_results is None:
                averaged_dataset_results = did_to_weight[key] * df
            else:
                averaged_dataset_results += did_to_weight[key] * df

        # Compute the dynascore.
        converted_dataset_results = self.dynascore(
            perf_metric_field_name,
            averaged_dataset_results,
            weights={
                metric_info["field_name"]: metric_info["weight"]
                for metric_info in ordered_metrics_with_weight_and_conversion
            },
            direction_multipliers={
                metric_info["field_name"]: metric_info["utility_direction"]
                for metric_info in ordered_metrics_with_weight_and_conversion
            },
            offsets={
                metric_info["field_name"]: metric_info["offset"]
                for metric_info in ordered_metrics_with_weight_and_conversion
            },
        )
        # Convert the Pandas results into an output json.
        uid_to_username = {}
        for user in users:
            uid_to_username[user.id] = user.username
        data_list = []
        model_index = 0
        ordered_metric_field_names = [
            metric_info["field_name"]
            for metric_info in ordered_metrics_with_weight_and_conversion
        ]
        for model in models:
            datasets_list = []
            for dataset in datasets:
                scores = []
                for field_name in ordered_metric_field_names:
                    scores.append(
                        dataset_results_dict[dataset.id][field_name][model_index]
                    )
                variances = [0] * len(scores)  # TODO
                datasets_list.append(
                    {
                        "id": dataset.id,
                        "name": dataset.name,
                        "scores": scores,
                        "variances": variances,
                    }
                )
            averaged_scores = []
            for field_name in ordered_metric_field_names:
                averaged_scores.append(
                    averaged_dataset_results[field_name][model_index]
                )
            averaged_variances = [0] * len(averaged_scores)  # TODO
            dynascore = converted_dataset_results["dynascore"][model_index]
            data_list.append(
                {
                    "model_id": model.id,
                    "model_name": model.name if model.is_published else None,
                    # Don't give away the users for unpublished models.
                    "uid": model.uid
                    if model.is_published and not model.is_anonymous
                    else None,
                    "username": uid_to_username[model.uid]
                    if model.is_published and not model.is_anonymous
                    else None,
                    "averaged_scores": averaged_scores,
                    "averaged_variances": averaged_variances,
                    "dynascore": dynascore
                    if not math.isnan(dynascore)
                    else 0,  # It is possible for the dynascore to be nan if
                    # the leaderboard is uninteresting. For example, if,
                    # for any metric, all models on the leaderboard have that
                    # metric as 0. In these cases, dynascores for all models
                    # will be nan.
                    "dynavariance": 0,  # TODO
                    "datasets": datasets_list,
                }
            )
            model_index += 1

        ordered_metric_pretty_names = [
            metric_info["pretty_name"]
            for metric_info in ordered_metrics_with_weight_and_conversion
        ]
        if sort_by == "dynascore":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["dynascore"])
        elif sort_by in ordered_metric_pretty_names:
            data_list.sort(
                reverse=reverse_sort,
                key=lambda model: model["averaged_scores"][
                    ordered_metric_pretty_names.index(sort_by)
                ],
            )
        elif sort_by == "model_name":
            data_list.sort(reverse=reverse_sort, key=lambda model: model["model_name"])

        return util.json_encode(
            {"count": len(data_list), "data": data_list[offset : offset + limit]}
        )

    def getByTid(self, tid):
        # Main query to fetch the model details
        query_res = (
            self.dbs.query(Score)
            .join(Model, Score.mid == Model.id)
            .filter(Model.tid == tid)
        )
        return query_res

    def getOverallModelPerfByTask(self, tid, n=5, offset=0):
        # Main query to fetch the model details
        query_res = (
            self.dbs.query(
                Model.id,
                Model.name,
                User.username,
                User.id,
                db.sql.func.avg(Score.perf).label("avg_perf"),
            )
            .join(Score, Score.mid == Model.id)
            .join(User, User.id == Model.uid)
            .filter(Model.tid == tid)
            .filter(Model.is_published == True)  # noqa
            .group_by(Model.id)
            .order_by(db.sql.func.avg(Score.perf).desc())
        )

        return query_res.limit(n).offset(offset * n), util.get_query_count(query_res)

    def getModelPerfByTidAndRid(self, tid, rid, n=5, offset=0):
        # main query to fetch the model details
        query_res = (
            self.dbs.query(
                Model.id,
                Model.name,
                User.username,
                User.id,
                Score.perf,
                Score.metadata_json,
            )
            .join(Score, Score.mid == Model.id, isouter=True)
            .join(User, User.id == Model.uid, isouter=True)
            .join(Round, Round.id == Score.r_realid, isouter=True)
            .filter(Model.tid == tid)
            .filter(Round.rid == rid)
            .filter(Model.is_published == True)  # noqa
            .order_by((Score.perf).desc())
        )

        return query_res.limit(n).offset(offset * n), util.get_query_count(query_res)

    # FIXME: Ideally scores table should be deduped by (mid, did)
    # but all previous evaluations prior to datasets table will have
    # did = 0 and adding this now will cause prod server failure.
    # We should add did to scores table and add the dedup constraint
    # once new datasets are uploaded to eval server.
    def getOneByModelIdAndDataset(self, mid, did):
        try:
            return (
                self.dbs.query(Score)
                .filter(Score.mid == mid)
                .filter(Score.did == did)
                .order_by(Score.perf.desc())
                .one()
            )
        except db.orm.exc.NoResultFound:
            return False

    def getByMid(self, mid):
        return (
            self.dbs.query(
                Score.perf, Score.perf_std, Round.rid, Score.did, Score.metadata_json
            )
            .join(Round, Round.id == Score.r_realid, isouter=True)
            .filter(Score.mid == mid)
            .all()
        )

    def getByDid(self, did):
        try:
            return self.dbs.query(Score).filter(Score.did == did).all()
        except db.orm.exc.NoResultFound:
            return False
