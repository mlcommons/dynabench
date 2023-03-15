# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import asyncio
import json
from typing import Dict, List

import numpy as np
from fastapi import APIRouter, HTTPException
from sklearn.metrics import f1_score

from app.domain.helpers import Helper
from app.domain.model import Model
from app.models.Prediction import Prediction


router = APIRouter()


@router.post("/fit_predict")
def fit_predict(prediction: Prediction):
    model = Model()
    if len(prediction.id_json) > 1000:
        raise HTTPException(
            status_code=400, detail="submission exceeds 1000 sample limit"
        )
    try:
        x_train, y_train = asyncio.run(
            load_training_data(json.dumps(prediction.id_json))
        )
    except:
        raise HTTPException(
            status_code=400,
            detail="One or more training samples are not in the training pool",
        )
    print("Loaded the training vectors")
    model.train(x_train, y_train)
    print("Trained the model")
    try:
        x_test, y_test = load_testing_data(prediction.bucket_name, prediction.key)
    except:
        raise HTTPException(
            status_code=400, detail="Test set was not found in the database"
        )
    print("Loaded the testing vectors")
    answer = model.predict(x_test).tolist()
    print("Done! and the length of the predictions was", len(answer))
    score = np.round(f1_score(y_test, answer) * 100, 3)
    return {"score": score}


async def load_training_data(id_json: str):
    helper = Helper()
    print("Helper works fine")
    data = json.loads(id_json)

    train_X = []
    train_y = []
    tasks = []

    for id, _ in data.items():
        tasks.append(asyncio.create_task(helper.get_train_dataset_embedding(id)))

    print("Went through the first loop")
    results = await asyncio.gather(*tasks, return_exceptions=True)
    print("This are the resultados", results)

    for result, ids in zip(results, data.items()):
        if isinstance(result, BaseException):
            continue
        else:
            train_X.append(result)
            train_y.append(ids[1])

    print(train_y)
    return train_X, train_y


def load_testing_data(bucket_name, key):
    helper = Helper()
    test_X, test_y = helper.get_test_dataframe(bucket_name, key)
    return test_X, test_y


# id_count = 0
#             for id, label in current_upload.items():
#                 id_count += 1

#             if id_count > 1000:
#                 Email().send(
#                     contact=user.email,
#                     cc_contact="dynabench-site@mlcommons.org",
#                     template_name="model_train_failed.txt",
#                     msg_dict={"name": model_name},
#                     subject=f"""Model {model_name} training failed. You surpassed
#                     the maximum amount of samples.""",
#                 )
#                 bottle.abort(400, "Invalid train file")
