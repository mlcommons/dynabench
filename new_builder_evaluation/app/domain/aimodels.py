# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import time

import requests

from app.domain.evaluation import Evaluation
from app.infrastructure.repositories.model import ModelRepository


class AIModels:
    def __init__(self):
        self._model_repository = ModelRepository()
        self.evaluation = Evaluation()

    def create_input_for_lambda(self, task_id: str):
        task_config = self.evaluation.get_task_configuration(task_id)
        inputs = task_config["input"]
        input_data = {}
        for input in inputs:
            name_input = input["name"]
            input_data[name_input] = "test"
        input_data["context"] = "test"
        return input_data

    def initiate_lambda_models(self):
        models = self._model_repository.get_lambda_models()
        while True:
            for model in models:
                input_data = self.create_input_for_lambda(model.tid)
                requests.post(f"{model.light_model}", json=input_data)
            print("Finished")
            time.sleep(240)
