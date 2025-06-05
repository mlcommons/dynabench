# Transfer Learning Benchmark for Dynabench

This benchmark evaluates different approaches to transfer learning, specifically focusing on weight update methods that can learn efficiently from small amounts of data.

## Benchmark Overview

The benchmark uses a pre-trained vision model (MobileNetV2 or ResNet50) as a feature extractor and compares different methods for updating the weights of the classifier head. The goal is to develop methods that learn faster than traditional gradient descent.

### Key Metric

The primary metric is **sample efficiency**: How many training samples are needed for the model to reach and maintain ≥80% validation accuracy for 10 consecutive evaluations.

## How the Benchmark Works

1. **Base Model**: A pre-trained vision model extracts features from images
2. **Baseline Method**: Standard TensorFlow gradient descent (Adam optimizer)
3. **Custom Method**: Your implementation for updating weights based on features and labels
4. **Evaluation**: Both methods are evaluated after processing each batch of images

## Submission Format

Participants submit a Docker container that implements the following endpoints:

### Required Endpoint

- `POST /model/update_weights`: Takes extracted features and labels, returns updated weights

### Optional Endpoints (already implemented for you)

- `POST /model/extract_features`: Extract features from images using the base model
- `POST /model/run_benchmark`: Run the benchmark to compare your method against baseline

## API Reference

### Feature Extraction

```
POST /model/extract_features
{
  "images": [array of image tensors]
}
```

Returns:
```
{
  "features": [array of feature vectors]
}
```

### Weight Update

```
POST /model/update_weights
{
  "features": [array of feature vectors],
  "labels": [array of integer labels],
  "current_weights": [current weight matrices],
  "num_classes": 2
}
```

Returns:
```
{
  "updated_weights": [array of updated weight matrices]
}
```

### Run Benchmark

```
POST /model/run_benchmark
{
  "custom_weights": null,        // Optional initial weights
  "batch_size": 1,               // Number of samples per batch
  "max_samples": 100,            // Maximum samples to process
  "evaluation_frequency": 1      // How often to evaluate (in samples)
}
```

Returns:
```
{
  "custom_milestone": 42,        // Samples needed to reach stability
  "baseline_milestone": 78,      // Samples needed for baseline
  "relative_efficiency": 1.86,   // Ratio of baseline/custom
  "learning_curves": {
    "samples": [1, 2, ...],      // Number of samples seen
    "custom_acc": [0.4, 0.5, ...], // Custom method accuracy
    "baseline_acc": [0.4, 0.45, ...] // Baseline accuracy
  },
  "final_accuracy": {
    "custom": 0.92,              // Final custom accuracy
    "baseline": 0.89             // Final baseline accuracy
  }
}
```

## Running Locally

1. Build the Docker container:
   ```
   docker build -t transfer-learning-benchmark .
   ```

2. Run the container:
   ```
   docker run -p 8000:80 transfer-learning-benchmark
   ```

3. Test the API:
   ```
   curl -X POST "http://localhost:8000/model/run_benchmark" -H "Content-Type: application/json" -d '{"max_samples": 50}'
   ```

## Example Workflow

1. Get features from images:
   ```python
   features = requests.post("/model/extract_features", json={"images": images}).json()["features"]
   ```

2. Update weights with your custom method:
   ```python
   updated_weights = your_algorithm(features, labels, current_weights)
   ```

3. Return updated weights:
   ```python
   return {"updated_weights": updated_weights}
   ```

## Creating Your Own Implementation

To create your own implementation, you need to:

1. Modify the `custom_weight_update` method in `app/domain/model.py`
2. Or create a new service that implements the `/model/update_weights` endpoint
