# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import asyncio
import json

from fastapi import APIRouter

from app.domain.helpers import Helper
from app.domain.model import Model
from app.models.Prediction import Prediction


router = APIRouter()


@router.post("/fit_predict")
def fit_predict(prediction: Prediction):
    model = Model()
    x_train, y_train = asyncio.run(load_training_data(json.dumps(prediction.id_json)))
    print("Loaded the training vectors")
    model.train(x_train, y_train)
    print("Trained the model")
    x_test = load_testing_data(prediction.bucket_name, prediction.key)
    print("Loaded the testing vectors")
    answer = model.predict(x_test).tolist()
    print("Done! and the length of the predictions was", len(answer))
    return {"predictions": answer}


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
    test_X = helper.get_test_dataframe(bucket_name, key)
    return test_X
