import hashlib
import json
import os

import requests


DYNABENCH_PROD_API = "https://api.dynabench.org"


class dotdict(dict):
    """dot.notation access to dictionary attributes"""

    __getattr__ = dict.get
    __setattr__ = dict.__setitem__
    __delattr__ = dict.__delitem__


def dynabench_get(uri: str, data=None, **kwargs):
    DYNABENCH_API = os.getenv("DYNABENCH_API", DYNABENCH_PROD_API)

    if data:
        DYNABENCH_SECRET = os.getenv("DYNABENCH_SECRET")
        data = json.dumps(wrap_data_with_signature(data, DYNABENCH_SECRET))
    return requests.get("/".join((DYNABENCH_API, uri)), data=data, **kwargs)


def dynabench_post(uri: str, data=None, **kwargs):
    DYNABENCH_API = os.getenv("DYNABENCH_API", DYNABENCH_PROD_API)

    if data:
        DYNABENCH_SECRET = os.getenv("DYNABENCH_SECRET")
        data = json.dumps(wrap_data_with_signature(data, DYNABENCH_SECRET))
    return requests.post("/".join((DYNABENCH_API, uri)), data=data, **kwargs)


def api_download_model(model_id, model_secret, prod=False):
    data = {"model_id": model_id, "secret": model_secret}

    with dynabench_get(
        f"models/{model_id}/download",
        data=data,
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


def api_download_dataset(dataset_id, perturb_prefix, prod=False):
    data = {"dataset_id": dataset_id, "perturb_prefix": perturb_prefix}

    with dynabench_get(
        f"datasets/{dataset_id}/download",
        data=data,
        headers={"Content-Type": "application/json"},
        verify=prod,
        stream=True,
    ) as r:
        download_filename = (
            f"/tmp/datasetdownloadid_{dataset_id}_perturbprefix_{perturb_prefix}.tar.gz"
        )
        r.raise_for_status()
        with open(download_filename, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return download_filename


def wrap_data_with_signature(data: str, secret):
    return {"data": data, "signature": generate_signature(data, secret)}


def generate_signature(data: str, secret):
    h = hashlib.sha1()
    h.update(f"{data}{secret}".encode("utf-8"))
    signed = h.hexdigest()
    return signed
