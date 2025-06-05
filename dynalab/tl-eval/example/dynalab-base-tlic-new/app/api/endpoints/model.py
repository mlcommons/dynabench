# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import numpy as np
from fastapi import APIRouter, HTTPException

from app.domain.model import ModelController
from app.domain.schemas.model import (
    BenchmarkInput,
    BenchmarkResults,
    FeatureExtractionInput,
    FeatureExtractionOutput,
    WeightUpdateInput,
    WeightUpdateOutput,
)


router = APIRouter()

# New benchmark-specific endpoints


@router.post("/extract_features", response_model=FeatureExtractionOutput)
async def extract_features(data: FeatureExtractionInput):
    """
    Extract features from the base model for a batch of images.
    These features can be used as input for custom weight update methods.
    """
    try:
        model = ModelController()
        features = model.extract_features(data.images)

        # Ensure all features are lists for proper serialization
        serializable_features = []
        for feature in features:
            if isinstance(feature, np.ndarray):
                serializable_features.append(feature.tolist())
            else:
                serializable_features.append(feature)

        return FeatureExtractionOutput(features=serializable_features)
    except Exception as e:
        print(f"Error in extract_features endpoint: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Feature extraction failed: {str(e)}"
        )


@router.post("/update_weights", response_model=WeightUpdateOutput)
async def update_weights(data: WeightUpdateInput):
    """
    Update the weights of the classifier head using a custom method.
    This is where participants implement their custom transfer learning algorithms.
    """
    try:
        model = ModelController()
        updated_weights = model.custom_weight_update(
            features=data.features,
            labels=data.labels,
            current_weights=data.current_weights,
        )

        # Ensure all weights are properly serialized
        serializable_weights = []
        for weight in updated_weights:
            if isinstance(weight, np.ndarray):
                serializable_weights.append(weight.tolist())
            else:
                serializable_weights.append(weight)

        return WeightUpdateOutput(updated_weights=serializable_weights)
    except Exception as e:
        print(f"Error in update_weights endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Weight update failed: {str(e)}")


@router.post("/run_benchmark", response_model=BenchmarkResults)
async def run_benchmark(data: BenchmarkInput):
    """
    Run the transfer learning benchmark, comparing the custom method against baseline.

    The benchmark tracks how many samples are needed to reach and maintain
    80% validation accuracy for 10 consecutive evaluations.
    """
    try:
        model = ModelController()
        results = model.run_benchmark(
            custom_weights=data.custom_weights,
            batch_size=data.batch_size,
            max_samples=data.max_samples,
            evaluation_frequency=data.evaluation_frequency,
        )

        # Ensure all results are properly serialized
        # BenchmarkResults already has proper JSON serialization in the model
        return results
    except Exception as e:
        print(f"Error in run_benchmark endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Benchmark failed: {str(e)}")
