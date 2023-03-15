# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import pickle
import time

import numpy as np
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
    available = helper.load_allowed_training_set(prediction.bucket_name, prediction.key)
    embeddings = helper.load_samples(
        prediction.key, prediction.id_json, available, 120, prediction.bucket_name
    )
    x_train, y_train = helper.create_dataset(embeddings)
    print("Loaded the training vectors")
    model.train(x_train, y_train)
    print("Trained the model")

    # new_testing_embs = helper.load_testing_embeddings(prediction.bucket_name, prediction.key)
    with open(f"app/resources/{prediction.key}_testing_embeddings.pickle", "rb") as f:
        new_testing_embs = pickle.load(f)
    eval_x, eval_y = helper.create_dataset(new_testing_embs)
    print("Loaded the testing vectors")
    pred_y = model.predict(eval_x)
    # print('Done! and the length of the predictions was', len(pred_y.to_list()))
    answer = model.evaluate(eval_y, pred_y)
    end = time.time()
    print(f"The model obtained a score of {answer*100}, and took {end-start} seconds")

    return {"score": np.round(answer * 100, 3)}
