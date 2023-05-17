# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from abc import ABC, abstractmethod

import openai
import requests

from app.domain.services.base.task import TaskService
from app.domain.services.utils.constant import forbidden_image


class ImageProvider(ABC):
    def __init__(self):
        self.task_service = TaskService()
        pass

    @abstractmethod
    def generate_images(self, prompt: str, num_images: int) -> list:
        pass

    @property
    @abstractmethod
    def provider_name(self):
        pass


class OpenAIImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI")
        openai.api_key = self.api_key

    def generate_images(
        self, prompt: str, num_images: int, models: list = [], endpoint: str = ""
    ) -> list:
        try:
            response = openai.Image.create(
                prompt=prompt, n=num_images, size="256x256", response_format="b64_json"
            )
            image_response = [x["b64_json"] for x in response["data"]]
            return image_response

        except openai.error.OpenAIError as e:
            print(e)
            return [forbidden_image] * num_images

    def provider_name(self):
        return "openai"


class StableDiffusionImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("STABLE_DIFFUSION")

    def generate_images(
        self, prompt: str, num_images: int, models: list, endpoint: str
    ) -> list:
        for model in models:
            try:
                res = requests.post(
                    endpoint,
                    json={
                        "model": model,
                        "prompt": prompt,
                        "n": num_images,
                        "steps": 20,
                    },
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "User-Agent": "",
                    },
                )
                image_response = res.json().get("output").get("choices")
                if res.status_code == 200:
                    image_response = [x["image_base64"] for x in image_response]
                    print(f"Model {model} worked")
                    return image_response
            except Exception as e:
                print(e)

            image_response = [forbidden_image] * num_images
            return image_response

    def provider_name(self):
        return "stable_diffusion"
