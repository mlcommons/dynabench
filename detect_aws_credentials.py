# Copyright (c) Facebook, Inc. and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Note that the source for most of this file is
# https://github.com/pre-commit/pre-commit-hooks/blob/master/pre_commit_hooks/detect_aws_credentials.py

import argparse
import os
from typing import List, NamedTuple, Optional, Sequence, Set


class BadFile(NamedTuple):
    filename: str
    key: str


def get_aws_cred_files_from_env() -> Set[str]:
    """Extract credential file paths from environment variables."""
    return {
        os.environ[env_var]
        for env_var in (
            "AWS_CONFIG_FILE",
            "AWS_CREDENTIAL_FILE",
            "AWS_SHARED_CREDENTIALS_FILE",
            "BOTO_CONFIG",
        )
        if env_var in os.environ
    }


def get_aws_secrets_from_env() -> Set[str]:
    """Extract AWS secrets from environment variables."""
    keys = set()
    for env_var in (
        "AWS_SECRET_ACCESS_KEY",
        "AWS_SECURITY_TOKEN",
        "AWS_SESSION_TOKEN",
    ):
        if os.environ.get(env_var):
            keys.add(os.environ[env_var])
    return keys


# Changed this function because our config are formatted differently
def get_aws_secrets_from_file(credentials_file: str) -> Set[str]:
    """Extract AWS secrets from configuration files.
    Read an ini-style configuration file and return a set with all found AWS
    secret access keys.
    """
    aws_credentials_file_path = os.path.expanduser(credentials_file)

    if not os.path.exists(aws_credentials_file_path):
        return set()

    keys = set()
    with open(aws_credentials_file_path) as f:
        lines = f.readlines()
        for line in lines:
            if (
                "aws_secret_access_key" in line
                or "aws_security_token" in line
                or "aws_session_token" in line
                or "aws_access_key_id" in line
            ):

                key_info = line.split(":")[1][2:-3].strip()
                if (key_info != "") or (key_info != '"'):
                    keys.add(key_info)

    return keys


def check_file_for_aws_keys(
    filenames: Sequence[str],
    keys: Set[bytes],
) -> List[BadFile]:
    """Check if files contain AWS secrets.
    Return a list of all files containing AWS secrets and keys found, with all
    but the first four characters obfuscated to ease debugging.
    """
    bad_files = []

    for filename in filenames:
        # ignore this file, since it will get flagged for having
        # the text `aws_access_key_id` and such in the above function
        if filename == "detect_aws_credentials.py":
            continue

        with open(filename, "rb") as content:
            text_body = content.read()
            for key in keys:
                # naively match the entire file, low chance of incorrect
                # collision
                if key in text_body:
                    key_hidden = key.decode()[:4].ljust(28, "*")
                    bad_files.append(BadFile(filename, key_hidden))
    return bad_files


def main(argv: Optional[Sequence[str]] = None) -> int:
    curr_path = os.path.dirname(os.path.realpath(__file__))

    parser = argparse.ArgumentParser()
    parser.add_argument("filenames", nargs="+", help="Filenames to run")

    # Changed this default to fit our codebase
    parser.add_argument(
        "--credentials-file",
        dest="credentials_file",
        action="append",
        default=[
            f"{curr_path}/builder/build_config.py",
            f"{curr_path}/evaluation/eval_config.py",
            f"{curr_path}/api/common/config.py",
        ],
        help=(
            "Location of additional AWS credential file from which to get "
            "secret keys. Can be passed multiple times."
        ),
    )

    args = parser.parse_args(argv)

    credential_files = set(args.credentials_file)

    # Add the credentials files configured via environment variables to the set
    # of files to to gather AWS secrets from.
    credential_files |= get_aws_cred_files_from_env()

    keys: Set[str] = set()
    for credential_file in credential_files:
        keys |= get_aws_secrets_from_file(credential_file)
    # Secrets might be part of environment variables, so add such secrets to
    # the set of keys.
    keys |= get_aws_secrets_from_env()
    if "" in keys:
        keys.remove("")
    if '"' in keys:
        keys.remove('"')

    if not keys:
        return 0

    if not keys:
        print(
            "No AWS keys were found in the configured credential files and "
            "environment variables.\nPlease ensure you have the correct "
            "setting for --credentials-file",
        )
        return 2

    keys_b = {key.encode() for key in keys}
    print(args.filenames)
    bad_filenames = check_file_for_aws_keys(args.filenames, keys_b)
    if bad_filenames:
        for bad_file in bad_filenames:
            print(f"AWS secret found in {bad_file.filename}: {bad_file.key}")
        return 1
    else:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
