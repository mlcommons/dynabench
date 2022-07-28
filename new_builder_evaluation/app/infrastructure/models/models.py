# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# coding: utf-8
from sqlalchemy import (
    TIMESTAMP,
    BigInteger,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
    text,
)
from sqlalchemy.dialects.mysql import TINYINT
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship


Base = declarative_base()
metadata = Base.metadata


class YoyoLog(Base):
    __tablename__ = "_yoyo_log"

    id = Column(String(36), primary_key=True)
    migration_hash = Column(String(64))
    migration_id = Column(String(255))
    operation = Column(String(10))
    username = Column(String(255))
    hostname = Column(String(255))
    comment = Column(String(255))
    created_at_utc = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )


class YoyoMigration(Base):
    __tablename__ = "_yoyo_migration"

    migration_hash = Column(String(64), primary_key=True)
    migration_id = Column(String(255))
    applied_at_utc = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )


class YoyoVersion(Base):
    __tablename__ = "_yoyo_version"

    version = Column(Integer, primary_key=True)
    installed_at_utc = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    task_code = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=False, unique=True)
    config_yaml = Column(Text)
    instructions_md = Column(Text)
    desc = Column(String(255))
    last_updated = Column(DateTime)
    cur_round = Column(Integer, nullable=False)
    hidden = Column(TINYINT(1))
    official = Column(TINYINT(1))
    submitable = Column(TINYINT(1))
    validate_non_fooling = Column(TINYINT(1), nullable=False)
    num_matching_validations = Column(Integer, nullable=False)
    unpublished_models_in_leaderboard = Column(TINYINT(1), nullable=False)
    dynalab_hr_diff = Column(Integer, nullable=False)
    dynalab_threshold = Column(Integer, nullable=False)
    instance_type = Column(Text, nullable=False)
    instance_count = Column(Integer, nullable=False)
    aws_region = Column(Text, nullable=False)
    s3_bucket = Column(Text, nullable=False)
    eval_server_id = Column(Text, nullable=False)
    create_endpoint = Column(TINYINT(1))
    gpu = Column(TINYINT(1))
    extra_torchserve_config = Column(Text)
    active = Column(TINYINT(1))
    has_predictions_upload = Column(TINYINT(1))
    predictions_upload_instructions_md = Column(Text)
    unique_validators_for_example_tags = Column(TINYINT(1))
    train_file_upload_instructions_md = Column(Text)
    build_sqs_queue = Column(Text)
    eval_sqs_queue = Column(Text)
    is_decen_task = Column(TINYINT(1), server_default=text("'0'"))
    task_aws_account_id = Column(Text)
    task_gateway_predict_prefix = Column(Text)
    context = Column(String(20), server_default=text("'min'"))


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    admin = Column(TINYINT(1))
    username = Column(String(255), nullable=False, unique=True)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    realname = Column(String(255))
    affiliation = Column(String(255))
    forgot_password_token = Column(String(255))
    forgot_password_token_expiry_date = Column(DateTime)
    total_retracted = Column(Integer)
    total_verified_fooled = Column(Integer)
    total_verified_not_correct_fooled = Column(Integer)
    total_fooled = Column(Integer)
    settings_json = Column(Text)
    metadata_json = Column(Text)
    examples_submitted = Column(Integer)
    examples_verified = Column(Integer)
    models_submitted = Column(Integer)
    unseen_notifications = Column(Integer)
    streak_examples = Column(Integer)
    streak_days = Column(Integer)
    streak_days_last_model_wrong = Column(DateTime)
    api_token = Column(String(255))
    avatar_url = Column(Text)


class YoyoLock(Base):
    __tablename__ = "yoyo_lock"

    locked = Column(Integer, primary_key=True, server_default=text("'1'"))
    ctime = Column(
        TIMESTAMP,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
    )
    pid = Column(Integer, nullable=False)


class Badge(Base):
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True)
    uid = Column(ForeignKey("users.id"), index=True)
    name = Column(String(255))
    metadata_json = Column(Text)
    awarded = Column(DateTime)

    user = relationship("User")


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False, unique=True)
    tid = Column(ForeignKey("tasks.id"), nullable=False, index=True)
    rid = Column(Integer)
    desc = Column(String(255))
    longdesc = Column(Text)
    source_url = Column(Text)
    access_type = Column(Enum("scoring", "standard", "hidden"))
    log_access_type = Column(Enum("owner", "user"))

    task = relationship("Task")


class LeaderboardConfiguration(Base):
    __tablename__ = "leaderboard_configurations"

    tid = Column(ForeignKey("tasks.id"), primary_key=True, nullable=False)
    name = Column(String(255), primary_key=True, nullable=False)
    uid = Column(ForeignKey("users.id"), nullable=False, index=True)
    desc = Column(Text)
    create_datetime = Column(DateTime)
    configuration_json = Column(Text, nullable=False)

    task = relationship("Task")
    user = relationship("User")


class LeaderboardSnapshot(Base):
    __tablename__ = "leaderboard_snapshots"
    __table_args__ = (Index("tid", "tid", "name", unique=True),)

    id = Column(Integer, primary_key=True)
    tid = Column(ForeignKey("tasks.id"), nullable=False)
    uid = Column(ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    desc = Column(Text)
    create_datetime = Column(DateTime)
    data_json = Column(Text, nullable=False)

    task = relationship("Task")
    user = relationship("User")


class Model(Base):
    __tablename__ = "models"

    id = Column(Integer, primary_key=True)
    tid = Column(ForeignKey("tasks.id"), nullable=False, index=True)
    uid = Column(ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    shortname = Column(String(255), nullable=False)
    desc = Column(String(255))
    longdesc = Column(Text)
    papers = Column(Text)
    evaluation_status_json = Column(Text)
    params = Column(BigInteger)
    languages = Column(Text)
    license = Column(Text)
    upload_datetime = Column(DateTime)
    model_card = Column(Text)
    source_url = Column(Text)
    is_published = Column(TINYINT(1))
    is_anonymous = Column(TINYINT(1))
    endpoint_name = Column(Text)
    deployment_status = Column(
        Enum(
            "uploaded",
            "processing",
            "deployed",
            "created",
            "failed",
            "unknown",
            "takendown",
            "predictions_upload",
            "takendownnonactive",
        )
    )
    secret = Column(Text)

    task = relationship("Task")
    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    uid = Column(ForeignKey("users.id"), index=True)
    type = Column(String(255))
    message = Column(Text)
    metadata_json = Column(Text)
    seen = Column(TINYINT(1))
    created = Column(DateTime)

    user = relationship("User")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    token = Column(String(255), nullable=False, unique=True)
    uid = Column(ForeignKey("users.id"), nullable=False, index=True)
    generated_datetime = Column(DateTime)

    user = relationship("User")


class Round(Base):
    __tablename__ = "rounds"

    id = Column(Integer, primary_key=True)
    tid = Column(ForeignKey("tasks.id"), nullable=False, index=True)
    rid = Column(Integer, nullable=False, index=True)
    secret = Column(String(255), nullable=False)
    url = Column(Text)
    desc = Column(String(255))
    longdesc = Column(Text)
    total_fooled = Column(Integer)
    total_verified_fooled = Column(Integer)
    total_collected = Column(Integer)
    total_time_spent = Column(Time)
    start_datetime = Column(DateTime)
    end_datetime = Column(DateTime)

    task = relationship("Task")


class TaskProposal(Base):
    __tablename__ = "task_proposals"

    id = Column(Integer, primary_key=True)
    uid = Column(ForeignKey("users.id"), index=True)
    task_code = Column(String(255), nullable=False, unique=True)
    name = Column(String(255), nullable=False, unique=True)
    desc = Column(String(255))
    longdesc = Column(Text)

    user = relationship("User")


class TaskUserPermission(Base):
    __tablename__ = "task_user_permissions"

    id = Column(Integer, primary_key=True)
    uid = Column(ForeignKey("users.id"), index=True)
    type = Column(String(255))
    tid = Column(ForeignKey("tasks.id"), index=True)

    task = relationship("Task")
    user = relationship("User")


class Context(Base):
    __tablename__ = "contexts"

    id = Column(Integer, primary_key=True)
    r_realid = Column(ForeignKey("rounds.id"), nullable=False, index=True)
    context_json = Column(Text)
    tag = Column(Text)
    metadata_json = Column(Text)
    total_used = Column(Integer)
    last_used = Column(DateTime)

    round = relationship("Round")


class RoundUserExampleInfo(Base):
    __tablename__ = "round_user_example_info"

    id = Column(Integer, primary_key=True)
    uid = Column(ForeignKey("users.id"), index=True)
    r_realid = Column(ForeignKey("rounds.id"), index=True)
    total_verified_not_correct_fooled = Column(Integer)
    total_fooled = Column(Integer)
    examples_submitted = Column(Integer)

    round = relationship("Round")
    user = relationship("User")


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True)
    mid = Column(ForeignKey("models.id"), nullable=False, index=True)
    r_realid = Column(ForeignKey("rounds.id"), nullable=False, index=True)
    did = Column(ForeignKey("datasets.id"), nullable=False, index=True)
    desc = Column(String(255))
    longdesc = Column(Text)
    pretty_perf = Column(String(255))
    perf = Column(Float)
    perf_std = Column(Float)
    raw_output_s3_uri = Column(Text)
    metadata_json = Column(Text)
    memory_utilization = Column(Float)
    examples_per_second = Column(Float)
    fairness = Column(Float)
    robustness = Column(Float)

    dataset = relationship("Dataset")
    model = relationship("Model")
    round = relationship("Round")


class Example(Base):
    __tablename__ = "examples"

    id = Column(Integer, primary_key=True)
    cid = Column(ForeignKey("contexts.id"), nullable=False, index=True)
    uid = Column(ForeignKey("users.id"), index=True)
    tag = Column(Text)
    input_json = Column(Text)
    output_json = Column(Text)
    metadata_json = Column(Text)
    model_endpoint_name = Column(Text)
    split = Column(String(255))
    model_wrong = Column(TINYINT(1))
    retracted = Column(TINYINT(1))
    flagged = Column(TINYINT(1))
    generated_datetime = Column(DateTime)
    time_elapsed = Column(Time)
    total_verified = Column(Integer)

    context = relationship("Context")
    user = relationship("User")


class Validation(Base):
    __tablename__ = "validations"

    id = Column(Integer, primary_key=True)
    uid = Column(ForeignKey("users.id"), index=True)
    eid = Column(ForeignKey("examples.id"), nullable=False, index=True)
    label = Column(Enum("flagged", "correct", "incorrect", "placeholder"))
    mode = Column(Enum("user", "owner"))
    metadata_json = Column(Text)

    example = relationship("Example")
    user = relationship("User")
