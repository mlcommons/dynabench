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
from app.domain.services.utils.templates import (
    ANTHROPIC_FOOT_TEMPLATE,
    ANTHROPIC_HEAD_TEMPLATE,
    COHERE_FOOT_TEMPLATE,
    COHERE_HEAD_TEMPLATE,
    OPENAI_FOOT_TEMPLATE,
    OPENAI_HEAD_TEMPLATE,
)


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
        model_name = model[self.provider_name()]["model_name"]
        frequency_penalty = model[self.provider_name()]["frequency_penalty"]
        presence_penalty = model[self.provider_name()]["presence_penalty"]
        temperature = model[self.provider_name()]["temperature"]
        top_p = model[self.provider_name()]["top_p"]
        max_tokens = model[self.provider_name()]["max_tokens"]

        if is_conversational:
            messages = prompt
        else:
            messages = [
                {
                    "role": "user",
                    "content": f"{OPENAI_HEAD_TEMPLATE} {prompt} {OPENAI_FOOT_TEMPLATE}",
                }
            ]
        response = openai.ChatCompletion.create(
            model=model_name,
            messages=messages,
            frequency_penalty=frequency_penalty,
            presence_penalty=presence_penalty,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
        )
        return response["choices"][0]["message"]["content"]

    def conversational_generation(self, prompt: str, model: dict, history: dict) -> str:
        formatted_conversation = []
        formatted_conversation.append(
            {"role": "system", "content": OPENAI_HEAD_TEMPLATE}
        )
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append({"role": "user", "content": user_text})
            formatted_conversation.append({"role": "assistant", "content": bot_text})

        formatted_conversation.append(
            {"role": "user", "content": f"{prompt} {OPENAI_FOOT_TEMPLATE}"}
        )
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
            final_prompt = f"\n\nHuman: {ANTHROPIC_HEAD_TEMPLATE} {prompt} {ANTHROPIC_FOOT_TEMPLATE} \n\nAssistant:"
        max_tokens = model[self.provider_name()]["max_tokens"]
        temperature = model[self.provider_name()]["temperature"]
        top_p = model[self.provider_name()]["top_p"]
        top_k = model[self.provider_name()]["top_k"]

        completion = self.anthropic.completions.create(
            model=model[self.provider_name()]["model_name"],
            max_tokens_to_sample=max_tokens,
            prompt=final_prompt,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
        )

        return completion.completion

    def conversational_generation(self, prompt: str, model: dict, history: dict) -> str:
        formatted_conversation = []
        formatted_conversation.append(f"Human: {ANTHROPIC_HEAD_TEMPLATE}")
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append(f"Human: {user_text}")
            formatted_conversation.append(f"Assistant: {bot_text}")

        formatted_conversation.append(f"Human: {prompt} {ANTHROPIC_FOOT_TEMPLATE}")
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
        model_name = model[self.provider_name()]["model_name"]
        temperature = model[self.provider_name()]["temperature"]

        if is_conversational:
            response = self.cohere.chat(
                message=prompt,
                model=model_name,
                chat_history=chat_history,
                temperature=temperature,
            )
        else:
            prompt = f"{COHERE_HEAD_TEMPLATE} {prompt} {COHERE_FOOT_TEMPLATE}"
            response = self.cohere.chat(
                message=prompt,
                model=model_name,
                temperature=temperature,
            )

        return response.text

    def conversational_generation(self, prompt: str, model: dict, history: dict) -> str:
        formatted_conversation = []
        formatted_conversation.append(
            {"user_name": "User", "text": COHERE_HEAD_TEMPLATE}
        )
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append({"user_name": "User", "text": user_text})
            formatted_conversation.append({"user_name": "Chatbot", "text": bot_text})

        prompt = f"{prompt} {COHERE_FOOT_TEMPLATE}"
        return self.generate_text(
            prompt, model, is_conversational=True, chat_history=formatted_conversation
        )

    def provider_name(self):
        return "cohere"
