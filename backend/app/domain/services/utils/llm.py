# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from abc import ABC, abstractmethod

import cohere
import openai
import requests
from anthropic import AI_PROMPT, HUMAN_PROMPT, Anthropic
from langchain.llms import OpenAI

from app.domain.services.base.task import TaskService


class LLMProvider(ABC):
    def __init__(self):
        self.task_service = TaskService()
        pass

    @abstractmethod
    def generate_text(self, prompt: str, num_images: int) -> list:
        pass

    @property
    @abstractmethod
    def provider_name(self):
        pass


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI")
        openai.api_key = self.api_key

    def generate_text(self, prompt: str, model: dict) -> str:
        model = model[self.provider_name()]
        messages = [{"role": "user", "content": prompt}]
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
        )
        return response["choices"][0]["message"]["content"]

    def provider_name(self):
        return "openai"


class HuggingFaceProvider(LLMProvider):
    def __init__(self):
        self.headers = {"Authorization": os.getenv("HF")}
        pass

    def generate_text(self, prompt: str, model: dict) -> str:
        endpoint = model[self.provider_name()]["endpoint"]
        payload = {"inputs": prompt, "max_new_tokens": 100}
        response = requests.post(endpoint, json=payload, headers=self.headers)
        if response.status_code == 200:
            sample = response.json()[0]["generated_text"]
            return sample

    def provider_name(self):
        return "huggingface"


class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC")
        self.anthropic = Anthropic(api_key=self.api_key)
        pass

    def generate_text(self, prompt: str, model: dict) -> str:
        completion = self.anthropic.completions.create(
            model=model[self.provider_name()],
            max_tokens_to_sample=300,
            prompt=f"{HUMAN_PROMPT}{prompt}{AI_PROMPT}",
        )

        return completion.completion

    def provider_name(self):
        return "anthropic"


class CohereProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("COHERE")
        self.cohere = cohere.Client(self.api_key)
        pass

    def generate_text(self, prompt: str, model: dict) -> str:
        response = self.cohere.generate(prompt=prompt, max_tokens=300, model=model)
        print(response)
        return response[0].text

    def provider_name(self):
        return "cohere"
