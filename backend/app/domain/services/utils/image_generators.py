# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import base64
import os
from abc import ABC, abstractmethod
from io import BytesIO

from openai import OpenAI
import requests
from requests.adapters import HTTPAdapter

from app.domain.services.base.task import TaskService
from app.domain.services.utils.adapters import RequestSession
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


class Dalle2ImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI")

    def generate_images(
        self, prompt: str, num_images: int, models: list = [], endpoint: str = ""
    ) -> list:
        client = OpenAI(api_key = self.api_key)
        try:
            response = client.images.generate(model="dall-e-2", prompt= prompt,
                                                   size="512x512", n=num_images, response_format='b64_json')
            image_response = [response.data[0].b64_json]
            return {"generator": self.provider_name(), "images": image_response}

        except Exception as e:
            print(e, "This was the exception")
            images = [forbidden_image]
            return {"generator": self.provider_name(), "images": images}

    def provider_name(self):
        return "dalle2"

class Dalle3ImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI")

    def generate_images(
        self, prompt: str, num_images: int, models: list = [], endpoint: str = ""
    ) -> list:
        client = OpenAI(api_key = self.api_key)
        try:
            response = client.images.generate(model="dall-e-3", prompt= prompt,
                                                   size="1024x1024", n=1, response_format='b64_json')
            image_response = [response.data[0].b64_json]
            return {"generator": self.provider_name(), "images": image_response}

        except Exception as e:
            print(e, "This was the exception")
            images = [forbidden_image]
            return {"generator": self.provider_name(), "images": images}

    def provider_name(self):
        return "dalle3"


class SDXLImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxl1"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxl1']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()[0]["image"]["images"][0]
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl1.0"
    
class SDXLImageProvider2(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxl2"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxl2']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl1.0"

class SDXLImageProvider3(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxl3"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxl3']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl1.0"

class SDXLTurboImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxlturbo"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxlturbo']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl-turbo"

class SDXLTurboImageProvider2(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxlturbo2"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxlturbo2']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl-turbo"

class SDXLTurboImageProvider3(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxlturbo3"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxlturbo3']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl-turbo"

class SDXLTurboImageProvider4(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxlturbo4"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxlturbo4']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl-turbo"
    
class SDXLTurboImageProvider5(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxlturbo5"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxlturbo5']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl-turbo"

class SDXLTurboImageProvider6(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sdxlturbo6"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sdxlturbo6']['endpoint']}",
                json=payload,
                headers=headers,
                timeout=25,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sdxl-turbo"
    
class SDRunwayMLImageProvider(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sd15"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sd15']['endpoint']}",
                json=payload,
                headers=headers,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "runwayml-sd1.5"

class SDRunwayMLImageProvider2(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sd152"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sd152']['endpoint']}",
                json=payload,
                headers=headers,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "runwayml-sd1.5"

class SDRunwayMLImageProvider3(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sd153"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sd153']['endpoint']}",
                json=payload,
                headers=headers,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "runwayml-sd1.5"


class SDVariableAutoEncoder(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sd21vae"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sd21vae']['endpoint']}",
                json=payload,
                headers=headers,
            )
            if response.status_code == 200:
                new_image = response.json()
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sd+vae_ft_mse"

class SDVariableAutoEncoder2(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sd21vae2"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sd21vae2']['endpoint']}",
                json=payload,
                headers=headers,
            )
            if response.status_code == 200:
                new_image = response.json()[0]["image"]["images"][0]
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sd+vae_ft_mse"

class SDVariableAutoEncoder3(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.session = RequestSession()

    def generate_images(self, prompt: str, num_images: int, model, endpoint) -> list:
        print("Trying model", endpoint["sd21vae3"]["endpoint"])
        payload = {"inputs": prompt, "steps": 30}
        headers = {"Authorization": self.api_key}
        try:
            response = self.session.session.post(
                f"{endpoint['sd21vae3']['endpoint']}",
                json=payload,
                headers=headers,
            )
            if response.status_code == 200:
                new_image = response.json()[0]["image"]["images"][0]
                return {"generator": self.provider_name(), "images": [new_image]}
        except Exception as e:
            print(e, "This was the exception", "and the model was", self.provider_name())
            return {"generator": self.provider_name(), "images": [forbidden_image]}

    def provider_name(self):
        return "sd+vae_ft_mse"

class HF_SDXL(ImageProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")

    def generate_images(
        self, prompt: str, num_images: int, models: list, endpoint: str
    ):
        payload = {"inputs": prompt}
        headers = {
            "Authorization": self.api_key,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "x-use-cache": "false",
        }
        endpoint = endpoint["huggingface_sdxl"]["endpoint"]
        images = []
        try:
            response = requests.post(endpoint, json=payload, headers=headers)
            print("Trying model", endpoint, "with status code", response.status_code)
            if response.status_code == 200:
                base64_image = base64.b64encode(response.content)
                images.append(base64_image.decode("utf-8"))
        except Exception as e:
            print(e, "This was the exception")
            images = [forbidden_image]
        return {"generator": self.provider_name(), "images": images}

    def provider_name(self):
        return "sdxl1.04"



