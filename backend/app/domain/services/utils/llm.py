# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from abc import ABC, abstractmethod

import openai
from langchain.llms import OpenAI
from transformers import AutoModelForCausalLM, AutoTokenizer

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

    def initialize(self, model_name: str):
        return OpenAI(temperature=0.9, model_name=model_name)

    def generate_text(self, prompt: str, model: str) -> str:
        response = openai.Completion.create(
            model=model,
            prompt=prompt,
        )
        return response.choices[0].text

    def provider_name(self):
        return "openai"


class HFProvider(LLMProvider):
    def __init__(self):
        pass

    def generate_text(self, prompt: str, model: str) -> str:
        tokenizer = AutoTokenizer.from_pretrained(model)
        model = AutoModelForCausalLM.from_pretrained(model)
        final_prompt = f"<|prompter|>{prompt}<|endoftext|><|assistant|>"
        input_ids = tokenizer.encode(final_prompt, return_tensors="pt")
        output = model.generate(input_ids, max_length=1000, do_sample=True)
        return tokenizer.decode(output[0], skip_special_tokens=True)

    def provider_name(self):
        return "HF"
