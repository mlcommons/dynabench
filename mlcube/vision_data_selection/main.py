# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os

import constants as c
import eval as eval
import fire

import utils as utils


def run_tasks(
    setup_yaml_path: str = c.DEFAULT_SETUP_YAML_PATH, docker_flag: bool = False
) -> None:
    """Runs visual benchmark tasks based on config yaml file.

    Args:
        setup_yaml_path (str, optional): Path for config file. Defaults
            to path in constants.DEFAULT_SETUP_YAML_PATH.
        docker_flag (bool, optional): True when running in container
    """
    task_setup = utils.load_yaml(setup_yaml_path)
    data_dir_key = (
        c.SETUP_YAML_DOCKER_DATA_DIR_KEY
        if docker_flag
        else c.SETUP_YAML_LOCAL_DATA_DIR_KEY
    )
    data_dir = task_setup[data_dir_key]
    dim = task_setup[c.SETUP_YAML_DIM_KEY]
    emb_path = os.path.join(data_dir, task_setup[c.SETUP_YAML_EMB_KEY])

    ss = utils.get_spark_session(task_setup[c.SETUP_YAML_SPARK_MEM_KEY])

    print("Loading embeddings\n")
    emb_df = utils.load_emb_df(ss=ss, path=emb_path, dim=dim)

    task_paths = {task: task_setup[task] for task in task_setup[c.SETUP_YAML_TASKS_KEY]}
    task_scores = {}
    for task, paths in task_paths.items():
        print(f"Evaluating task: {task}")
        train_path, test_path = [os.path.join(data_dir, p) for p in paths]

        print(f"Loading training data for {task}...")
        train_df = utils.load_train_df(ss=ss, path=train_path)
        train_df = utils.add_emb_col(df=train_df, emb_df=emb_df)

        print(f"Loading test data for {task}...")
        test_df = utils.load_test_df(ss=ss, path=test_path, dim=dim)

        print(f"Training classifier for {task}...")
        clf = eval.get_trained_classifier(df=train_df)

        print(f"Scoring trained classifier for {task}...\n")
        task_scores[task] = eval.score_classifier(df=test_df, clf=clf)

    save_dir = os.path.join(data_dir, task_setup[c.SETUP_YAML_RESULTS_KEY])
    utils.save_results(data=task_scores, save_dir=save_dir, verbose=True)


if __name__ == "__main__":
    fire.Fire(run_tasks)
