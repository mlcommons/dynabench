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
            print(f"Trying model {model}")
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
            if res.status_code == 200:
                image_response = res.json().get("output").get("choices")
                image_response = [x["image_base64"] for x in image_response]
                print(f"Model {model} worked")
                return image_response
            else:
                continue

        image_response = [forbidden_image] * int(num_images)
        return image_response

    def provider_name(self):
        return "stable_diffusion"


class MidjourneyImageProvider(ImageProvider):
    def __init__(self):
        self.server_id = os.getenv("SERVER_ID")
        self.channel_id = os.getenv("CHANNEL_ID")
        self.dyna_bot = os.getenv("DYNA_BOT")

    def generate_images(
        self, prompt: str, num_images: int, models: list, endpoint: str
    ) -> list:
        payload = {
            "type": 2,
            "application_id": "1109849712405782700",
            "guild_id": self.server_id,
            "channel_id": self.channel_id,
            "session_id": "2fb980f65e5c9a77c96ca01f2c242cf6",
            "data": {
                "version": "1077969938624553050",
                "id": "938956540159881230",
                "name": "imagine",
                "type": 1,
                "options": [{"type": 3, "name": "prompt", "value": prompt}],
                "application_command": {
                    "id": "938956540159881230",
                    "application_id": "1109849712405782700",
                    "version": "1077969938624553050",
                    "default_permission": True,
                    "default_member_permissions": None,
                    "type": 1,
                    "nsfw": False,
                    "name": "imagine",
                    "description": "Create images with Midjourney",
                    "dm_permission": True,
                    "options": [
                        {
                            "type": 3,
                            "name": "prompt",
                            "description": "The prompt to imagine",
                            "required": True,
                        }
                    ],
                },
                "attachments": [],
            },
        }

        header = {"authorization": self.dyna_bot}
        response = requests.post(
            "https://discord.com/api/v9/interactions", json=payload, headers=header
        )

        print(response)
        return

    def provider_name(self):
        return "midjourney"
