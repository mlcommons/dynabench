# Transfer Learning Benchmark Evaluation Criteria

This document details how submissions to the transfer learning benchmark are evaluated.

## Primary Metric: Sample Efficiency

The primary evaluation metric for this benchmark is **sample efficiency**, defined as the number of training samples required to achieve and maintain a validation accuracy of 80% or higher over 10 consecutive evaluations.

### Measurement Process

1. **Starting Point**: All methods begin with the same pre-trained base model (MobileNetV2 or ResNet50).

2. **Progressive Training**: Training samples are fed to both the baseline method (standard gradient descent) and your custom method in small batches.

3. **Evaluation Sequence**:
   - After each batch of training samples, both methods are evaluated on the validation set
   - The validation accuracy is recorded for each method
   - The number of samples seen so far is tracked

4. **Success Criteria**: The benchmark measures how many samples each method needs before reaching and maintaining ≥80% validation accuracy over 10 consecutive evaluations.

5. **Early Stopping**: For efficiency, the benchmark stops adding training samples once both methods have met the success criteria or when a maximum sample limit is reached.

## Scoring and Ranking

### Sample Efficiency Score

The primary score is the raw number of samples needed to meet the criteria. Lower is better.

Example:
- Baseline method: 1200 samples to reach stable 80% accuracy
- Custom method: 800 samples to reach stable 80% accuracy
- Result: Custom method is more sample-efficient (33% improvement)

### Relative Improvement

For easier comparison across different runs and datasets, we also calculate the relative improvement over the baseline:

```
Relative Improvement = (Baseline_Samples - Custom_Samples) / Baseline_Samples * 100%
```

A positive percentage indicates your method is more sample-efficient than the baseline.

## Evaluation Datasets

The benchmark is run on multiple datasets to ensure robustness:

1. **Main Evaluation**: Cat vs. Dog classification (binary)

## Stability and Reproducibility

To ensure stable evaluations:

1. **Fixed Seeds**: Random seeds are fixed for reproducibility
2. **Multiple Runs**: Each method is evaluated over multiple runs with different data orderings
