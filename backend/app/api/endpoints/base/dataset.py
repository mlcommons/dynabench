# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, File, UploadFile

from app.domain.services.base.dataset import DatasetService


router = APIRouter()


@router.post("/upload_dataset")
async def upload_dataset(
    task_id: int, task_code: str, dataset_name: str, dataset: UploadFile = File(...)
):
    return DatasetService().upload_dataset(task_id, task_code, dataset_name, dataset)


@router.post("/create_dataset_in_db")
async def create_dataset_in_db(
    task_id: str,
    dataset_name: str,
    access_type: str,
):
    return DatasetService().create_dataset_in_db(task_id, dataset_name, access_type)
