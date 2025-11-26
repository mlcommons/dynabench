# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from fastapi import APIRouter, Depends, File, Request, UploadFile

from app.api.middleware.authentication import validate_access_token
from app.domain.schemas.base.dataset import UpdateDatasetInfo
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


@router.get("/task/{task_id}")
async def get_datasets_by_task_id(task_id: int):
    return DatasetService().get_datasets_by_task_id(task_id)


@router.get("/get_access_types")
async def get_dataset_info_by_name():
    return DatasetService().get_dataset_info_by_name()


@router.get("/get_log_access_types")
async def get_log_access_types():
    return DatasetService().get_log_access_types()


@router.put("/update/{dataset_id}")
async def update_dataset(
    dataset_id: int,
    model: UpdateDatasetInfo,
    request: Request,
    token_payload=Depends(validate_access_token),
):
    return DatasetService().update_dataset_access_type(dataset_id, request, model)


@router.delete("/delete/{dataset_id}")
async def delete_dataset(
    dataset_id: int, request: Request, token_payload=Depends(validate_access_token)
):
    return DatasetService().delete_dataset(dataset_id, request)
