# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, HTTPException

from app.domain.buyer import Buyer
from app.domain.helper import Helper
from app.domain.market import Market
from app.domain.model import Model
from app.domain.seller import Seller
from app.models.submission import Submission


router = APIRouter()


@router.post("/fit_predict")
def fit_predict(submission: Submission):
    buyer = Buyer()
    seller = Seller()
    market = Market()
    helper = Helper()
    model = Model()

    submission = {int(k): v for k, v in dict(submission).get("submission").items()}
    market_code = str(list(submission.keys())[0])
    X_train, y_train, market_fractions = buyer.training_sample_creator(submission)
    print("Loaded training sets")
    pricing_info = seller.set_data_price()[market_code]
    budget = market.budget_setter()["budget"]
    data_cost = market.dataset_cost_estimator(market_fractions, pricing_info)
    print("Data cost is ", data_cost, "and pricing info is ", pricing_info)

    if market.budget_verifier(budget, data_cost):
        model.train(X_train, y_train)
        print("Model trained")
        X_test, y_test = helper.load_test_set(
            "dataperf", "data-acquisition/datasets/test_sets/final.parquet"
        )
        print("Test set loaded and shape is", len(X_test), len(y_test))
        accuracy = model.score(X_test, y_test)
        print("This model got an accuracy of ", accuracy)
        return accuracy * 100

    else:
        raise HTTPException(
            status_code=400,
            detail=f"budget was exceeded. Max budget was {budget} and total cost was {data_cost}",
        )
