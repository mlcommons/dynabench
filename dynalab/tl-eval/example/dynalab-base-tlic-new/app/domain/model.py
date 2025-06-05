# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
import shutil
import tempfile
import zipfile
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import requests
import tensorflow as tf

from app.domain.schemas.model import BenchmarkResults


class ModelController:
    def __init__(
        self, base_model="MobileNetV2", input_shape=(160, 160, 3), num_classes=2
    ) -> None:
        """
        Initialize the model controller with both baseline and custom models.

        Args:
            base_model (str): Name of the base model architecture
            input_shape (tuple): Input shape for the model
            num_classes (int): Number of output classes
        """
        self.input_shape = input_shape
        self.num_classes = num_classes
        self.threshold = 0.8  # 80% accuracy threshold
        self.stability_window = 10  # 10 consecutive samples above threshold

        # Initialize base feature extractor
        self.base_model_name = base_model
        self.feature_extractor = self._create_feature_extractor()

        # Initialize standard TF model (baseline)
        self.baseline_model = self._create_full_model()

        # Initialize model for custom weights (our benchmark method)
        self.custom_model = self._create_full_model()

        # Load or create dataset
        self.train_dataset, self.val_dataset = self._prepare_datasets()

    def _create_feature_extractor(self) -> tf.keras.Model:
        """
        Create and return the base feature extractor model.

        Returns:
            tf.keras.Model: Feature extraction model
        """
        # Choose preprocessing function based on base model
        if self.base_model_name == "MobileNetV2":
            preprocessor = tf.keras.applications.mobilenet_v2.preprocess_input
            base = tf.keras.applications.MobileNetV2(
                input_shape=self.input_shape, include_top=False, weights="imagenet"
            )
        elif self.base_model_name == "ResNet50":
            preprocessor = tf.keras.applications.resnet50.preprocess_input
            base = tf.keras.applications.ResNet50(
                input_shape=self.input_shape, include_top=False, weights="imagenet"
            )
        else:
            raise ValueError(f"Unsupported base model: {self.base_model_name}")

        # Freeze base model weights
        base.trainable = False

        # Create feature extractor model
        inputs = tf.keras.Input(shape=self.input_shape)
        x = preprocessor(inputs)
        x = base(x, training=False)
        outputs = tf.keras.layers.GlobalAveragePooling2D()(x)

        return tf.keras.Model(inputs, outputs, name="feature_extractor")

    def _create_classifier_head(self) -> tf.keras.Sequential:
        """
        Create a classifier head to be applied after feature extraction.

        Returns:
            tf.keras.Sequential: Classifier head model
        """
        # Create a simple classifier head with dropout for regularization
        classifier = tf.keras.Sequential(name="classifier_head")
        classifier.add(tf.keras.layers.Dropout(0.2))
        classifier.add(tf.keras.layers.Dense(self.num_classes))
        classifier.add(tf.keras.layers.Softmax())

        return classifier

    def _create_full_model(self) -> tf.keras.Model:
        """
        Create the full model with feature extractor and classifier head.

        Returns:
            tf.keras.Model: Complete model
        """
        inputs = tf.keras.Input(shape=self.input_shape)
        features = self.feature_extractor(inputs)
        outputs = self._create_classifier_head()(features)

        model = tf.keras.Model(
            inputs=inputs, outputs=outputs, name="transfer_learning_model"
        )

        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=False),
            metrics=["accuracy"],
        )

        # Print model summary for debugging
        print("Model layer names:")
        for layer in model.layers:
            print(f"  - {layer.name} ({type(layer).__name__})")

        return model

    def _prepare_datasets(self) -> Tuple[tf.data.Dataset, tf.data.Dataset]:
        """
        Prepare training and validation datasets using a temp directory.

        Returns:
            Tuple[tf.data.Dataset, tf.data.Dataset]: Training and validation datasets
        """
        print("Preparing datasets using temporary directory...")

        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        try:
            # Download the dataset
            zip_path = os.path.join(temp_dir, "cats_and_dogs.zip")
            url = "https://storage.googleapis.com/mledu-datasets/cats_and_dogs_filtered.zip"

            print("Downloading dataset...")
            response = requests.get(url, stream=True)
            with open(zip_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            # Extract the dataset
            print("Extracting dataset...")
            with zipfile.ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(temp_dir)

            # Path to the extracted dataset
            dataset_path = os.path.join(temp_dir, "cats_and_dogs_filtered")
            train_dir = os.path.join(dataset_path, "train")
            val_dir = os.path.join(dataset_path, "validation")

            print(f"Loading training data from {train_dir}")
            print(f"Loading validation data from {val_dir}")

            # Load datasets
            train_dataset = tf.keras.utils.image_dataset_from_directory(
                train_dir,
                image_size=(self.input_shape[0], self.input_shape[1]),
                batch_size=1,
                seed=123,
            )

            validation_dataset = tf.keras.utils.image_dataset_from_directory(
                val_dir,
                image_size=(self.input_shape[0], self.input_shape[1]),
                batch_size=1,
                seed=123,
            )

            # Optimize pipeline
            AUTOTUNE = tf.data.AUTOTUNE
            train_dataset = train_dataset.prefetch(buffer_size=AUTOTUNE)
            validation_dataset = validation_dataset.prefetch(buffer_size=AUTOTUNE)

            print("Datasets prepared successfully")

            # This will keep the temp directory around for the lifetime of the application
            # We're deliberately not deleting it so the datasets remain accessible
            return train_dataset, validation_dataset

        except Exception as e:
            print(f"Error preparing datasets: {e}")
            # Clean up on error
            shutil.rmtree(temp_dir)

            # Fallback to synthetic data if download fails
            print("Falling back to synthetic data...")
            return self._create_synthetic_datasets()

    def extract_features(self, images: List[np.ndarray]) -> List[np.ndarray]:
        """
        Extract features from the base model.

        Args:
            images (List[np.ndarray]): Input images

        Returns:
            List[np.ndarray]: Extracted features
        """
        features = []
        for image in images:
            # Convert to numpy array if it's a list
            if isinstance(image, list):
                image = np.array(image)

            # Ensure image has batch dimension
            if len(image.shape) == 3:
                image = np.expand_dims(image, axis=0)

            # Extract features
            feature = self.feature_extractor.predict(image, verbose=0)
            features.append(feature[0])  # Remove batch dimension

        # Convert all numpy arrays to lists for JSON serialization
        features_as_lists = []
        for feature in features:
            if isinstance(feature, np.ndarray):
                features_as_lists.append(feature.tolist())
            else:
                features_as_lists.append(feature)

        return features_as_lists

    def get_custom_weights(self) -> List[np.ndarray]:
        """
        Get the current weights of the custom model's classifier head.

        Returns:
            List[np.ndarray]: List of weight matrices
        """
        # Find the sequential layer that serves as the classifier
        # The structure shows it's named 'sequential_X' where X is a number
        sequential_layer = None
        for layer in self.custom_model.layers:
            if "sequential" in layer.name:
                sequential_layer = layer
                break

        if sequential_layer is not None:
            weights = sequential_layer.get_weights()
            # Debug info about weights
            print("DEBUG - Current classifier weights:")
            for i, w in enumerate(weights):
                print(f"  Weight {i} shape: {w.shape}")
            return weights
        else:
            # Fallback to looking at all layers
            print("Warning: Could not find sequential layer, printing all layers:")
            for layer in self.custom_model.layers:
                print(f"Layer: {layer.name}, Type: {type(layer)}")

            # Fallback: Return weights from the last layer that has weights
            for layer in reversed(self.custom_model.layers):
                weights = layer.get_weights()
                if weights:
                    print(f"Using weights from layer: {layer.name}")
                    # Debug info about weights
                    print("DEBUG - Current classifier weights:")
                    for i, w in enumerate(weights):
                        print(f"  Weight {i} shape: {w.shape}")
                    return weights

            raise ValueError("Could not find any layer with weights")

    def update_custom_weights(self, weights: List[np.ndarray]) -> None:
        """
        Update the weights of the custom model's classifier head.

        Args:
            weights (List[np.ndarray]): New weight values
        """
        # First try to find the layer by name
        sequential_layer = None
        for layer in self.custom_model.layers:
            # Look for either 'sequential' in name or 'classifier_head'
            if "sequential" in layer.name or "classifier_head" in layer.name:
                sequential_layer = layer
                print(f"Found classifier layer: {layer.name}")
                break

        if sequential_layer is not None:
            # Debug shape compatibility
            current_weights = sequential_layer.get_weights()
            print("Target weights shapes:")
            for i, w in enumerate(current_weights):
                print(f"  Current weight {i} shape: {w.shape}")

            print("Source weights shapes:")
            for i, w in enumerate(weights):
                print(f"  New weight {i} shape: {w.shape}")

            # Try to reshape weights to match if needed
            reshaped_weights = []
            for i, (curr_w, new_w) in enumerate(zip(current_weights, weights)):
                if curr_w.shape != new_w.shape:
                    print(f"Reshaping weight {i} from {new_w.shape} to {curr_w.shape}")
                    try:
                        # Check if the total elements match
                        if curr_w.size == new_w.size:
                            reshaped_weights.append(new_w.reshape(curr_w.shape))
                        elif i == 0 and len(new_w.shape) == 2:
                            # Special case for weight matrix
                            if new_w.shape[1] == curr_w.shape[0]:
                                # Transpose needed
                                print("Transposing weight matrix")
                                reshaped_weights.append(new_w.T)
                            else:
                                # Create a random weight of the correct shape
                                print("Cannot reshape. Creating random weight")
                                reshaped_weights.append(
                                    np.random.randn(*curr_w.shape) * 0.01
                                )
                        else:
                            # Just use the current weight
                            print("Cannot reshape. Using current weight")
                            reshaped_weights.append(curr_w)
                    except Exception as e:
                        print(f"Error reshaping weight {i}: {e}")
                        reshaped_weights.append(curr_w)
                else:
                    reshaped_weights.append(new_w)

            try:
                sequential_layer.set_weights(reshaped_weights)
                print("Successfully updated weights after reshaping")
                return
            except Exception as e:
                print(
                    f"Error setting weights for layer {sequential_layer.name} after reshaping: {e}"
                )
                # Continue to fallback options

        # Fallback: try direct access by index if it's the last layer
        try:
            last_layer = self.custom_model.layers[-1]
            if "sequential" in last_layer.name or "classifier_head" in last_layer.name:
                print(f"Setting weights for last layer: {last_layer.name}")
                # Try to reshape weights if needed
                current_weights = last_layer.get_weights()
                reshaped_weights = []
                for i, (curr_w, new_w) in enumerate(zip(current_weights, weights)):
                    if curr_w.shape != new_w.shape:
                        print(
                            f"Reshaping weight {i} from {new_w.shape} to {curr_w.shape}"
                        )
                        try:
                            if curr_w.size == new_w.size:
                                reshaped_weights.append(new_w.reshape(curr_w.shape))
                            else:
                                reshaped_weights.append(curr_w)
                        except Exception as e:
                            print(f"Error reshaping weight {i}: {e}")
                            reshaped_weights.append(curr_w)
                    else:
                        reshaped_weights.append(new_w)

                last_layer.set_weights(reshaped_weights)
                print("Successfully updated weights for last layer")
                return
        except Exception as e:
            print(f"Error setting weights for last layer: {e}")

        # Ultimate fallback: try getting classifier by traversing the model's structure
        print("Attempting to find classifier head through model structure...")

        # Print all layers for debugging
        print("Warning: Could not find sequential layer, printing all layers:")
        for layer in self.custom_model.layers:
            print(f"Layer: {layer.name}, Type: {type(layer)}")

            # If we find a layer that has the expected number of weights, try updating it
            if hasattr(layer, "get_weights") and len(layer.get_weights()) > 0:
                layer_weights = layer.get_weights()
                if len(layer_weights) == len(weights):
                    try:
                        print(f"Trying to update weights for layer: {layer.name}")
                        # Try to reshape weights if needed
                        reshaped_weights = []
                        for lw, nw in zip(layer_weights, weights):
                            if lw.shape != nw.shape:
                                if lw.size == nw.size:
                                    # Same number of elements, just reshape
                                    reshaped_weights.append(nw.reshape(lw.shape))
                                else:
                                    # Different number of elements, keep original
                                    reshaped_weights.append(lw)
                            else:
                                reshaped_weights.append(nw)

                        layer.set_weights(reshaped_weights)
                        print(f"Successfully updated weights for layer: {layer.name}")
                        return
                    except Exception as e:
                        print(f"Error updating layer {layer.name}: {e}")

        # If all else fails, try to find by matching weight shapes
        for layer in self.custom_model.layers:
            if hasattr(layer, "get_weights") and len(layer.get_weights()) > 0:
                layer_weights = layer.get_weights()
                if all(w1.shape == w2.shape for w1, w2 in zip(layer_weights, weights)):
                    try:
                        print(f"Found layer with matching weight shapes: {layer.name}")
                        layer.set_weights(weights)
                        return
                    except Exception as e:
                        print(
                            f"Error updating layer {layer.name} with matching shapes: {e}"
                        )

        # If we get here, we couldn't find a suitable layer
        raise ValueError("Could not find any suitable layer to update weights")

    def train_baseline_step(
        self, images: List[np.ndarray], labels: List[int]
    ) -> Dict[str, float]:
        """
        Train the baseline model for one step using standard TF.

        Args:
            images (List[np.ndarray] or tf.Tensor): Input images
            labels (List[int] or tf.Tensor): Ground truth labels

        Returns:
            Dict[str, float]: Training metrics
        """
        # Convert to TF tensors if not already tensors
        if not isinstance(images, tf.Tensor):
            images_tensor = tf.convert_to_tensor(np.array(images))
        else:
            images_tensor = images

        if not isinstance(labels, tf.Tensor):
            labels_tensor = tf.convert_to_tensor(np.array(labels))
        else:
            labels_tensor = labels

        # Train for one step
        metrics = self.baseline_model.train_on_batch(images_tensor, labels_tensor)

        # Return metrics
        return {"loss": float(metrics[0]), "accuracy": float(metrics[1])}

    def evaluate_model(self, model: tf.keras.Model) -> Dict[str, float]:
        """
        Evaluate a model on the validation dataset.

        Args:
            model (tf.keras.Model): Model to evaluate

        Returns:
            Dict[str, float]: Evaluation metrics
        """
        metrics = model.evaluate(self.val_dataset, verbose=0)
        return {"loss": float(metrics[0]), "accuracy": float(metrics[1])}

    def evaluate_baseline(self) -> float:
        """
        Evaluate the baseline model and return accuracy.

        Returns:
            float: Validation accuracy
        """
        return self.evaluate_model(self.baseline_model)["accuracy"]

    def evaluate_custom(self) -> float:
        """
        Evaluate the custom model and return accuracy.

        Returns:
            float: Validation accuracy
        """
        return self.evaluate_model(self.custom_model)["accuracy"]

    def custom_weight_update(
        self,
        features: List[np.ndarray],
        labels: List[int],
        current_weights: Optional[List[np.ndarray]] = None,
    ) -> List[np.ndarray]:
        """
        Update the weights using a custom algorithm.

        This method should be replaced with your custom weight update algorithm.
        In this implementation, it uses an API call to get the weights.

        Args:
            features (List[np.ndarray]): Feature vectors
            labels (List[int]): Target labels
            current_weights (Optional[List[np.ndarray]]): Current model weights

        Returns:
            List[np.ndarray]: Updated weights
        """
        # Example of a simple weight update algorithm
        if current_weights is None:
            current_weights = self.get_custom_weights()

        # Convert any numpy arrays to lists for JSON serialization
        features_as_lists = []
        for feature in features:
            if isinstance(feature, np.ndarray):
                features_as_lists.append(feature.tolist())
            else:
                features_as_lists.append(feature)

        current_weights_as_lists = None
        if current_weights is not None:
            current_weights_as_lists = []
            for w in current_weights:
                if isinstance(w, np.ndarray):
                    current_weights_as_lists.append(w.tolist())
                else:
                    current_weights_as_lists.append(w)

        # Example: Call an API to get updated weights
        # This is just a placeholder - replace with your algorithm
        api_response = self._call_om_api(features_as_lists, labels, self.num_classes)
        updated_weights = self._convert_response_to_weights(
            api_response, current_weights
        )

        return updated_weights

    def _call_om_api(
        self, features: List[Any], labels: List[int], num_classes: int
    ) -> Dict:
        """
        Call the Optimizing Mind API for weight updates.

        Args:
            features: List of feature vectors
            labels: List of class labels
            num_classes: Number of output classes

        Returns:
            Dict: API response
        """
        # For demo, just do a simple weights calculation
        # In a real implementation, this would be replaced with a more sophisticated algorithm
        try:
            num_features = len(features[0])
            print(f"Creating weights with shape: ({num_features}, {num_classes})")

            # Ensure features are converted to lists
            features_as_lists = []
            for feature in features:
                if isinstance(feature, np.ndarray):
                    features_as_lists.append(feature.tolist())
                else:
                    features_as_lists.append(feature)

            # Convert features to numpy arrays for sklearn
            features_np = np.array([np.array(f) for f in features_as_lists])

            # Check if we have multiple classes
            unique_labels = np.unique(labels)
            print(f"Labels in data: {unique_labels}")

            if len(unique_labels) < 2:
                print(
                    "Warning: Need at least 2 classes for LogisticRegression. Using fallback method."
                )
                # Just create some random weights as fallback
                weights = np.random.randn(num_features, num_classes) * np.sqrt(
                    2.0 / (num_features + num_classes)
                )
                bias = np.zeros(num_classes)

                # Make the weights slightly favor the existing class
                if len(unique_labels) == 1:
                    existing_class = unique_labels[0]
                    # Adjust weights to favor the existing class
                    weights[:, existing_class] *= 1.5
                    bias[existing_class] = 0.5
            else:
                # Use LogisticRegression when we have multiple classes
                from sklearn.linear_model import LogisticRegression

                clf = LogisticRegression(max_iter=1000)

                # Fit the model
                clf.fit(features_np, labels)

                # Get the coefficients (weights)
                # LogisticRegression returns shape (n_classes, n_features) when multi_class='ovr'
                coef = clf.coef_
                print(f"LogisticRegression coefficients shape: {coef.shape}")

                # For binary classification, reshape to match expected format
                if len(unique_labels) == 2:
                    # Binary classifier returns 1 set of coefficients, need to expand to 2 classes
                    weights = np.zeros((num_features, num_classes))
                    weights[:, 1] = coef[0]  # Class 1 gets the coefficients
                    weights[:, 0] = -coef[0]  # Class 0 gets the negative
                else:
                    # For multiclass, reshape to (num_features, num_classes)
                    weights = coef.T  # Transpose to get (num_features, num_classes)

                # Get the intercept (bias)
                bias = clf.intercept_

            print(f"Final weights shape: {weights.shape}, bias shape: {bias.shape}")

            # Create response similar to OM API
            response = {
                "result": weights.tolist()
                if isinstance(weights, np.ndarray)
                else weights,
                "bias": bias.tolist() if isinstance(bias, np.ndarray) else bias,
            }

            return response
        except Exception as e:
            print(f"Error calling API: {e}")
            # Return random weights as fallback
            random_weights = np.random.randn(num_features, num_classes) * 0.01
            random_bias = np.zeros(num_classes)
            return {"result": random_weights.tolist(), "bias": random_bias.tolist()}

    def _convert_response_to_weights(
        self, response: Dict, current_weights: Optional[List[np.ndarray]]
    ) -> List[np.ndarray]:
        """
        Convert API response to weight matrices.

        Args:
            response (Dict): API response
            current_weights (Optional[List[np.ndarray]]): Current weight values

        Returns:
            List[np.ndarray]: Weight matrices
        """
        # Extract weights from response without transposing
        weights_data = np.array(response["result"])

        # Extract bias if available, or use zeros
        if "bias" in response:
            bias = np.array(response["bias"])
        else:
            # If we have current weights, use their shapes to inform the bias
            if current_weights is not None and len(current_weights) > 1:
                bias_shape = current_weights[1].shape
                bias = np.zeros(bias_shape)
            else:
                bias = np.zeros(self.num_classes)

        return [weights_data, bias]

    def run_benchmark(
        self,
        custom_weights: Optional[List[np.ndarray]] = None,
        batch_size: int = 1,
        max_samples: int = 100,
        evaluation_frequency: int = 1,
    ) -> BenchmarkResults:
        """
        Run the benchmark to compare custom weight update method against baseline.

        Args:
            custom_weights (Optional[List[np.ndarray]]): Initial custom weights
            batch_size (int): Batch size for training
            max_samples (int): Maximum number of samples to use
            evaluation_frequency (int): How often to evaluate

        Returns:
            BenchmarkResults: Benchmark results
        """
        print(
            f"Running benchmark with max_samples={max_samples}, evaluation_frequency={evaluation_frequency}"
        )

        # Set initial weights if provided
        if custom_weights is not None:
            self.update_custom_weights(custom_weights)

        # Prepare data structures for tracking learning curves
        samples = []
        baseline_acc = []
        custom_acc = []

        # Track when methods achieve stable accuracy
        baseline_milestone = None
        custom_milestone = None

        # Counter for consecutive evaluations above threshold
        baseline_counter = 0
        custom_counter = 0
        accuracy_threshold = 0.8
        required_consecutive = 10  # Number of consecutive evaluations above threshold

        # Get validation dataset length
        val_dataset_length = 0
        for _ in self.val_dataset:
            val_dataset_length += 1

        # Process training samples incrementally
        features_list = []
        labels_list = []

        # Limit samples processed
        sample_count = 0

        # Collect data from all batches first to ensure we have mixed classes
        all_data = []
        all_labels = []

        # Collect up to max_samples training examples
        for data, label in self.train_dataset.take(max_samples):
            all_data.append(data)
            all_labels.append(label)

        # Check that we have at least two classes
        unique_labels = set()
        for label_batch in all_labels:
            for lbl in label_batch.numpy():
                unique_labels.add(int(lbl))

        if len(unique_labels) < 2:
            print(
                f"Warning: Only found {len(unique_labels)} classes in data: {unique_labels}"
            )
            print("Adding synthetic data to ensure multiple classes...")
            # Add some synthetic data to ensure we have multiple classes
            if 0 not in unique_labels:
                # Add a class 0 sample
                synthetic_data = tf.random.normal(
                    (1, *self.input_shape), mean=0, stddev=1
                )
                synthetic_label = tf.constant([0], dtype=tf.int32)
                all_data.append(synthetic_data)
                all_labels.append(synthetic_label)
            if 1 not in unique_labels:
                # Add a class 1 sample
                synthetic_data = tf.random.normal(
                    (1, *self.input_shape), mean=1, stddev=1
                )
                synthetic_label = tf.constant([1], dtype=tf.int32)
                all_data.append(synthetic_data)
                all_labels.append(synthetic_label)

        # Now process all collected data
        for i, (data, label) in enumerate(zip(all_data, all_labels)):
            # Extract features from the current batch
            features = self.feature_extractor.predict(data, verbose=0)

            # Add to lists
            features_list.extend(features)
            labels_list.extend(label.numpy())

            sample_count += 1

            # Check if we should evaluate
            if sample_count % evaluation_frequency == 0 or sample_count == len(
                all_data
            ):
                # Update baseline model using standard training
                self.train_baseline_step(data, label.numpy())

                # Update custom weights using our method
                try:
                    updated_weights = self.custom_weight_update(
                        features_list, labels_list, self.get_custom_weights()
                    )
                    self.update_custom_weights(updated_weights)
                except Exception as e:
                    print(f"Error updating custom weights: {e}")
                    # Continue the benchmark even if custom weight update fails

                # Evaluate both models
                baseline_accuracy = self.evaluate_baseline()
                custom_accuracy = self.evaluate_custom()

                # Update learning curves
                samples.append(sample_count)
                baseline_acc.append(
                    float(baseline_accuracy)
                )  # Convert to float for serialization
                custom_acc.append(
                    float(custom_accuracy)
                )  # Convert to float for serialization

                # Check if baseline has reached stable accuracy
                if baseline_accuracy >= accuracy_threshold:
                    baseline_counter += 1
                else:
                    baseline_counter = 0

                # Check if custom method has reached stable accuracy
                if custom_accuracy >= accuracy_threshold:
                    custom_counter += 1
                else:
                    custom_counter = 0

                # Record milestone if threshold reached for required consecutive evaluations
                if (
                    baseline_counter >= required_consecutive
                    and baseline_milestone is None
                ):
                    baseline_milestone = sample_count

                if custom_counter >= required_consecutive and custom_milestone is None:
                    custom_milestone = sample_count

                # Print progress
                print(
                    f"Samples: {sample_count}, Baseline: {baseline_accuracy:.4f}, Custom: {custom_accuracy:.4f}"
                )

        # Calculate relative efficiency if both methods reached milestone
        relative_efficiency = None
        if baseline_milestone is not None and custom_milestone is not None:
            relative_efficiency = baseline_milestone / custom_milestone

        # Return benchmark results
        return BenchmarkResults(
            custom_milestone=custom_milestone,
            baseline_milestone=baseline_milestone,
            relative_efficiency=relative_efficiency,
            learning_curves={
                "samples": samples,
                "baseline_acc": baseline_acc,
                "custom_acc": custom_acc,
            },
            final_accuracy={
                "baseline": float(baseline_acc[-1]) if baseline_acc else 0.0,
                "custom": float(custom_acc[-1]) if custom_acc else 0.0,
            },
        )

    def download_test_dataset(self, num_samples: int = 100):
        """
        Download and extract cats and dogs dataset to a temporary directory.

        Args:
            num_samples: Number of samples to include in the test dataset

        Returns:
            Tuple of (images, labels) for testing
        """
        print("Downloading and preparing the cats and dogs dataset...")

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

            # Load dataset using TensorFlow
            train_dataset = tf.keras.utils.image_dataset_from_directory(
                train_dir,
                image_size=(160, 160),
                batch_size=num_samples,
                shuffle=True,
                seed=123,
            )

            # Get the first batch of data
            for images, labels in train_dataset.take(1):
                images = images.numpy()
                labels = labels.numpy()
                break

            print(f"Downloaded {len(images)} images for testing")
            return images, labels

        finally:
            # Clean up temp directory when done
            shutil.rmtree(temp_dir)
