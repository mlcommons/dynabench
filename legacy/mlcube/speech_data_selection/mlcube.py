# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""MLCube handler file"""
import os
import subprocess

import typer


app = typer.Typer()


class DownloadTask:
    """Download samples and eval data"""

    @staticmethod
    def run(parameters_file: str, output_path: str) -> None:

        cmd = "python3 utils/download_data.py"
        cmd += f" --parameters_file={parameters_file} --output_path={output_path}"
        splitted_cmd = cmd.split()

        process = subprocess.Popen(splitted_cmd, cwd=".")
        process.wait()


class SelectTask:
    """Execute selection algorithm"""

    @staticmethod
    def run(allowed_training_set: str, train_embeddings_dir: str, outdir: str) -> None:

        cmd = "python3 -m selection.main"
        cmd += f" --allowed_training_set {allowed_training_set}"
        cmd += f" --train_embeddings_dir {train_embeddings_dir}"
        cmd += f" --outdir {outdir}"
        splitted_cmd = cmd.split()

        process = subprocess.Popen(splitted_cmd, cwd=".")
        process.wait()


class EvaluateTask:
    """Execute evaluation script"""

    @staticmethod
    def run(
        eval_embeddings_dir: str,
        train_embeddings_dir: str,
        allowed_training_set: str,
        eval_file: str,
        train_file: str,
        config_file: str,
        log_path: str,
    ) -> None:

        env = os.environ.copy()
        env.update(
            {
                "eval_embeddings_dir": eval_embeddings_dir,
                "train_embeddings_dir": train_embeddings_dir,
                "allowed_training_set": allowed_training_set,
                "eval_file": eval_file,
                "train_file": train_file,
                "config_file": config_file,
                "log_path": log_path,
            }
        )

        process = subprocess.Popen("./utils/run_evaluate.sh", cwd=".", env=env)
        process.wait()


@app.command("download")
def download(
    parameters_file: str = typer.Option(..., "--parameters_file"),
    output_path: str = typer.Option(..., "--output_path"),
):
    DownloadTask.run(parameters_file, output_path)


@app.command("select")
def select(
    allowed_training_set: str = typer.Option(..., "--allowed_training_set"),
    train_embeddings_dir: str = typer.Option(..., "--train_embeddings_dir"),
    outdir: str = typer.Option(..., "--outdir"),
):
    SelectTask.run(allowed_training_set, train_embeddings_dir, outdir)


@app.command("evaluate")
def evaluate(
    eval_embeddings_dir: str = typer.Option(..., "--eval_embeddings_dir"),
    train_embeddings_dir: str = typer.Option(..., "--train_embeddings_dir"),
    allowed_training_set: str = typer.Option(..., "--allowed_training_set"),
    eval_file: str = typer.Option(..., "--eval_file"),
    train_file: str = typer.Option(..., "--train_file"),
    config_file: str = typer.Option(..., "--config_file"),
    log_path: str = typer.Option(..., "--log_path"),
):
    EvaluateTask.run(
        eval_embeddings_dir,
        train_embeddings_dir,
        allowed_training_set,
        eval_file,
        train_file,
        config_file,
        log_path,
    )


if __name__ == "__main__":
    app()
