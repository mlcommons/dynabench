# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# import numpy as np
# from typing import List, Dict, Optional, Any


# class PerformanceTracker:
#     """
#     Tracks the performance metrics for transfer learning benchmark.
#     Monitors when methods reach the accuracy threshold consistently.
#     """
#     def __init__(self, threshold=0.8, stability_window=10):
#         """
#         Initialize the performance tracker.

#         Args:
#             threshold (float): Accuracy threshold (default: 0.8 for 80%)
#             stability_window (int): Number of consecutive evaluations above threshold needed (default: 10)
#         """
#         self.threshold = threshold
#         self.stability_window = stability_window
#         self.custom_milestone = None  # Samples to reach milestone for custom method
#         self.baseline_milestone = None  # Samples to reach milestone for baseline

#         # Tracking accumulators
#         self.custom_accuracies = []
#         self.baseline_accuracies = []
#         self.samples_seen = []

#     def record_performance(self, samples_count: int, custom_acc: float, baseline_acc: float) -> None:
#         """
#         Record performance after processing n samples.

#         Args:
#             samples_count (int): Cumulative number of samples processed
#             custom_acc (float): Validation accuracy of custom method
#             baseline_acc (float): Validation accuracy of baseline method
#         """
#         self.samples_seen.append(samples_count)
#         self.custom_accuracies.append(float(custom_acc))
#         self.baseline_accuracies.append(float(baseline_acc))

#         # Check for milestone achievement
#         self._check_milestone('custom', self.custom_accuracies, samples_count)
#         self._check_milestone('baseline', self.baseline_accuracies, samples_count)

#     def _check_milestone(self, method_name: str, accuracy_history: List[float], current_samples: int) -> None:
#         """
#         Check if method has achieved the stability milestone.

#         Args:
#             method_name (str): Name of the method ('custom' or 'baseline')
#             accuracy_history (List[float]): History of accuracies for this method
#             current_samples (int): Current number of samples processed
#         """
#         milestone_var = f"{method_name}_milestone"

#         # Only check if milestone hasn't been reached yet
#         if getattr(self, milestone_var) is None:
#             # Get last n accuracies (up to stability_window)
#             window = min(self.stability_window, len(accuracy_history))
#             recent_accuracies = accuracy_history[-window:]

#             # Check if all recent accuracies meet threshold
#             if window == self.stability_window and all(acc >= self.threshold for acc in recent_accuracies):
#                 # First sample where the milestone was achieved
#                 milestone_sample = current_samples - (self.stability_window - 1) * (current_samples // len(accuracy_history))
#                 setattr(self, milestone_var, milestone_sample)
#                 print(f"{method_name} reached {self.threshold*100}% stability milestone at {milestone_sample} samples")

#     def get_results(self) -> Dict[str, Any]:
#         """
#         Get the benchmark results.

#         Returns:
#             Dict with benchmark metrics including milestones and learning curves
#         """
#         # Calculate relative efficiency if both methods reached milestone
#         relative_efficiency = None
#         if self.custom_milestone is not None and self.baseline_milestone is not None:
#             relative_efficiency = self.baseline_milestone / self.custom_milestone

#         return {
#             "custom_milestone": self.custom_milestone,
#             "baseline_milestone": self.baseline_milestone,
#             "relative_efficiency": relative_efficiency,
#             "learning_curves": {
#                 "samples": self.samples_seen,
#                 "custom_acc": self.custom_accuracies,
#                 "baseline_acc": self.baseline_accuracies
#             },
#             "final_accuracy": {
#                 "custom": self.custom_accuracies[-1] if self.custom_accuracies else None,
#                 "baseline": self.baseline_accuracies[-1] if self.baseline_accuracies else None
#             }
#         }
