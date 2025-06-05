# Transfer Learning Benchmark Quick Start Guide

This guide will help you quickly get started with implementing and testing your solution for the Transfer Learning Benchmark.

## Prerequisites

- Python 3.7+
- Docker (for submitting your solution)
- Basic understanding of transfer learning and neural networks

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-org/tl-benchmark.git
   cd tl-benchmark
   ```

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

## Understanding the Challenge

The benchmark evaluates the **sample efficiency** of weight update methods in transfer learning - measuring how many samples your method needs to achieve good performance compared to a standard gradient descent baseline.

## Quick Start Implementation

### 1. Examine the Example Implementation

Start by looking at our example implementation in `example_implementation.py`:

```python
def custom_weight_update(features, labels, current_weights=None, learning_rate=0.01):
    # Your implementation here
    return [weights, bias]
```

### 2. Run the Test Script

Use our test script to see how a basic implementation performs:

```
python test_benchmark.py
```

This will:
- Download a small test dataset
- Extract features using the base model
- Update weights using both baseline and custom methods
- Compare the sample efficiency of both approaches

### 3. Implement Your Solution

Create your own weight update method by:

1. Modifying the `custom_weight_update` function in `model.py`, or
2. Creating your own implementation in a new file

The key requirements are:
- Input: Features (extracted from base model), labels, and current weights
- Output: Updated weights for the classifier head

### 4. Test Locally

Test your implementation against the baseline:

```
python test_benchmark.py --method=your_method
```

You should see learning curves and a sample efficiency report showing how your method compares to the baseline.

## API Guide

The benchmark uses three main API endpoints:

1. **Feature Extraction** - `/model/extract_features`:
   ```python
   # Example request
   response = requests.post(
       "http://localhost:8000/model/extract_features",
       json={"images": encoded_images}
   )
   features = response.json()["features"]
   ```

2. **Weight Update** - `/model/update_weights`:
   ```python
   # Example request
   response = requests.post(
       "http://localhost:8000/model/update_weights",
       json={
           "features": features,
           "labels": labels,
           "current_weights": current_weights,
           "method": "custom"  # or "baseline"
       }
   )
   updated_weights = response.json()["updated_weights"]
   ```

3. **Run Benchmark** - `/model/run_benchmark`:
   ```python
   # Example request
   response = requests.post(
       "http://localhost:8000/model/run_benchmark",
       json={"max_samples": 1000, "batch_size": 10}
   )
   results = response.json()
   ```

## Submission Tips

1. **Focus on sample efficiency** - Your method should reach 80% accuracy with fewer samples than the baseline

2. **Keep it simple** - Lightweight methods that update quickly are preferred

3. **Stay within constraints** - Only use the provided features and labels

4. **Test thoroughly** - Ensure your method is robust to different initializations and data orderings

## Building Your Container

When you're ready to submit:

1. Update the `custom_weight_update` method in `model.py` with your implementation

2. Build your Docker container:
   ```
   docker build -t tl-benchmark-submission .
   ```

3. Test the container locally:
   ```
   docker run -p 5000:5000 tl-benchmark-submission
   ```

4. Submit your container following the submission guidelines

## Evaluation Criteria

Your solution will be evaluated on:

1. **Sample Efficiency** - Number of samples needed to reach stable 80% accuracy
2. **Relative Improvement** - Percentage improvement over the baseline
3. **Robustness** - Performance across different datasets and initializations

For more details, see the [Evaluation Documentation](EVALUATION.md).


## Additional Resources

- [Full Documentation](../README.md)
- [Evaluation Details](EVALUATION.md)
