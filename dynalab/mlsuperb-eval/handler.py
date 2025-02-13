# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import importlib.util
import json
import os
import re
import shutil
import statistics
import sys
import zipfile
from typing import List

import boto3
import datasets
import espnetez as ez
import numpy as np
import requests
import runpod
from jiwer import cer
from pydantic import BaseModel, Field
from tqdm import tqdm


class Data(BaseModel):
    """Input schema for single audio sample inference"""

    audio: List[float]
    sample_rate: int = Field(default=16000, gt=0)
    language: str = None  # Add language field to match new schema

    def to_numpy(self) -> np.ndarray:
        """Convert audio to numpy array"""
        return np.array(self.audio, dtype=np.float32)


def download_and_run_model(s3_path: str):
    "Downloads a zip file from s3 and returns the path to the unzipped file"
    original_cwd = os.getcwd()  # Store original working directory
    try:
        if not os.path.exists("model.zip"):
            s3_client = boto3.client("s3")
            bucket_name = s3_path.split("/")[2]
            key = "/".join(s3_path.split("/")[3:])
            response = s3_client.get_object(Bucket=bucket_name, Key=key)
            # Write to a zip file
            with open("model.zip", "wb") as f:
                f.write(response["Body"].read())

        # Get the structure from the zip file
        with zipfile.ZipFile("model.zip", "r") as zip_ref:
            # List all files to debug
            all_paths = zip_ref.namelist()

            # Find any directory that contains 'app/domain/model.py'
            model_path = next(
                path for path in all_paths if path.endswith("app/domain/model.py")
            )
            root_dir = model_path.split("/")[0]  # Get the root directory name
            print(f"Root directory: {root_dir}")

            # Extract if not already extracted
            if not os.path.exists(root_dir):
                zip_ref.extractall(".")
                print("Extracted model.zip")
            else:
                print("Model already extracted")

            print(f"Found model at: {model_path}")

            # Get the directory containing app/domain/model.py
            project_root = os.path.abspath(
                os.path.join(".", os.path.dirname(model_path))
            )
            project_root = os.path.dirname(
                os.path.dirname(project_root)
            )  # Go up two levels to get to the project root
            parent_dir = os.path.dirname(project_root)
            print(f"Project root: {project_root}")
            print(f"Parent directory: {parent_dir}")

            # Change working directory to project root
            os.chdir(project_root)
            print("Changed working directory to:", os.getcwd())

            # Add both parent directory and project root to Python path
            if parent_dir not in sys.path:
                sys.path.insert(0, parent_dir)
            if project_root not in sys.path:
                sys.path.insert(0, project_root)

            print("Python path:", sys.path)

            # Install requirements.txt if it exists
            requirements_path = os.path.join(project_root, "requirements.txt")
            if os.path.exists(requirements_path):
                print(f"Installing requirements from: {requirements_path}")
                import subprocess

                subprocess.check_call(
                    [sys.executable, "-m", "pip", "install", "-r", requirements_path]
                )
            else:
                print("No requirements.txt found")

            # Import the model using its full path
            model_full_path = os.path.join(project_root, "app/domain/model.py")
            print(f"Importing model from: {model_full_path}")

            spec = importlib.util.spec_from_file_location("model", model_full_path)
            module = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = module
            spec.loader.exec_module(module)

            return {
                "results": module.ModelController(),
                "status_code": 200,
                "message": "Model imported successfully",
            }

    except Exception as e:
        return {
            "message": f"""Error importing model.
                You have to follow the Dynalab model template.The error is:{e}""",
            "status_code": 500,
            "results": {},
        }
    finally:
        # Restore original working directory
        os.chdir(original_cwd)


def download_dataset() -> datasets.Dataset:
    try:
        ds = datasets.load_dataset("wanchichen/ml_superb_hf_private")

    except Exception as e:
        return {
            "message": f"""Error downloading evaluation dataset.
                Please report this error to the Dynabench team and try again later.
                Error was {e}""",
            "status_code": 500,
            "results": {},
        }

    data_info = {
        "speech": lambda d: d["audio"]["array"].astype(np.float32),  # 1-D raw waveform
        "text": lambda d: d["text"],  # text
        "lang": lambda d: d["language"],  # iso-3 language id
    }

    standard_dataset = ez.ESPnetEZDataset(ds["test_standard"], data_info=data_info)
    dialect_dataset = ez.ESPnetEZDataset(ds["test_dialect"], data_info=data_info)

    return {
        "results": {
            "standard_dataset": standard_dataset,
            "dialect_dataset": dialect_dataset,
        },
        "status_code": 200,
        "message": "Dataset downloaded successfully",
    }


def run_inference(
    full_model, standard_dataset: datasets.Dataset, dialect_dataset: datasets.Dataset
):
    """Run inference on the dataset and return results"""
    try:
        pretrained_model = full_model.single_inference
        standard_utts = []
        standard_langs = []
        dialect_utts = []
        dialect_langs = []

        # Iterate through the dataset with progress bar
        print("Processing standard dataset...")
        for utt in tqdm(standard_dataset, desc="Standard Dataset"):
            try:
                # Get reference text (removing first token which is usually language id)
                standard_langs.append(utt[1]["lang"])
                ref = " ".join(utt[1]["text"].split()[1:])
                # Convert speech to tensor and run inference
                data = Data(
                    audio=utt[1]["speech"],
                    sample_rate=16000,
                    language=utt[1]["lang"],  # Pass language to model
                )
                hyp = pretrained_model(data)
                cur_iteration_result = {
                    "ref": ref,
                    "lang": utt[1]["lang"],
                    "hyp": hyp.text,
                    "predicted_lang": hyp.language,
                }
                standard_utts.append(cur_iteration_result)
            except Exception as e:
                print(f"Error processing standard dataset: {e}")
                continue

        standard_langs = list(set(standard_langs))

        print("\nProcessing dialect dataset...")
        for utt in tqdm(dialect_dataset, desc="Dialect Dataset"):
            try:
                dialect_langs.append(utt[1]["lang"])
                data = Data(
                    audio=utt[1]["speech"], sample_rate=16000
                )  # Changed from speech to audio
                hyp = pretrained_model(data)  # Get first best hypothesis
                cur_iteration_result = {
                    "ref": utt[1]["text"],
                    "lang": utt[1]["lang"],
                    "hyp": hyp.text,
                    "predicted_lang": hyp.language,
                }
                dialect_utts.append(cur_iteration_result)
            except Exception as e:
                print(f"Error processing dialect dataset: {e}")
                continue

        dialect_langs = list(set(dialect_langs))

        final_results = {
            "standard_utts": standard_utts,
            "dialect_utts": dialect_utts,
            "standard_langs": standard_langs,
            "dialect_langs": dialect_langs,
        }
        return {
            "results": final_results,
            "status_code": 200,
            "message": "Inference ran successfully",
        }

    except Exception as e:
        return {
            "message": f"Error running inference. The error is:{e}",
            "status_code": 500,
            "results": {},
        }


def save_results(results, model_id, save_s3_path):
    """Save the results to s3 using the model_id and save_s3_path"""
    bucket_name = save_s3_path.split("/")[2]
    key = "/".join(save_s3_path.split("/")[3:])
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    s3_client.put_object(
        Bucket=bucket_name,
        Key=f"{key}{model_id}/results.json",
        Body=json.dumps(results),
    )


def evaluate_results(results):
    """Evaluate the results using CER and language identification accuracy metrics

    Args:
        results: Dictionary containing standard_utts
                and dialect_utts (lists of (ref, lang, hyp) tuples)
                and standard_langs, dialect_langs (lists of language codes)
    Returns:
        Dictionary containing evaluation metrics
    """

    def remove_punctuation(sentence):
        punctuation = r"""!()-[]{};:'"\,<>./?@#$%^&*_~"""
        new_sentence = ""
        for char in sentence:
            if char not in punctuation:
                new_sentence += char
        return new_sentence

    def normalize_and_calculate_cer(ref, hyp, remove_spaces):
        """
        Calculates CER given normalized hyp and ref.
        Normalization removes all punctuation and uppercases all text.
        For Chinese, Thai, and Japanese, we remove spaces too.

        Example:
        I'll be going to the CMU campus. ->
                        ILL BE GOING TO THE CMU CAMPUS
        ill be going to the see them you campus ->
                        ILL BE GOING TO THE SEE THEM YOU CAMPUS
        我想去餐厅 我非常饿 ->
                        我想去餐厅我非常饿
        """

        if remove_spaces:
            hyp = re.sub(r"\s", "", hyp)
            ref = re.sub(r"\s", "", ref)

        # remove punctuation
        hyp = remove_punctuation(hyp)
        ref = remove_punctuation(ref)

        hyp = hyp.upper()
        ref = ref.upper()
        if len(ref) == 0:
            return -1
        return cer(ref, hyp)

    def calculate_acc(hyps, refs):
        acc = 0
        for hyp, ref in zip(hyps, refs):
            if hyp == ref:
                acc += 1
        return acc / (len(refs))

    try:
        standard_utts = results["standard_utts"]
        standard_langs = results["standard_langs"]
        dialect_utts = results["dialect_utts"]
        dialect_langs = results["dialect_langs"]

        # Calculate CER metrics for standard set
        all_standard_cers = []
        all_standard_lang_acc = []
        remove_space_langs = ["cmn", "jpn", "tha", "yue"]

        for lang in standard_langs:
            lang_cers = []
            lang_acc_hyps = []
            lang_acc_refs = []
            for utterance in standard_utts:
                if utterance["lang"] == lang:
                    remove_spaces = lang in remove_space_langs
                    # Remove language ID from hypothesis before CER calculation
                    hyp_without_lang = " ".join(utterance["hyp"].split()[1:])
                    lang_cer = normalize_and_calculate_cer(
                        utterance["ref"].strip(),
                        hyp_without_lang.strip(),
                        remove_spaces,
                    )
                    if lang_cer < 0:
                        continue
                    lang_cers.append(lang_cer)
                    lang_acc_hyps.append(utterance["predicted_lang"].strip("[]"))
                    lang_acc_refs.append(utterance["lang"])
            if lang_cers:
                all_standard_cers.append(sum(lang_cers) / len(lang_cers))
                all_standard_lang_acc.append(
                    calculate_acc(lang_acc_hyps, lang_acc_refs)
                )

        # Sort CERs for worst-15 calculation
        all_standard_cers.sort(reverse=True)
        lid_accuracy = round(
            sum(all_standard_lang_acc) / len(all_standard_lang_acc) * 100, 1
        )
        standard_cer = round(sum(all_standard_cers) / len(all_standard_cers) * 100, 1)
        cer_std = round(statistics.stdev(all_standard_cers) * 100, 1)
        worst = round((sum(all_standard_cers[:15]) / 15) * 100, 1)

        # Calculate CER metrics for dialect set
        all_dialect_cers = []
        all_dialect_lang_acc = []
        for lang in dialect_langs:
            lang_cers = []
            lang_acc_hyps = []
            lang_acc_refs = []
            for utterance in dialect_utts:
                if utterance["lang"] == lang:
                    remove_spaces = lang in remove_space_langs
                    # Remove language ID from hypothesis before CER calculation
                    hyp_without_lang = " ".join(utterance["hyp"].split()[1:])
                    lang_cer = normalize_and_calculate_cer(
                        utterance["ref"].strip(),
                        hyp_without_lang.strip(),
                        remove_spaces,
                    )
                    if lang_cer < 0:
                        continue
                    lang_cers.append(lang_cer)
                    lang_acc_hyps.append(utterance["predicted_lang"].strip("[]"))
                    lang_acc_refs.append(utterance["lang"])
            if lang_cers:
                all_dialect_cers.append(sum(lang_cers) / len(lang_cers))
                all_dialect_lang_acc.append(calculate_acc(lang_acc_hyps, lang_acc_refs))

        # Sort CERs for worst-15 calculation
        all_dialect_cers.sort(reverse=True)
        lid_dialect_accuracy = round(
            sum(all_dialect_lang_acc) / len(all_dialect_lang_acc) * 100, 1
        )
        dialect_cer = round(sum(all_dialect_cers) / len(all_dialect_cers) * 100, 1)

        evaluation_results = {
            "Standard_LangID_Accuracy": lid_accuracy,
            "Standard_CER": standard_cer,
            "Standard_STD_CER": cer_std,
            "Standard_CER_15_WORSE": worst,
            "Dialect_LangID_Accuracy": lid_dialect_accuracy,
            "Dialect_CER": dialect_cer,
        }

        return {
            "results": evaluation_results,
            "status_code": 200,
            "message": "Evaluation ran successfully",
        }

    except Exception as e:
        return {
            "message": f"Error evaluating results. The error is:{e}",
            "status_code": 500,
            "scores": {},
        }


def upload_results(
    status_code, message, results, model_id, endpoint_url, metadata_s3_path
):
    """Upload the results to the endpoint_url.
    The schema looks like: {model_id: int, message: str, status_code:int, scores: dict}
    """

    final_payload = {
        "status_code": status_code,
        "message": message,
        "model_id": model_id,
        "scores": results,
    }
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    bucket_name = metadata_s3_path.split("/")[2]
    key = "/".join(metadata_s3_path.split("/")[3:])
    s3_client.put_object(
        Bucket=bucket_name,
        Key=f"{key}{model_id}/metadata.json",
        Body=json.dumps(final_payload),
    )

    try:
        response = requests.post(endpoint_url, json=final_payload)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4xx, 5xx)

        return {
            "status_code": response.status_code,
            "results": response.json(),
            "message": "Results uploaded successfully",
        }
    except requests.exceptions.RequestException as e:
        return {
            "status_code": getattr(e.response, "status_code", 500),
            "message": f"Error uploading results. The error is:{e}",
            "results": {},
        }


def clean_env():
    """Clean the environment by deleting the model zip
    file and all extracted contents"""
    # Remove the zip file
    # Get the list of all files/directories
    # that were in current directory before extraction
    # and remove them if they came from the zip file
    with zipfile.ZipFile("model.zip", "r") as zip_ref:
        extracted_files = zip_ref.namelist()
        for item in extracted_files:
            full_path = os.path.join(".", item)
            if os.path.isfile(full_path):
                os.remove(full_path)
            elif os.path.isdir(full_path):
                shutil.rmtree(full_path)

    if os.path.exists("model.zip"):
        os.remove("model.zip")
    pass


def handler(evaluation_job):
    """Handler for the evaluation job."""

    evaluation_job = evaluation_job["input"]

    model_results = download_and_run_model(evaluation_job["model_path"])
    if model_results["status_code"] != 200:
        print(f"Error downloading and running model, {model_results['message']}")
        upload_status = upload_results(
            model_results["status_code"],
            model_results["message"],
            {},
            evaluation_job["model_id"],
            evaluation_job["endpoint_url"],
            evaluation_job["metadata_s3_path"],
        )
        clean_env()
        return {
            "status_code": upload_status["status_code"],
            "message": upload_status["message"],
            "results": upload_status["results"],
        }
    print("Downloaded model")

    dataset_results = download_dataset()
    if dataset_results["status_code"] != 200:
        upload_status = upload_results(
            dataset_results["status_code"],
            dataset_results["message"],
            {},
            evaluation_job["model_id"],
            evaluation_job["endpoint_url"],
            evaluation_job["metadata_s3_path"],
        )
        clean_env()
        return {
            "status_code": upload_status["status_code"],
            "message": upload_status["message"],
            "results": upload_status["results"],
        }
    print("Downloaded dataset")

    all_results = run_inference(
        model_results["results"],
        dataset_results["results"]["standard_dataset"],
        dataset_results["results"]["dialect_dataset"],
    )
    if all_results["status_code"] != 200:
        print(f"Error running inference, {all_results['message']}")
        upload_status = upload_results(
            all_results["status_code"],
            all_results["message"],
            {},
            evaluation_job["model_id"],
            evaluation_job["endpoint_url"],
            evaluation_job["metadata_s3_path"],
        )
        clean_env()
        return {
            "status_code": upload_status["status_code"],
            "message": upload_status["message"],
            "results": upload_status["results"],
        }
    print("Ran inference")

    save_results(
        all_results, evaluation_job["model_id"], evaluation_job["save_s3_path"]
    )
    print("Saved results")

    evaluation_results = evaluate_results(all_results["results"])
    print(evaluation_results)

    if evaluation_results["status_code"] != 200:
        print(f"Error evaluating results, {evaluation_results['message']}")
        upload_status = upload_results(
            evaluation_results["status_code"],
            evaluation_results["message"],
            {},
            evaluation_job["model_id"],
            evaluation_job["endpoint_url"],
            evaluation_job["metadata_s3_path"],
        )
        clean_env()
        return {
            "status_code": upload_status["status_code"],
            "message": upload_status["message"],
            "results": upload_status["results"],
        }
    print("Evaluated results")

    upload_status = upload_results(
        evaluation_results["status_code"],
        evaluation_results["message"],
        evaluation_results["results"],
        evaluation_job["model_id"],
        evaluation_job["endpoint_url"],
        evaluation_job["metadata_s3_path"],
    )
    print("Uploaded results")
    clean_env()
    return {
        "status_code": upload_status["status_code"],
        "message": upload_status["message"],
        "results": upload_status["results"],
    }


if __name__ == "__main__":
    runpod.serverless.start({"handler": handler})
