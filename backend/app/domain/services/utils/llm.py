# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import os
from abc import ABC, abstractmethod

import cohere
import openai
import requests
from anthropic import AI_PROMPT, HUMAN_PROMPT, Anthropic

from app.domain.services.base.task import TaskService


class LLMProvider(ABC):
    def __init__(self):
        self.task_service = TaskService()
        pass

    @abstractmethod
    def generate_text(self, prompt: str, num_images: int) -> list:
        pass

    @abstractmethod
    def conversational_generation(self, prompt: str, model: dict, history: dict) -> str:
        pass

    @property
    @abstractmethod
    def provider_name(self):
        pass


class OpenAIProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("OPENAI")
        openai.api_key = self.api_key

    def generate_text(
        self, prompt: str, model: dict, is_conversational: bool = False
    ) -> str:
        model = model[self.provider_name()]["model_name"]
        if is_conversational:
            messages = prompt
        else:
            messages = [{"role": "user", "content": prompt}]
        response = openai.ChatCompletion.create(
            model=model,
            messages=messages,
        )
        return response["choices"][0]["message"]["content"]

    def conversational_generation(self, prompt: str, model: dict, history: dict) -> str:
        formatted_conversation = []
        formatted_conversation.append(
            {"role": "system", "content": "You are a helpful assistant."}
        )
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append({"role": "user", "content": user_text})
            formatted_conversation.append({"role": "assistant", "content": bot_text})

        formatted_conversation.append({"role": "user", "content": prompt})
        return self.generate_text(formatted_conversation, model, is_conversational=True)

    def provider_name(self):
        return "openai"


class HuggingFaceProvider(LLMProvider):
    def __init__(self):
        self.headers = {"Authorization": os.getenv("HF")}
        pass

    def generate_text(self, prompt: str, model: dict) -> str:
        return "I am HF"
        endpoint = model[self.provider_name()]["endpoint"]
        payload = {"inputs": prompt, "max_new_tokens": 100}
        response = requests.post(endpoint, json=payload, headers=self.headers)
        if response.status_code == 200:
            sample = response.json()[0]["generated_text"]
            return sample

    def conversational_generation(self, prompt: str, model: dict) -> str:
        return

    def provider_name(self):
        return "huggingface"


class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC")
        self.anthropic = Anthropic(api_key=self.api_key)
        pass

    def generate_text(
        self, prompt: str, model: dict, is_conversational: bool = False
    ) -> str:
        if is_conversational:
            final_prompt = prompt
        else:
            final_prompt = f"{HUMAN_PROMPT}{prompt}{AI_PROMPT}"

        completion = self.anthropic.completions.create(
            model=model[self.provider_name()]["model_name"],
            max_tokens_to_sample=300,
            prompt=final_prompt,
        )

        return completion.completion

    def conversational_generation(self, prompt: str, model: dict, history: dict) -> str:
        formatted_conversation = []
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append(f"Human: {user_text}")
            formatted_conversation.append(f"Assistant: {bot_text}")

        formatted_conversation.append(f"Human: {prompt}")
        formatted_conversation.append("Assistant: ")

        formatted_conversation = "\n\n".join(formatted_conversation)

        conversation = self.generate_text(
            formatted_conversation, model, is_conversational=True
        )
        return conversation

    def provider_name(self):
        return "anthropic"


class CohereProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("COHERE")
        self.cohere = cohere.Client(self.api_key)
        pass

    def generate_text(
        self, prompt: str, model: dict, is_conversational: bool = False, chat_history=[]
    ) -> str:
        model = model[self.provider_name()]["model_name"]

        if is_conversational:
            response = self.cohere.chat(
                message=prompt, max_tokens=300, model=model, chat_history=chat_history
            )
        else:
            response = self.cohere.chat(message=prompt, max_tokens=300, model=model)

        return response.text

    def conversational_generation(self, prompt: str, model: dict, history: dict) -> str:
        formatted_conversation = []
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append({"user_name": "User", "text": user_text})
            formatted_conversation.append({"user_name": "Chatbot", "text": bot_text})

        return self.generate_text(
            prompt, model, is_conversational=True, chat_history=formatted_conversation
        )

    def provider_name(self):
        return "cohere"
