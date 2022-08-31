# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Download samples and eval data"""
import argparse
import os
import tarfile
import zipfile

import gdown
import wget
import yaml


def download_file(url, folder_path, extract=False, g_drive=False):
    """Download file from internet"""
    if url:
        if g_drive:
            file_name = "preliminary_evaluation_dataset.zip"
            output_path = os.path.join(folder_path, file_name)
            gdown.download(url, output_path, quiet=False, fuzzy=True)
            if extract:
                with zipfile.ZipFile(output_path, "r") as zip_ref:
                    zip_ref.extractall(folder_path)
        else:
            output_path = wget.download(url, out=folder_path)
            if extract:
                tar = tarfile.open(output_path, "r:gz")
                tar.extractall(folder_path)
                tar.close()


def main():
    """Main function that perform the download"""

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--parameters_file",
        type=str,
        required=True,
        help="File containing parameters for the download",
    )
    parser.add_argument(
        "--output_path",
        type=str,
        required=True,
        help="Path where data will be stored",
    )
    args = parser.parse_args()

    with open(args.parameters_file) as f:
        params = yaml.full_load(f)

    output_path = args.output_path
    if "dataset_url" in params:
        download_file(params["dataset_url"], output_path, extract=True)
    if "metadata_url" in params:
        download_file(params["metadata_url"], output_path)
    if "embeddings_url" in params:
        download_file(params["embeddings_url"], output_path, extract=True, g_drive=True)


if __name__ == "__main__":
    main()
