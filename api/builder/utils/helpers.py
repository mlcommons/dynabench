# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

# Copyright (c) Facebook, Inc. and its affiliates.

import json
import pickle
import sys

import requests

from build_config import build_config


DYNABENCH_API = build_config["DYNABENCH_API"]
decen_eaas_secret = build_config["decen_eaas_secret"]

sys.path.append("../api")  # noqa isort:skip
from common.helpers import wrap_data_with_signature  # noqa isort:skip


class dotdict(dict):
    """dot.notation access to dictionary attributes"""

    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


def load_queue_dump(path, logger=None):
    try:
        queue = pickle.load(open(path, "rb"))
        if logger:
            logger.info(f"Load existing queue from {path}.")
        return queue
    except FileNotFoundError:
        if logger:
            logger.info("No existing deployment queue found. Re-initializing...")
        return []


# Decentralized Eaas Helpers
def api_model_update(model, model_status, prod=False):
    data = {"deployment_status": model_status}

    requests.post(
        f"{DYNABENCH_API}/models/{model.id}/update_decen_eaas",
        data=json.dumps(wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )


def api_send_email(model, msg, subject, template, prod=False):
    data = {
        "secret": model.secret,
        "template": template,
        "msg": str(msg),
        "subject": subject,
    }

    requests.post(
        f"{DYNABENCH_API}/models/{model.id}/email_decen_eaas",
        data=json.dumps(wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
    )


def api_download_model(model_id, model_secret, prod=False):
    data = {"model_id": model_id, "secret": model_secret}

    with requests.get(
        f"{DYNABENCH_API}/models/{model_id}/download",
        data=json.dumps(wrap_data_with_signature(data, decen_eaas_secret)),
        headers={"Content-Type": "application/json"},
        verify=prod,
        stream=True,
    ) as r:
        download_filename = f"/tmp/modeldownloadid_{model_id}.tar.gz"
        r.raise_for_status()
        with open(download_filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return download_filename
