# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Download samples and eval data"""
import argparse
import os
import zipfile

import gdown
import yaml
from tqdm import tqdm


def download_file(url, folder_path, file_name):
    """Download file from Google Drive"""
    output_path = os.path.join(folder_path, file_name)
    gdown.download(url, output_path, quiet=False, fuzzy=True)


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
    dataset_url = params["dataset_url"]
    file_name = "dataperf-vision-selection-resources.zip"

    download_file(dataset_url, output_path, file_name)

    """with zipfile.ZipFile(os.path.join(output_path, file_name), 'r') as zip_ref:
        zip_ref.extractall(output_path)"""

    with zipfile.ZipFile(os.path.join(output_path, file_name)) as zf:
        for member in tqdm(zf.infolist(), desc="Extracting "):
            try:
                zf.extract(member, output_path)
            except zipfile.error as e:
                print(e)


if __name__ == "__main__":
    main()
