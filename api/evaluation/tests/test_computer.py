# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import json
import logging
import multiprocessing
import weakref
from pathlib import Path
from typing import Dict, List, NamedTuple, Tuple

from datasets.nli.mnli import MnliBase

from utils.computer import MetricsComputer


def nli_sample(id: str, context: str, hypothesis: str, label: str) -> dict:
    assert label in ["entailed", "neutral", "contradictory"]
    return {"uid": id, "context": context, "hypothesis": hypothesis, "label": label}


NLI_SAMPLES = [
    nli_sample("nli1", "It's raining today", "Where is my umbrella ?", "entailed")
]
SOME_NLI_MODEL_OUTPUT = [{"id": "nli1", "label": "entailed"}]


class Job(NamedTuple):
    model_id: int
    endpoint_name: str
    dataset_name: str
    perturb_prefix: str = ""
    status: str = ""  # will update once job is successfully submitted
    aws_metrics: dict = {}  # will update once job is completed

    @property
    def job_name(self):
        return "-".join((self.endpoint_name, self.dataset_name))


class OfflineMnliDataset(MnliBase):
    """MNLI dataset, but that read data from memory.
    conftest.py makes sure we aren't reading from S3.
    """

    def __init__(self, examples: List[dict]):
        super().__init__("fake_mnli", "")
        self._examples = examples
        self._job_outfiles: Dict[str, List[dict]] = {}

    def parse_outfile_and_upload(self, job, original=False):
        return self._job_outfiles[job.job_name]

    def read_labels(self, perturb_prefix=None):
        return [self.label_field_converter(example) for example in self._examples]

    def register_job_output(self, job: Job, output: List[dict]):
        """Simulates the S3 files that this job should have created."""
        self._job_outfiles[job.job_name] = output


class FailingMnliDataset(OfflineMnliDataset):
    def compute_job_metrics(self, job: Job) -> Tuple[dict, dict]:
        raise RuntimeError("Move Fast, Break Things")


class UnpickableMnliDataset(OfflineMnliDataset):
    def __init__(self, examples):
        super().__init__(examples)
        self._unpickable = weakref.ref(self)


class MetricsComputerWithoutDb(MetricsComputer):
    def __init__(self, folder: Path, datasets: dict):
        config = {"computer_status_dump": str(folder / "computer.unittest.dump")}
        super().__init__(config, datasets)
        self.metrics: dict = {}

    def update_database_with_metrics(
        self, job, eval_metrics_dict: dict, delta_metrics_dict: dict
    ) -> None:
        """
        Imitated the default implementation but write to a dict instead of a DB.
        That's not ideal, but I'm not sure how to properly mock the database.
        Ideally we could use a DB dedicated to unit test.
        """
        assert job.job_name not in self.metrics
        self.metrics[job.job_name] = (eval_metrics_dict, delta_metrics_dict)
        print("Successfully computed metrics for", job.job_name)

        # Note: this is copied from the original implementation.
        if job in self._computing:
            self._computing.remove(job)
        self.dump()


def test_compute_one_blocking(tmp_path: Path):
    nli_dataset = OfflineMnliDataset(NLI_SAMPLES)
    computer = MetricsComputerWithoutDb(tmp_path, {"fake_mnli": nli_dataset})
    job = Job(10, "test_compute_one_blocking", "fake_mnli")
    nli_dataset.register_job_output(job, SOME_NLI_MODEL_OUTPUT)
    computer.compute_one_blocking(job)

    assert computer.get_status() == {"computing": [], "waiting": [], "failed": []}
    assert job.job_name in computer.metrics
    eval_metrics, delta_metrics = computer.metrics[job.job_name]

    assert delta_metrics == {}
    assert "metadata_json" in eval_metrics
    assert json.loads(eval_metrics["metadata_json"])["accuracy"] == 100


def test_compute_one_blocking_failing(tmp_path: Path, caplog):
    nli_dataset = FailingMnliDataset(NLI_SAMPLES)
    computer = MetricsComputerWithoutDb(tmp_path, {"fake_mnli": nli_dataset})
    job = Job(11, "test_compute_one_blocking_failing", "fake_mnli")
    nli_dataset.register_job_output(job, SOME_NLI_MODEL_OUTPUT)
    caplog.clear()
    caplog.set_level(logging.ERROR)
    computer.compute_one_blocking(job)

    assert computer.get_status() == {"computing": [], "waiting": [], "failed": [job]}
    assert computer.metrics == {}
    assert caplog.record_tuples == [
        ("computer", logging.ERROR, "Move Fast, Break Things")
    ]


def test_compute_one_async(tmp_path: Path):
    nli_dataset = OfflineMnliDataset(NLI_SAMPLES)
    computer = MetricsComputerWithoutDb(tmp_path, {"fake_mnli": nli_dataset})
    job = Job(20, "test_compute_one_async", "fake_mnli")
    nli_dataset.register_job_output(job, SOME_NLI_MODEL_OUTPUT)

    with multiprocessing.pool.Pool() as pool:
        computer.compute_one_async(pool, job)
        pool.close()
        pool.join()

    assert computer.get_status() == {"computing": [], "waiting": [], "failed": []}
    assert job.job_name in computer.metrics
    eval_metrics, delta_metrics = computer.metrics[job.job_name]

    assert delta_metrics == {}
    assert "metadata_json" in eval_metrics
    assert json.loads(eval_metrics["metadata_json"])["accuracy"] == 100


def test_compute_one_async_failing(tmp_path: Path, caplog):
    nli_dataset = FailingMnliDataset(NLI_SAMPLES)
    computer = MetricsComputerWithoutDb(tmp_path, {"fake_mnli": nli_dataset})
    job = Job(21, "test_compute_one_async_failing", "fake_mnli")
    nli_dataset.register_job_output(job, SOME_NLI_MODEL_OUTPUT)

    caplog.clear()
    caplog.set_level(logging.ERROR)
    with multiprocessing.pool.Pool() as pool:
        computer.compute_one_async(pool, job)
        pool.close()
        pool.join()

    # Here we expect the computation to fail
    assert computer.get_status() == {"computing": [], "waiting": [], "failed": [job]}
    assert computer.metrics == {}
    assert computer.get_jobs("Computing") == []

    assert caplog.record_tuples == [
        ("computer", logging.ERROR, "Move Fast, Break Things")
    ]

    # Check that interrupted job are picked up when starting a new computer.
    new_computer = MetricsComputerWithoutDb(tmp_path, {})
    assert new_computer.get_jobs("Waiting") == [job]


def test_compute_one_async_terminate(tmp_path: Path):
    nli_dataset = OfflineMnliDataset(NLI_SAMPLES)
    computer = MetricsComputerWithoutDb(tmp_path, {"fake_mnli": nli_dataset})
    job = Job(22, "test_compute_one_async_terminate", "fake_mnli")
    nli_dataset.register_job_output(job, SOME_NLI_MODEL_OUTPUT)

    with multiprocessing.pool.Pool() as pool:
        computer.compute_one_async(pool, job)
        # immediately exit this will terminate the pool and kill the processes

    # There is nothing in the computer results.
    assert computer.metrics == {}
    # The job is still running from the point of view of this computer
    assert computer.get_status() == {"computing": [job], "waiting": [], "failed": []}

    # Check that interrupted job are picked up when starting a new computer.
    computer2 = MetricsComputerWithoutDb(tmp_path, {})
    assert computer2.get_status() == {"computing": [], "waiting": [job], "failed": []}


def test_compute_one_async_unpickable(tmp_path: Path, caplog):
    nli_dataset = UnpickableMnliDataset(NLI_SAMPLES)
    computer = MetricsComputerWithoutDb(tmp_path, {"fake_mnli": nli_dataset})
    job = Job(23, "test_compute_one_async_unpickable", "fake_mnli")
    caplog.clear()
    caplog.set_level(logging.ERROR)
    with multiprocessing.pool.Pool() as pool:
        computer.compute_one_async(pool, job)
        # Make sure we finish the computation before moving to tests
        pool.close()
        pool.join()

    assert computer.get_status() == {"computing": [], "waiting": [], "failed": [job]}
    assert computer.metrics == {}
    assert caplog.record_tuples == [
        ("computer", logging.ERROR, "cannot pickle 'weakref' object")
    ]
