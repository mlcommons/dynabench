# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Properties taken from AWS documentation https://aws.amazon.com/sagemaker/pricing/
"""

COMPUTE_CAP_CONSTANT = 10  # for score normalization to compute dynascore

instance_property = {
    "ml.m5.xlarge": {
        "instance_type": "ml.m5.xlarge",
        "device_type": "cpu",
        "cpu_count": 4,
        "gpu_count": 0,
        "memory_gb": 16,
        "compute_cap": COMPUTE_CAP_CONSTANT,
        "aws_metrics": ["examples_per_second", "memory_utilization"],
    },
    "ml.m5.2xlarge": {
        "instance_type": "ml.m5.2xlarge",
        "device_type": "cpu",
        "cpu_count": 8,
        "gpu_count": 0,
        "memory_gb": 32,
        "compute_cap": COMPUTE_CAP_CONSTANT,
        "aws_metrics": ["examples_per_second", "memory_utilization"],
    },
    "ml.p2.xlarge": {
        "instance_type": "ml.p2.xlarge",
        "device_type": "cpu",
        "cpu_count": 4,
        "gpu_count": 1,
        "memory_gb": 16,
        "compute_cap": COMPUTE_CAP_CONSTANT,
        "aws_metrics": ["examples_per_second", "memory_utilization"],
    },
}
