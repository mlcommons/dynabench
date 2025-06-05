#!/usr/bin/env python3
# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""
Test script for the Transfer Learning Benchmark

This script:
1. Downloads a subset of the cats and dogs dataset
2. Extracts features using the base model
3. Implements a simple custom weight update method
4. Runs the benchmark to compare against baseline

Usage:
    python test_benchmark.py

Requirements:
    - TensorFlow >= 2.8.0
    - NumPy
    - Requests
    - Matplotlib
"""

import os

import matplotlib.pyplot as plt
import numpy as np
import requests
import tensorflow as tf


# Constants
API_BASE_URL = (
    "http://localhost:8000"  # Change if running the server on a different port
)
NUM_TEST_SAMPLES = 20  # Number of samples to use for testing


def download_test_dataset(num_samples: int = NUM_TEST_SAMPLES):
    """
    Download a subset of the cats and dogs dataset for testing.

    Args:
        num_samples: Number of samples to include in the test dataset

    Returns:
        Tuple of (images, labels) for testing
    """
    print("Downloading and preparing the cats and dogs dataset...")

    # Use a simpler approach with direct download
    import shutil
    import tempfile
    import zipfile

    # Create temp directory
    temp_dir = tempfile.mkdtemp()
    try:
        # Download the dataset
        zip_path = os.path.join(temp_dir, "cats_and_dogs.zip")

        # Use requests to download
        print("Downloading dataset...")
        response = requests.get(
            "https://storage.googleapis.com/mledu-datasets/cats_and_dogs_filtered.zip",
            stream=True,
        )
        with open(zip_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # Extract the dataset
        print("Extracting dataset...")
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)

        # Find the train directory
        dataset_path = os.path.join(temp_dir, "cats_and_dogs_filtered")
        train_dir = os.path.join(dataset_path, "train")

        if not os.path.exists(train_dir):
            raise FileNotFoundError(f"Train directory not found at {train_dir}")

        # Create arrays to store images and labels
        images = []
        labels = []

        # Load cat images
        cat_dir = os.path.join(train_dir, "cats")
        for i, filename in enumerate(os.listdir(cat_dir)[: num_samples // 2]):
            if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
                continue
            img_path = os.path.join(cat_dir, filename)
            img = tf.keras.preprocessing.image.load_img(
                img_path, target_size=(160, 160)
            )
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            images.append(img_array)
            labels.append(0)  # 0 for cats

        # Load dog images
        dog_dir = os.path.join(train_dir, "dogs")
        for i, filename in enumerate(os.listdir(dog_dir)[: num_samples // 2]):
            if not filename.lower().endswith((".png", ".jpg", ".jpeg")):
                continue
            img_path = os.path.join(dog_dir, filename)
            img = tf.keras.preprocessing.image.load_img(
                img_path, target_size=(160, 160)
            )
            img_array = tf.keras.preprocessing.image.img_to_array(img)
            images.append(img_array)
            labels.append(1)  # 1 for dogs

        return np.array(images), np.array(labels)

    except Exception as e:
        print(f"Error processing dataset: {e}")
        raise
    finally:
        # Clean up temp directory
        shutil.rmtree(temp_dir)


def extract_features(images):
    """
    Extract features from the base model using the API.

    Args:
        images: Array of images to extract features from

    Returns:
        List of feature vectors
    """
    print("Extracting features from the base model...")

    # Convert images to list for JSON serialization
    # Make sure we handle numpy arrays correctly
    images_list = images.tolist() if hasattr(images, "tolist") else images

    # Call the API
    try:
        response = requests.post(
            f"{API_BASE_URL}/model/extract_features", json={"images": images_list}
        )

        if response.status_code != 200:
            print(f"API Error {response.status_code}: {response.text}")
            raise Exception(f"Error extracting features: {response.text}")

        # Extract features from response
        features = response.json()["features"]
        print(f"Extracted features with shape: {np.array(features[0]).shape}")

        return features
    except Exception as e:
        print(f"Error during feature extraction API call: {str(e)}")
        raise


def custom_weight_update(features, labels, current_weights=None):
    """
    Simple custom weight update method.
    In a real implementation, this would be replaced with your algorithm.

    Args:
        features: List of feature vectors
        labels: List of class labels
        current_weights: Current weights of the model (optional)

    Returns:
        Updated weights
    """
    print("Updating weights using custom method...")

    # Call the API
    response = requests.post(
        f"{API_BASE_URL}/model/update_weights",
        json={
            "features": features,
            "labels": labels.tolist(),
            "current_weights": current_weights,
        },
    )

    if response.status_code != 200:
        raise Exception(f"Error updating weights: {response.text}")

    # Extract updated weights from response
    updated_weights = response.json()["updated_weights"]

    return updated_weights


def run_benchmark(max_samples=100):
    """
    Run the benchmark to compare the custom method against baseline.

    Args:
        max_samples: Maximum number of samples to process

    Returns:
        Benchmark results
    """
    print(f"Running benchmark with {max_samples} samples...")

    # Call the API
    response = requests.post(
        f"{API_BASE_URL}/model/run_benchmark",
        json={
            "custom_weights": None,
            "batch_size": 1,
            "max_samples": max_samples,
            "evaluation_frequency": 1,
        },
    )

    if response.status_code != 200:
        raise Exception(f"Error running benchmark: {response.text}")

    results = response.json()
    return results


def plot_learning_curves(results):
    """
    Plot learning curves from benchmark results.

    Args:
        results: Benchmark results with learning curves
    """
    print("Plotting learning curves...")

    # Extract data
    samples = results["learning_curves"]["samples"]
    custom_acc = results["learning_curves"]["custom_acc"]
    baseline_acc = results["learning_curves"]["baseline_acc"]

    # Create plot
    plt.figure(figsize=(10, 6))
    plt.plot(samples, custom_acc, label="Custom Method", marker="o")
    plt.plot(samples, baseline_acc, label="Baseline", marker="x")

    # Add milestone markers if available
    if results["custom_milestone"]:
        plt.axvline(
            x=results["custom_milestone"],
            color="blue",
            linestyle="--",
            label=f"Custom milestone: {results['custom_milestone']} samples",
        )

    if results["baseline_milestone"]:
        plt.axvline(
            x=results["baseline_milestone"],
            color="orange",
            linestyle="--",
            label=f"Baseline milestone: {results['baseline_milestone']} samples",
        )

    # Add threshold line
    plt.axhline(y=0.8, color="red", linestyle="-", alpha=0.3, label="80% threshold")

    plt.xlabel("Number of Training Samples")
    plt.ylabel("Validation Accuracy")
    plt.title("Transfer Learning Benchmark: Learning Curves")
    plt.legend()
    plt.grid(True, alpha=0.3)

    # Save plot
    plt.savefig("learning_curves.png")
    print("Learning curves saved to learning_curves.png")

    # Try to display plot
    try:
        plt.show()
    except Exception as e:
        print(
            f"Unable to display plot (you may be running in a headless environment): {e}"
        )


def main():
    """
    Main function to test the benchmark.
    """
    print("Transfer Learning Benchmark Test")
    print("===============================")

    # Check if the server is running
    try:
        response = requests.get(f"{API_BASE_URL}")
        if response.status_code != 200:
            print(f"Error: Server returned status code {response.status_code}")
            print(
                "Make sure the server is running with: uvicorn app.main:app --host 0.0.0.0 --port 8000"
            )
            return
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server")
        print(
            "Make sure the server is running with: uvicorn app.main:app --host 0.0.0.0 --port 8000"
        )
        return

    # Download test dataset
    try:
        images, labels = download_test_dataset()
    except Exception as e:
        print(f"Error downloading dataset: {e}")
        return

    # Test extracting features
    try:
        features = extract_features(images)
    except Exception as e:
        print(f"Error extracting features: {e}")
        return

    # Test updating weights
    try:
        updated_weights = custom_weight_update(features, labels)
        print(
            f"Successfully updated weights with shapes: {[np.array(w).shape for w in updated_weights]}"
        )
    except Exception as e:
        print(f"Error updating weights: {e}")
        return

    # Run benchmark
    try:
        results = run_benchmark(max_samples=50)  # Use fewer samples for testing

        # Print results
        print("\nBenchmark Results:")
        print(f"Custom milestone: {results['custom_milestone']} samples")
        print(f"Baseline milestone: {results['baseline_milestone']} samples")

        if results["relative_efficiency"]:
            print(f"Relative efficiency: {results['relative_efficiency']:.2f}x")

        print(f"Final custom accuracy: {results['final_accuracy']['custom']:.4f}")
        print(f"Final baseline accuracy: {results['final_accuracy']['baseline']:.4f}")

        # Plot learning curves
        plot_learning_curves(results)

    except Exception as e:
        print(f"Error running benchmark: {e}")
        return

    print("\nTest completed successfully!")


if __name__ == "__main__":
    main()
