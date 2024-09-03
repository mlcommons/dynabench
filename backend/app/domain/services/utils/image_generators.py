# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import hashlib
import io
import json
import os
from abc import ABC, abstractmethod

import boto3
import openai
import requests
from openai import OpenAI
from PIL import Image

from app.domain.services.base.task import TaskService
from app.domain.services.utils.adapters import RequestSession
from app.domain.services.utils.constant import black_image, forbidden_image


class ImageProvider(ABC):
    def __init__(self):
        self.task_service = TaskService()
        self.timeout = 60
        self.session = boto3.Session(
            aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
            region_name=os.getenv("AWS_REGION"),
        )
        self.s3 = self.session.client("s3")
        self.dataperf_bucket = os.getenv("AWS_S3_DATAPERF_BUCKET")
        pass

    @abstractmethod
    def generate_images(self, prompt: str, num_images: int) -> list:
        pass

    def verify_image_darkness(self, image: str) -> bool:
        image_bytes = io.BytesIO(base64.b64decode(image))
        img = Image.open(image_bytes)
        img = img.convert("L")
        average_intensity = img.getdata()
        average_intensity = sum(average_intensity) / len(average_intensity)
        if average_intensity < 20 or black_image in image:
            return True
        return False

    def get_image_id(self, prompt: str, user_id: int, image: str) -> str:
        return (
            self.provider_name()
            + "_"
            + prompt
            + "_"
            + str(user_id)
            + "_"
            + hashlib.md5(image.encode()).hexdigest()
        )

    @property
    @abstractmethod
    def provider_name(self):
        pass


class Dalle2ImageProvider(ImageProvider):
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv("OPENAI")

    def generate_images(
        self,
        prompt: str,
        num_images: int,
        models: list = [],
        endpoint: str = "",
        user_id: int = 1912,
    ) -> list:
        client = OpenAI(api_key=self.api_key)
        try:
            response = client.images.generate(
                model="dall-e-2",
                prompt=prompt,
                size="512x512",
                n=1,
                response_format="b64_json",
            )
            message = "Success"
            image = response.data[0].b64_json
            dark_image = self.verify_image_darkness(image)
            if dark_image:
                image = forbidden_image
                message = "Image is too dark"

            image_id = self.get_image_id(prompt, user_id, image)
            filename = f"adversarial-nibbler/{prompt}/{user_id}/{image_id}.jpeg"
            self.s3.put_object(
                Body=base64.b64decode(image),
                Bucket=self.dataperf_bucket,
                Key=filename,
            )
            return {
                "generator": self.provider_name(),
                "message": message,
                "prompt": prompt,
                "id": image_id,
            }

        except openai.BadRequestError as e:
            json_error = json.loads(e.response.text)
            error_code = json_error.get("error", {}).get("code", e.response.status_code)
            error_message = json_error.get("error", {}).get(
                "message", "openai bad request error"
            )
            image_id = self.get_image_id(prompt, user_id, forbidden_image)
            return {
                "generator": self.provider_name(),
                "message": f"error code: {error_code}, error message: {error_message}",
                "id": image_id,
            }

        except Exception as e:
            error_code = str(e)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "images": None,
                "id": None,
            }

    def provider_name(self):
        return "dalle2"


class Dalle3ImageProvider(ImageProvider):
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv("OPENAI")

    def generate_images(
        self,
        prompt: str,
        num_images: int,
        models: list = [],
        endpoint: str = "",
        user_id: int = 1912,
    ) -> list:
        client = OpenAI(api_key=self.api_key)
        try:
            response = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                n=1,
                response_format="b64_json",
            )
            message = "Success"
            image = response.data[0].b64_json
            dark_image = self.verify_image_darkness(image)
            if dark_image:
                image = forbidden_image
                message = "Image is too dark"

            image_id = self.get_image_id(prompt, user_id, image)
            filename = f"adversarial-nibbler/{prompt}/{user_id}/{image_id}.jpeg"
            self.s3.put_object(
                Body=base64.b64decode(image),
                Bucket=self.dataperf_bucket,
                Key=filename,
            )
            return {
                "generator": self.provider_name(),
                "message": message,
                "prompt": prompt,
                "id": image_id,
            }

        except openai.BadRequestError as e:
            json_error = json.loads(e.response.text)
            error_code = json_error.get("error", {}).get("code", e.response.status_code)
            image_id = self.get_image_id(prompt, user_id, forbidden_image)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "id": image_id,
            }

        except Exception as e:
            error_code = str(e)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "images": None,
                "id": None,
            }

    def provider_name(self):
        return "dalle3"


class SDXLImageProvider(ImageProvider):
    def __init__(self, model_instance: str):
        super().__init__()
        self.api_key = os.getenv("HF")
        self.session = RequestSession()
        self.model_instance = model_instance
        self.timeout = 62

    def generate_images(
        self, prompt: str, num_images: int, model, endpoint, user_id
    ) -> list:
        print("Trying model", endpoint[self.model_instance]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = requests.post(
                f"{endpoint[self.model_instance]['endpoint']}",
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
            message = "Success"
            if response.status_code == 200:
                image = response.json()
                dark_image = self.verify_image_darkness(image)
                if dark_image:
                    image = forbidden_image
                    message = "Image is too dark"
                image_id = self.get_image_id(prompt, user_id, image)
                filename = f"adversarial-nibbler/{prompt}/{user_id}/{image_id}.jpeg"
                self.s3.put_object(
                    Body=base64.b64decode(image),
                    Bucket=self.dataperf_bucket,
                    Key=filename,
                )

                return {
                    "generator": self.provider_name(),
                    "message": message,
                    "prompt": prompt,
                    "id": image_id,
                }

        except Exception as e:
            error_code = str(e)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "images": None,
                "id": None,
            }

    def provider_name(self):
        return "sdxl1.0"


class SDXLTurboImageProvider(ImageProvider):
    def __init__(self, model_instance: str):
        super().__init__()
        self.api_key = os.getenv("HF")
        self.session = RequestSession()
        self.model_instance = model_instance
        self.timeout = 25

    def generate_images(
        self, prompt: str, num_images: int, model, endpoint, user_id
    ) -> list:
        print("Trying model", endpoint[self.model_instance]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = requests.post(
                f"{endpoint[self.model_instance]['endpoint']}",
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
            message = "Success"
            if response.status_code == 200:
                image = response.json()
                dark_image = self.verify_image_darkness(image)
                if dark_image:
                    image = forbidden_image
                    message = "Image is too dark"
                image_id = self.get_image_id(prompt, user_id, image)
                filename = f"adversarial-nibbler/{prompt}/{user_id}/{image_id}.jpeg"
                self.s3.put_object(
                    Body=base64.b64decode(image),
                    Bucket=self.dataperf_bucket,
                    Key=filename,
                )
                return {
                    "generator": self.provider_name(),
                    "message": message,
                    "prompt": prompt,
                    "id": image_id,
                }

        except Exception as e:
            error_code = str(e)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "images": None,
                "id": None,
            }

    def provider_name(self):
        return "sdxl-turbo"


class SDRunwayMLImageProvider(ImageProvider):
    def __init__(self, model_instance: str):
        super().__init__()
        self.api_key = os.getenv("HF")
        self.session = RequestSession()
        self.model_instance = model_instance
        self.timeout = 25

    def generate_images(
        self, prompt: str, num_images: int, model, endpoint, user_id
    ) -> list:
        print("Trying model", endpoint[self.model_instance]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = requests.post(
                f"{endpoint[self.model_instance]['endpoint']}",
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
            message = "Success"
            if response.status_code == 200:
                image = response.json()
                dark_image = self.verify_image_darkness(image)
                if dark_image:
                    image = forbidden_image
                    message = "Image is too dark"
                image_id = self.get_image_id(prompt, user_id, image)
                filename = f"adversarial-nibbler/{prompt}/{user_id}/{image_id}.jpeg"
                self.s3.put_object(
                    Body=base64.b64decode(image),
                    Bucket=self.dataperf_bucket,
                    Key=filename,
                )
                return {
                    "generator": self.provider_name(),
                    "message": message,
                    "prompt": prompt,
                    "id": image_id,
                }

        except Exception as e:
            error_code = str(e)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "images": None,
                "id": None,
            }

    def provider_name(self):
        return "runwayml-sd1.5"


class SDVariableAutoEncoder(ImageProvider):
    def __init__(self, model_instance: str):
        super().__init__()
        self.api_key = os.getenv("HF")
        self.session = RequestSession()
        self.model_instance = model_instance

    def generate_images(
        self, prompt: str, num_images: int, model, endpoint, user_id
    ) -> list:
        print("Trying model", endpoint[self.model_instance]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = requests.post(
                f"{endpoint[self.model_instance]['endpoint']}",
                json=payload,
                headers=headers,
                timeout=self.timeout,
            )
            message = "Success"
            if response.status_code == 200:
                image = response.json()[0]["image"]["images"][0]
                dark_image = self.verify_image_darkness(image)
                if dark_image:
                    image = forbidden_image
                    message = "Image is too dark"
                image_id = self.get_image_id(prompt, user_id, image)
                filename = f"adversarial-nibbler/{prompt}/{user_id}/{image_id}.jpeg"
                self.s3.put_object(
                    Body=base64.b64decode(image),
                    Bucket=self.dataperf_bucket,
                    Key=filename,
                )
                return {
                    "generator": self.provider_name(),
                    "message": message,
                    "prompt": prompt,
                    "id": image_id,
                }

        except Exception as e:
            error_code = str(e)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "images": None,
                "id": None,
            }

    def provider_name(self):
        return "sd+vae_ft_mse"


class HF_SDXL(ImageProvider):
    def __init__(self):
        super().__init__()
        self.api_key = os.getenv("HF")

    def generate_images(
        self, prompt: str, num_images: int, models: list, endpoint: str, user_id: int
    ):
        payload = {"inputs": prompt}
        headers = {
            "Authorization": self.api_key,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "x-use-cache": "false",
        }
        endpoint = endpoint["huggingface_sdxl"]["endpoint"]
        try:
            response = requests.post(endpoint, json=payload, headers=headers)
            print("Trying model", endpoint, "with status code", response.status_code)
            message = "Success"
            if response.status_code == 200:
                image = base64.b64encode(response.content).decode("utf-8")
                dark_image = self.verify_image_darkness(image)
                if dark_image:
                    image = forbidden_image
                    message = "Image is too dark"
                image_id = self.get_image_id(prompt, user_id, image)
                filename = f"adversarial-nibbler/{prompt}/{user_id}/{image_id}.jpeg"
                self.s3.put_object(
                    Body=base64.b64decode(image),
                    Bucket=self.dataperf_bucket,
                    Key=filename,
                )
                return {
                    "generator": self.provider_name(),
                    "message": message,
                    "prompt": prompt,
                    "id": image_id,
                }
        except Exception as e:
            error_code = str(e)
            return {
                "generator": self.provider_name(),
                "message": error_code,
                "images": None,
                "id": None,
            }

    def provider_name(self):
        return "sdxl1.0"
