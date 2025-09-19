# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import csv
import importlib.util
import json
import os
import sys
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Callable, Dict, List, Optional, Tuple

import boto3
import runpod
from dotenv import load_dotenv


# Load environment variables from .env if present
load_dotenv()


def download_and_import_model(s3_path: str):
    """Downloads a zip file from s3 and imports the WMDQS model"""
    original_cwd = os.getcwd()
    try:
        if not os.path.exists("model.zip"):
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            )
            bucket_name = s3_path.split("/")[2]
            key = "/".join(s3_path.split("/")[3:])
            response = s3_client.get_object(Bucket=bucket_name, Key=key)
            with open("model.zip", "wb") as f:
                f.write(response["Body"].read())
        # Extract the model
        with zipfile.ZipFile("model.zip", "r") as zip_ref:
            all_paths = zip_ref.namelist()
            # Find the model.py file
            model_path = next(
                path for path in all_paths if path.endswith("app/domain/model.py")
            )
            root_dir = model_path.split("/")[0]
            if not os.path.exists(root_dir):
                zip_ref.extractall(".")

            # Get project root and add to path
            project_root = os.path.abspath(
                os.path.join(".", os.path.dirname(model_path))
            )
            project_root = os.path.dirname(os.path.dirname(project_root))
            os.chdir(project_root)
            sys.path.insert(0, project_root)

            # Install requirements if they exist (gracefully handle missing pip)
            requirements_path = os.path.join(project_root, "requirements.txt")
            if os.path.exists(requirements_path):
                import subprocess

                def _safe_install(req_path: str):
                    try:
                        # Ensure pip exists in the current interpreter
                        subprocess.check_call([sys.executable, "-m", "pip", "--version"])  # type: ignore
                    except Exception:
                        try:
                            import ensurepip  # type: ignore

                            ensurepip.bootstrap()
                        except Exception:
                            pass
                    try:
                        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_path])  # type: ignore
                    except Exception as e:
                        # Best-effort install; continue even if it fails so evaluation can proceed
                        print(f"Warning: requirements installation failed: {e}")

                _safe_install(requirements_path)
            # Ensure parent packages are importable
            import importlib as _importlib

            _importlib.import_module("app")
            _importlib.import_module("app.domain")

            # Import the model under its fully-qualified package name
            model_full_path = os.path.join(project_root, "app/domain/model.py")
            spec = importlib.util.spec_from_file_location(
                "app.domain.model", model_full_path
            )
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            spec.loader.exec_module(module)
            return {
                "model": module.ModelController(),
                "status": "success",
                "message": "Model imported successfully",
            }

    except Exception as e:
        return {
            "model": None,
            "status": "error",
            "message": f"Error importing model: {e}",
        }
    finally:
        os.chdir(original_cwd)


def evaluate_language_detection(
    model,
    dataset_samples: List[Dict],
    max_per_lang: int = None,
    num_workers: int = 1,
    progress_total_callback: Optional[Callable[[int], None]] = None,
    progress_callback: Optional[Callable[[], None]] = None,
    debug: bool = False,
) -> Tuple[Dict, List[Dict]]:
    """
    Evaluate the model on language detection task

    Args:
        model: The ModelController instance
        dataset_samples: List of {"text": str, "language": str} samples

    Returns:
        Dict with evaluation results
    """
    try:
        # Expect samples to be provided by the caller (handler handles discovery)

        total = 0
        true_base, pred_base, predictions = [], [], []
        used_per_lang = {}
        start = time.perf_counter()

        # Prepare filtered samples upfront respecting max_per_lang
        filtered_samples = []
        for s in dataset_samples:
            t, gt = s.get("text", ""), s.get("language", "")
            if not t or not gt:
                continue
            base = gt.split("_")[0]
            if max_per_lang is not None:
                c = used_per_lang.get(base, 0)
                if c >= max_per_lang:
                    continue
            used_per_lang[base] = used_per_lang.get(base, 0) + 1
            filtered_samples.append(s)

        if progress_total_callback:
            try:
                progress_total_callback(len(filtered_samples))
            except Exception:
                pass

        def _eval_text(text: str) -> Tuple[str, float]:
            t0 = time.perf_counter()
            try:
                label = model.single_evaluation(text).get("label", "")
            except Exception:
                label = ""
            dt = time.perf_counter() - t0
            return label, dt

        latency_sum_s = 0.0
        if num_workers and num_workers > 1:
            with ThreadPoolExecutor(max_workers=num_workers) as executor:
                futures = {
                    executor.submit(_eval_text, s.get("text", "")): s
                    for s in filtered_samples
                }
                for future in as_completed(futures):
                    s = futures[future]
                    t, gt = s.get("text", ""), s.get("language", "")
                    y, dt = future.result()
                    latency_sum_s += dt
                    base = gt.split("_")[0]
                    total += 1
                    true_base.append(base)
                    pred_base.append(y.split("_")[0] if y else "")
                    predictions.append(
                        {
                            "text": t,
                            "true_language": gt,
                            "predicted_language": y,
                            "correct": (y == gt),
                        }
                    )
                    if progress_callback:
                        try:
                            progress_callback()
                        except Exception:
                            pass
        else:
            for s in filtered_samples:
                t, gt = s.get("text", ""), s.get("language", "")
                y, dt = _eval_text(t)

                latency_sum_s += dt
                base = gt.split("_")[0]
                total += 1
                true_base.append(base)
                pred_base.append(y.split("_")[0] if y else "")
                predictions.append(
                    {
                        "text": t,
                        "true_language": gt,
                        "predicted_language": y,
                        "correct": (y == gt),
                    }
                )
                if progress_callback:
                    try:
                        progress_callback()
                    except Exception:
                        pass
        elapsed = time.perf_counter() - start
        if debug:
            print(predictions, "predictions")
        # Per-language metrics (one-vs-rest)
        langs = sorted(set(true_base))
        if debug:
            print(true_base, "true_base")
            print(pred_base, "pred_base")
        per_lang = {}
        f1_values = []
        fpr_values = []
        for L in langs:
            tp = sum(1 for tb, pb in zip(true_base, pred_base) if tb == L and pb == L)
            fp = sum(1 for tb, pb in zip(true_base, pred_base) if tb != L and pb == L)
            fn = sum(1 for tb, pb in zip(true_base, pred_base) if tb == L and pb != L)
            tn = total - tp - fp - fn
            prec = tp / (tp + fp) if (tp + fp) else 0.0
            rec = tp / (tp + fn) if (tp + fn) else 0.0
            f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) else 0.0
            fpr = fp / (fp + tn) if (fp + tn) else 0.0
            per_lang[L] = {"f1": round(f1, 4), "fpr": round(fpr, 4)}
            f1_values.append(f1)
            fpr_values.append(fpr)

        macro_f1 = (sum(f1_values) / len(f1_values)) if f1_values else 0.0
        macro_fpr = (sum(fpr_values) / len(fpr_values)) if fpr_values else 0.0
        thr_ms = (elapsed / total * 1000.0) if total else 0.0
        print(thr_ms, "thr_ms")
        avg_latency_ms = (latency_sum_s / total * 1000.0) if total else 0.0

        scores = {
            "status": "success",
            "f1": round(macro_f1, 4),
            "fpr": round(macro_fpr, 4),
            "latency": round(avg_latency_ms, 2),
            "total_predictions": total,
            "per_language": per_lang,
            "main_metric": round(macro_f1, 4),
        }
        return scores, predictions

    except Exception as e:
        return {
            "status": "error",
            "message": f"Error during evaluation: {e}",
            "average_f1": 0.0,
            "average_fpr": 0.0,
            "throughput_ms": 0.0,
            "per_language": {},
        }, []


def upload_results(
    status_code: int,
    message: str,
    results: Dict,
    model_id: str,
    endpoint_url: str,
    metadata_s3_path: str = None,
    predictions: Optional[List[Dict]] = None,
    dataset_label: Optional[str] = None,
):
    """Upload results JSON to S3 (if path provided) and POST to endpoint."""
    import requests

    payload = {
        "model_id": model_id,
        "status_code": status_code,
        "message": message,
        "scores": results,
    }
    if dataset_label:
        payload["dataset_name"] = dataset_label

    # Upload to S3 (best-effort)
    if metadata_s3_path:
        try:
            bucket_name = metadata_s3_path.split("/")[2]
            key_prefix = "/".join(metadata_s3_path.split("/")[3:])
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            )
            base_key = f"{key_prefix}{model_id}/"
            if dataset_label:
                base_key = f"{base_key}{dataset_label}/"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=f"{base_key}metadata.json",
                Body=json.dumps(payload),
            )
            if predictions is not None:
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=f"{base_key}predictions.json",
                    Body=json.dumps({"model_id": model_id, "predictions": predictions}),
                )
        except Exception as e:
            print(f"Error uploading results to S3: {e}")

    # POST to endpoint (fix common local misuse of https with Uvicorn http)
    try:
        response = requests.post(endpoint_url, json=payload)
        response.raise_for_status()
        return {
            "status": "success",
            "message": "Results uploaded successfully",
            "status_code": response.status_code,
        }
    except Exception as e:
        return {"status": "error", "message": f"Error uploading results: {e}"}


def handler(event, debug=True):
    """
    This function processes incoming requests for WMDQS language detection evaluation.

    Args:
        event (dict): Contains the input data and request metadata

    Returns:
        dict: The evaluation results
    """

    print("WMDQS Language Detection Worker Start")
    input_data = event["input"]

    # Extract required parameters
    model_path = input_data.get("model_path")
    dataset_samples = input_data.get("dataset_samples", [])
    model_id = input_data.get("model_id")
    endpoint_url = input_data.get("endpoint_url")
    metadata_s3_path = input_data.get("metadata_s3_path")

    if not model_path:
        return {"status": "error", "message": "model_path is required"}

    # Download and import model
    print("Downloading and importing model...")
    model_result = download_and_import_model(model_path)

    if model_result["status"] != "success":
        print(f"Model import failed: {model_result['message']}")
        if endpoint_url and model_id:
            upload_results(
                500,
                model_result.get("message", "Import failed"),
                {},
                model_id,
                endpoint_url,
                metadata_s3_path,
            )
        return model_result

    model = model_result["model"]
    print("Model imported successfully")

    # Determine datasets to evaluate
    print("Preparing datasets...")
    dataset_files = (
        input_data.get("dataset_files") or input_data.get("dataset_paths") or []
    )

    def _load_tsv_samples(tsv_path: str) -> List[Dict]:
        base_path = tsv_path
        if not os.path.isabs(base_path):
            base_path = os.path.join(os.path.dirname(__file__), "data", base_path)
        # Increase CSV field size limit to accommodate very long text fields
        try:
            import sys as _sys

            csv.field_size_limit(_sys.maxsize)
        except Exception:
            try:
                csv.field_size_limit(2147483647)
            except Exception:
                pass
        with open(base_path, encoding="utf-8", newline="") as f:
            reader = csv.reader(f, delimiter="\t")
            return [
                {"language": row[0], "text": row[1]} for row in reader if len(row) >= 2
            ]

    # Always auto-discover .tsv datasets under data/
    dataset_specs: List[Tuple[str, List[Dict]]] = []  # (label, samples)
    existing_labels = set()
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    try:
        for fn in sorted(os.listdir(data_dir)):
            if fn.endswith(".tsv"):
                label = os.path.splitext(os.path.basename(fn))[0]
                try:
                    samples = _load_tsv_samples(fn)
                except Exception as e:
                    print(f"Error loading dataset {fn}: {e}")
                    continue
                dataset_specs.append((label, samples))
                existing_labels.add(label)
    except Exception as e:
        print(f"Error discovering datasets: {e}")

    # Add any explicitly provided dataset files (outside data/) if not already included
    for p in dataset_files:
        label = os.path.splitext(os.path.basename(p))[0]
        if label in existing_labels:
            continue
        try:
            samples = _load_tsv_samples(p)
        except Exception as e:
            print(f"Error loading dataset {p}: {e}")
            continue
        dataset_specs.append((label, samples))
        existing_labels.add(label)

    # Optionally add provided in-memory samples as an additional dataset
    if dataset_samples:
        provided_label = input_data.get("dataset_label") or "provided"
        if provided_label in existing_labels:
            idx = 2
            while f"{provided_label}-{idx}" in existing_labels:
                idx += 1
            provided_label = f"{provided_label}-{idx}"
        dataset_specs.append((provided_label, dataset_samples))
        existing_labels.add(provided_label)

    # Run evaluations sequentially
    all_scores: Dict[str, Dict] = {}
    last_scores: Dict = {}
    pipeline_start = time.time()
    for label, samples in dataset_specs:
        print(
            f"Running language detection evaluation for dataset '{label}' with {len(samples) if samples else 'auto'} samples..."
        )
        # Optional limiter for local/debugging runs
        max_per_lang = input_data.get("max_num_samples_per_language")
        num_workers = input_data.get("num_workers", 1)
        # Progress reporting with tqdm if available
        pbar = None
        total_set = False
        try:
            from tqdm import tqdm  # type: ignore

            pbar = tqdm(desc=f"{label}", unit="sample")

            def _set_total(n: int):
                nonlocal total_set
                if pbar is not None and not total_set:
                    pbar.total = n
                    total_set = True

            def _advance():
                if pbar is not None:
                    pbar.update(1)

        except Exception:

            def _set_total(n: int):
                pass

            def _advance():
                pass

        scores, predictions = evaluate_language_detection(
            model,
            samples,
            max_per_lang=max_per_lang,
            num_workers=num_workers,
            progress_total_callback=_set_total,
            progress_callback=_advance,
            debug=debug,
        )
        # Include dataset name in scores as requested
        try:
            scores["dataset_name"] = label
        except Exception:
            pass
        if pbar is not None:
            try:
                pbar.close()
            except Exception:
                pass
        last_scores = scores

        print(
            f"Evaluation for '{label}' completed. Avg F1: {scores.get('average_f1', 0)}, Avg FPR: {scores.get('average_fpr', 0)}, Throughput(ms): {scores.get('throughput_ms', 0)}"
        )

        # Upload results if endpoint provided
        if endpoint_url and model_id:
            print(f"Uploading results for dataset '{label}'...")
            upload_status = upload_results(
                200 if scores.get("status") == "success" else 500,
                scores.get("message", "Evaluation completed"),
                scores,
                model_id,
                endpoint_url,
                metadata_s3_path,
                predictions=predictions,
                dataset_label=label,
            )
            print(f"Upload status for '{label}': {upload_status['message']}")

        all_scores[label] = scores

    # Return aggregated if multiple datasets, otherwise keep previous behavior
    pipeline_end = time.time()
    total_seconds = round(pipeline_end - pipeline_start, 2)
    if len(all_scores) > 1:
        return {
            "status": "success",
            "results_by_dataset": all_scores,
            "total_runtime_seconds": total_seconds,
        }
    last_scores = dict(last_scores)
    last_scores["total_runtime_seconds"] = total_seconds
    return last_scores


# Start the Serverless function when the script is run
if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
