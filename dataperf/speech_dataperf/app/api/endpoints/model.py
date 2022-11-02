# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import pickle
import time

import yaml
from fastapi import APIRouter

from app.domain.helpers import Helper
from app.domain.model import Model
from app.models.Prediction import Prediction


router = APIRouter()


@router.post("/fit_predict")
def fit_predict(prediction: Prediction):
    model = Model()
    helper = Helper()
    start = time.time()
    with open("app/domain/allowed_training_set.yaml") as p:
        available = yaml.load(p)

    embeddings = helper.load_samples(
        prediction.id_json, available, 120, "flat-embeddings"
    )
    x_train, y_train = helper.create_dataset(embeddings)
    print("Loaded the training vectors")
    model.train(x_train, y_train)
    print("Trained the model")

    with open("app/domain/testing_embeddings.pickle", "rb") as f:
        new_testing_embs = pickle.load(f)

    eval_x, eval_y = helper.create_dataset(new_testing_embs)
    print("Loaded the testing vectors")
    pred_y = model.predict(eval_x)
    answer = model.evaluate(eval_y, pred_y)
    end = time.time()
    print(f"The model obtained a score of {answer*100}, and took {end-start} seconds")

    return {"predictions": answer}
