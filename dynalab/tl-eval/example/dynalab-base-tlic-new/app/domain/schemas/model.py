# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


# New schemas for transfer learning benchmark


class FeatureExtractionInput(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    images: List[Any]  # Can be List[list] or List[np.ndarray]


class FeatureExtractionOutput(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    features: List[Any]  # Can return List[list] or List[np.ndarray]


class WeightUpdateInput(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    features: List[Any]  # Can be List[list] or List[np.ndarray]
    labels: List[int]
    current_weights: Optional[List[Any]] = None  # Can be List[list] or List[np.ndarray]
    num_classes: int = 2


class WeightUpdateOutput(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    updated_weights: List[Any]  # Can be List[list] or List[np.ndarray]


class BenchmarkInput(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    custom_weights: Optional[List[Any]] = None  # Can be List[list] or List[np.ndarray]
    batch_size: int = 1
    max_samples: int = 100
    evaluation_frequency: int = 1  # Evaluate after every n samples


class BenchmarkResults(BaseModel):
    model_config = {"arbitrary_types_allowed": True}
    custom_milestone: Optional[int] = None  # Samples needed to reach stable accuracy
    baseline_milestone: Optional[int] = None  # Samples needed for baseline
    relative_efficiency: Optional[float] = None  # Ratio of baseline/custom milestones
    learning_curves: Dict[str, List[Any]]  # Full learning curves
    final_accuracy: Dict[str, float]  # Final accuracies after all samples
