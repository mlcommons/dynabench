# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import asyncio
import json
import os
from abc import ABC, abstractmethod

import cohere
import google.generativeai as palm
import openai
import replicate
from aiohttp import ClientSession
from aleph_alpha_client import AsyncClient, CompletionRequest, Prompt
from anthropic import AsyncAnthropic
from openai import OpenAI

from app.domain.services.base.task import TaskService


def async_timeout(seconds, default_return=None):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            try:
                result = await asyncio.wait_for(func(*args, **kwargs), timeout=seconds)
            except asyncio.TimeoutError:
                result = default_return
            return result

        return wrapper

    return decorator


class LLMProvider(ABC):
    def __init__(self):
        self.task_service = TaskService()
        pass

    @abstractmethod
    def generate_text(self, prompt: str, num_images: int) -> list:
        pass

    @abstractmethod
    def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str
    ) -> str:
        pass

    @property
    @abstractmethod
    def provider_name(self):
        pass


class OpenAIProvider(LLMProvider):
    def __init__(self, task_id: int = -1):
        self.task_id = task_id
        if task_id == 56:
            self.api_key = os.getenv("OPENAI_HELPME")
        else:
            self.api_key = os.getenv("OPENAI")
        openai.api_key = self.api_key

    @async_timeout(30)
    async def generate_text(
        self,
        prompt: str,
        model: dict,
        provider,
        is_conversational: bool = False,
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        model_name = model[provider]["model_name"]
        frequency_penalty = model[provider]["frequency_penalty"]
        presence_penalty = model[provider]["presence_penalty"]
        temperature = model[provider]["temperature"]
        top_p = model[provider]["top_p"]
        max_tokens = model[provider]["max_tokens"]
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        if is_conversational:
            messages = prompt
        else:
            messages = [
                {
                    "role": "user",
                    "content": f"{head_template} {prompt} {foot_template}",
                }
            ]
        try:
            client = OpenAI(api_key=self.api_key)
            response = client.chat.completions.create(
                model=model_name,
                messages=messages,
                frequency_penalty=frequency_penalty,
                presence_penalty=presence_penalty,
                temperature=temperature,
                top_p=top_p,
                max_tokens=max_tokens,
                timeout=30,
            )

            return {
                "text": response.choices[0].message.content,
                "provider_name": provider,
                "model_name": model_name,
                "artifacts": model,
            }
        except Exception as e:
            print(e)
            return None

    async def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider=None
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        formatted_conversation = []
        formatted_conversation.append({"role": "system", "content": head_template})

        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append({"role": "user", "content": user_text})
            formatted_conversation.append({"role": "assistant", "content": bot_text})

        formatted_conversation.append(
            {"role": "user", "content": f"{prompt} {foot_template}"}
        )
        result = await self.generate_text(
            formatted_conversation, model, provider, is_conversational=True
        )

        try:
            return result["text"]
        except Exception as e:
            print(e)
            return "None"

    def provider_name(self):
        return "openaihm" if self.task_id == 56 else "openai"


class HuggingFaceProvider(LLMProvider):
    def __init__(self):
        self.headers = {"Authorization": os.getenv("HF")}

    @async_timeout(30)
    def generate_text(self, prompt: str, model: dict) -> str:
        return "I am HF"
        # endpoint = model[provider]["endpoint"]
        # payload = {"inputs": prompt, "max_new_tokens": 100}
        # response = requests.post(endpoint, json=payload, headers=self.headers)
        # if response.status_code == 200:
        #     sample = response.json()[0]["generated_text"]
        #     return sample

    def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str = None
    ) -> str:
        return

    def provider_name(self):
        return "huggingface"


class AnthropicProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("ANTHROPIC")
        self.anthropic = AsyncAnthropic(api_key=self.api_key, timeout=30)

    @async_timeout(30)
    async def generate_text(
        self, prompt: str, model: dict, provider=None, is_conversational: bool = False
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        if is_conversational:
            final_prompt = prompt
        else:
            final_prompt = (
                f"\n\nHuman: {head_template} {prompt} {foot_template} \n\nAssistant:"
            )
        max_tokens = model[provider]["max_tokens"]
        temperature = model[provider]["temperature"]
        top_p = model[provider]["top_p"]
        top_k = model[provider]["top_k"]

        try:
            completion = await self.anthropic.completions.create(
                model=model[provider]["model_name"],
                max_tokens_to_sample=max_tokens,
                prompt=final_prompt,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
            )

            return {
                "text": completion.completion,
                "provider_name": provider,
                "model_name": model[provider]["model_name"],
                "artifacts": model,
            }
        except Exception as e:
            print(e)
            return None

    async def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str = None
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        formatted_conversation = []
        formatted_conversation.append(f"Human: {head_template}")
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append(f"Human: {user_text}")
            formatted_conversation.append(f"Assistant: {bot_text}")

        formatted_conversation.append(f"Human: {prompt} {foot_template}")
        formatted_conversation.append("Assistant: ")

        formatted_conversation = "\n\n".join(formatted_conversation)

        conversation = await self.generate_text(
            formatted_conversation, model, provider, is_conversational=True
        )
        try:
            return conversation["text"]
        except Exception as e:
            print(e)
            return "None"

    def provider_name(self):
        return "anthropic"


class CohereProvider(LLMProvider):
    def __init__(self, task_id: int = -1):
        self.task_id = task_id
        if task_id == 56:
            self.api_key = os.getenv("COHERE_HELPME")
        else:
            self.api_key = os.getenv("COHERE")
        self.cohere = cohere.AsyncClient(self.api_key, timeout=30)

    @async_timeout(30)
    async def generate_text(
        self,
        prompt: str,
        model: dict,
        provider=None,
        is_conversational: bool = False,
        chat_history=[],
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        model_name = model[provider]["model_name"]
        temperature = model[provider]["temperature"]
        top_p = model[provider]["top_p"]
        top_k = model[provider]["top_k"]
        max_tokens = model[provider]["max_tokens"]
        model[provider].setdefault("model_args", {})
        try:
            if is_conversational:
                response = await self.cohere.chat(
                    message=prompt,
                    model=model_name,
                    chat_history=chat_history,
                    temperature=temperature,
                    p=top_p,
                    k=top_k,
                    max_tokens=max_tokens,
                    prompt_truncation="AUTO",
                    **model[provider]["model_args"],
                )
            else:
                prompt = f"{head_template} {prompt} {foot_template}"
                response = await self.cohere.chat(
                    message=prompt,
                    model=model_name,
                    temperature=temperature,
                    p=top_p,
                    k=top_k,
                    max_tokens=max_tokens,
                    prompt_truncation="AUTO",
                    **model[provider]["model_args"],
                )

            return {
                "text": response.text,
                "provider_name": provider,
                "model_name": model_name,
                "artifacts": model,
            }
        except Exception as e:
            print(e)
            return None

    async def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str = None
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        formatted_conversation = []
        formatted_conversation.append({"user_name": "User", "text": head_template})
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append({"user_name": "User", "text": user_text})
            formatted_conversation.append({"user_name": "Chatbot", "text": bot_text})

        prompt = f"{prompt} {foot_template}"
        result = await self.generate_text(
            prompt,
            model,
            provider,
            is_conversational=True,
            chat_history=formatted_conversation,
        )
        try:
            return result["text"]
        except Exception as e:
            print(e)
            return "None"

    def provider_name(self):
        return "coherehm" if self.task_id == 56 else "cohere"


class AlephAlphaProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("ALEPHALPHA")

    @async_timeout(30)
    async def generate_text(
        self, prompt: str, model: dict, provider=None, is_conversational: bool = False
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        # foot_template = model[provider]["templates"]["footer"]
        params = {
            "prompt": Prompt.from_text(prompt),
            "maximum_tokens": model[provider]["max_tokens"],
            "temperature": model[provider]["temperature"],
            "top_p": model[provider]["top_p"],
            "top_k": model[provider]["top_k"],
            "frequency_penalty": model[provider]["frequency_penalty"],
            "presence_penalty": model[provider]["presence_penalty"],
        }
        request = CompletionRequest(**params)
        model_name = model[provider]["model_name"]

        try:
            if is_conversational:
                async with AsyncClient(
                    token=self.api_key, request_timeout_seconds=30
                ) as client:
                    response = await client.complete(
                        request=request,
                        model=model_name,
                    )
                    completion = response.completions[0].completion
            else:
                prompt = f"""### Instruction \n{head_template}
    \n###Input \nLast user message: {prompt} \n\n### Response: \nAssistant:"""
                params["prompt"] = Prompt.from_text(prompt)
                async with AsyncClient(token=self.api_key) as client:
                    response = await client.complete(request=request, model=model_name)
                completion = response.completions[0].completion

            return {
                "text": completion,
                "provider_name": provider,
                "model_name": model_name,
                "artifacts": model,
            }
        except Exception as e:
            print(e)
            return None

    async def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str = None
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        # foot_template = model[provider]["templates"]["footer"]
        formatted_conversation = []
        formatted_conversation.append(
            f"### Instruction:\n{head_template} \n\n### Input:"
        )
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append(f"User: {user_text}")
            formatted_conversation.append(f"Assistant: {bot_text}")

        formatted_conversation.append(f"Last user message: {prompt} \n\n### Response:")
        formatted_conversation.append("Assistant: ")

        formatted_conversation = "\n".join(formatted_conversation)
        result = await self.generate_text(
            formatted_conversation, model, provider, is_conversational=True
        )
        try:
            return result["text"]
        except Exception as e:
            print(e)
            return "None"

    def provider_name(self):
        return "aleph"


class GoogleProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("GOOGLE")
        palm.configure(api_key=self.api_key)

    @async_timeout(30)
    async def generate_text(
        self, prompt: str, model: dict, provider=None, is_conversational: bool = False
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        model_name = model[provider]["model_name"]
        temperature = model[provider]["temperature"]
        top_p = model[provider]["top_p"]
        top_k = model[provider]["top_k"]
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]

        if is_conversational:
            messages = prompt
        else:
            messages = f"{head_template} {prompt} {foot_template}"
        try:
            response = await palm.chat_async(
                model=model_name,
                messages=messages,
                temperature=temperature,
                top_p=top_p,
                top_k=top_k,
            )
            return {
                "text": response.last,
                "provider_name": provider,
                "model_name": model_name,
                "artifacts": model,
            }
        except Exception as e:
            print(e)
            return None

    async def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str = None
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        formatted_conversation = []
        formatted_conversation.append(f"Human: {head_template}")
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append(f"Human: {user_text}")
            formatted_conversation.append(f"Assistant: {bot_text}")

        formatted_conversation.append(f"Human: {prompt} {foot_template}")
        formatted_conversation.append("Assistant: ")

        formatted_conversation = "\n\n".join(formatted_conversation)
        result = await self.generate_text(
            formatted_conversation, model, provider, is_conversational=True
        )

        try:
            return result["text"]
        except Exception as e:
            print(e)
            return "None"

    def provider_name(self):
        return "google"


class ReplicateProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("REPLICATE")
        os.environ["REPLICATE_API_TOKEN"] = self.api_key
        pass

    @async_timeout(30)
    def generate_text(
        self, prompt: str, model: dict, provider=None, is_conversational: bool = False
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        model_name = model[provider]["model_name"]
        input = {
            "max_new_tokens": model[provider]["max_tokens"],
            "min_new_tokens": model[provider]["min_tokens"],
            "temperature": model[provider]["temperature"],
            "top_p": model[provider]["top_p"],
            "top_k": model[provider]["top_k"],
        }

        if is_conversational:
            input["prompt"] = prompt
        else:
            input["prompt"] = f"{head_template} {prompt} {foot_template}"

        try:
            output = replicate.run(model_name, input=input)
            final_string = ""
            for items in output:
                final_string += items
            return {
                "text": final_string,
                "provider_name": provider,
                "model_name": model_name,
                "artifacts": model,
            }
        except Exception as e:
            print(e)
            return None

    def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str = None
    ) -> str:
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        formatted_conversation = []
        formatted_conversation.append(f"Human: {head_template}")
        for user_entry, bot_entry in zip(history["user"], history["bot"]):
            user_text = user_entry["text"]
            bot_text = bot_entry["text"]
            formatted_conversation.append(f"Human: {user_text}")
            formatted_conversation.append(f"Assistant: {bot_text}")

        formatted_conversation.append(f"Human: {prompt} {foot_template}")
        formatted_conversation.append("Assistant: ")

        formatted_conversation = "\n\n".join(formatted_conversation)
        result = self.generate_text(
            formatted_conversation, model, provider, is_conversational=True
        )

        try:
            return result["text"]
        except Exception as e:
            print(e)
            return "None"

    def provider_name(self):
        return "replicate"


class HuggingFaceAPIProvider(LLMProvider):
    def __init__(self):
        self.api_key = os.getenv("HF")
        self.headers = {
            "Authorization": self.api_key,
            "Content-Type": "application/json",
            "x-use-cache": "false",
        }

    @async_timeout(30)
    async def generate_text(
        self, prompt: str, model: dict, provider=None, is_conversational=False
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        is_llama = model[provider]["is_llama"]
        is_falcon = model[provider]["is_falcon"]
        is_pythia = model[provider]["is_pythia"]
        is_zephyr = model[provider]["is_zephyr"]
        is_guanaco = model[provider]["is_guanaco"]
        is_vicuna = model[provider]["is_vicuna"]
        base = "https://api-inference.huggingface.co/models/"
        model_name = model[provider]["model_name"]
        endpoint = base + model_name
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        if is_conversational:
            prompt = prompt
        else:
            if is_llama == 1:
                prompt = f"<s>[INST] {head_template} {prompt} {foot_template} [/INST]"
            elif is_falcon == 1:
                prompt = f"{head_template} User: {prompt}\n {foot_template} Falcon:"
            elif is_pythia == 1:
                prompt = (
                    f"{head_template}\n<|prompter|>{prompt}<|endoftext|><|assistant|>"
                )
            elif is_vicuna == 1:
                prompt = f"{head_template}\nUSER:{prompt}\nASSISTANT:"
            elif is_zephyr == 1:
                prompt = (
                    f"<|system|>{head_template}</s>\n<|user|>{prompt}</s><|assistant|>"
                )
            elif is_guanaco == 1:
                prompt = f"{head_template}\n### Human: {prompt}\n### Assistant:"
            else:
                prompt = prompt

        max_new_tokens = model[provider]["max_tokens"]
        min_new_tokens = model[provider]["min_tokens"]
        temperature = model[provider]["temperature"]
        top_p = model[provider]["top_p"]
        top_k = model[provider]["top_k"]
        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_new_tokens,
                "min_new_tokens": min_new_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "top_k": top_k,
                "return_full_text": False,
            },
        }

        data = json.dumps(payload)
        ## The following code can be used to debug HF API if it fails again.
        # async with httpx.AsyncClient() as client:
        #     response = await client.post(endpoint, data=data, headers=self.headers)
        #     answer = response.json()

        intents = 0
        while intents < 3:
            async with ClientSession() as session:
                async with session.post(
                    endpoint, data=data, headers=self.headers
                ) as response:
                    answer = await response.json()
            if response.status == 200:
                final_string = answer[0]["generated_text"]
                return {
                    "text": final_string,
                    "provider_name": provider,
                    "model_name": model_name,
                    "artifacts": model,
                }
            else:
                await asyncio.sleep(5)
                intents += 1
                continue
        return None

    async def conversational_generation(
        self, prompt: str, model: dict, history: dict, provider: str = None
    ) -> str:
        provider = provider if isinstance(type(provider), str) else self.provider_name()
        head_template = model[provider]["templates"]["header"]
        foot_template = model[provider]["templates"]["footer"]
        is_llama = model[provider]["is_llama"]
        is_falcon = model[provider]["is_falcon"]
        is_pythia = model[provider]["is_pythia"]
        is_vicuna = model[provider]["is_vicuna"]
        is_zephyr = model[provider]["is_zephyr"]
        is_guanaco = model[provider]["is_guanaco"]

        formatted_conversation = []
        if is_llama:
            formatted_conversation.append(f"<s>[INST] {head_template} [/INST]")
            for user_entry, bot_entry in zip(history["user"], history["bot"]):
                user_text = user_entry["text"]
                bot_text = bot_entry["text"]
                formatted_conversation.append(f"[INST] {user_text} [/INST]")
                formatted_conversation.append(f"{bot_text} </s>")
            formatted_conversation.append(f"[INST] {prompt} {foot_template} [/INST]")
            formatted_conversation = "\n".join(formatted_conversation)
        elif is_falcon:
            formatted_conversation.append(f"{head_template}")
            for user_entry, bot_entry in zip(history["user"], history["bot"]):
                user_text = user_entry["text"]
                bot_text = bot_entry["text"]
                formatted_conversation.append(f"User: {user_text}")
                formatted_conversation.append(f"Falcon: {bot_text}")
            formatted_conversation.append(f"User: {prompt} {foot_template}")
            formatted_conversation.append("Falcon:")
            formatted_conversation = "\n".join(formatted_conversation)
        elif is_pythia:
            formatted_conversation.append(f"{head_template}")
            for user_entry, bot_entry in zip(history["user"], history["bot"]):
                user_text = user_entry["text"]
                bot_text = bot_entry["text"]
                formatted_conversation.append(f"<|prompter|>{user_text}<|endoftext|>")
                formatted_conversation.append(f"<|assistant|>{bot_text}<|endoftext|>")
            formatted_conversation.append(
                f"<|prompter|>{prompt}<|endoftext|><|assistant|>"
            )
            formatted_conversation = "\n".join(formatted_conversation)
        elif is_vicuna:
            formatted_conversation.append(f"{head_template}")
            for user_entry, bot_entry in zip(history["user"], history["bot"]):
                user_text = user_entry["text"]
                bot_text = bot_entry["text"]
                formatted_conversation.append(f"USER: {user_text}")
                formatted_conversation.append(f"ASSISTANT: {bot_text}</s>")
            formatted_conversation.append(f"USER: {prompt} {foot_template}")
            formatted_conversation.append("ASSISTANT:")
            formatted_conversation = "\n".join(formatted_conversation)
        elif is_zephyr:
            formatted_conversation.append(f"{head_template}")
            for user_entry, bot_entry in zip(history["user"], history["bot"]):
                user_text = user_entry["text"]
                bot_text = bot_entry["text"]
                formatted_conversation.append(f"<|user|>{user_text}</s>")
                formatted_conversation.append(f"<|assistant|>{bot_text}</s>")
            formatted_conversation.append(f"<|user|>{prompt}</s><|assistant|>")
            formatted_conversation = "\n".join(formatted_conversation)
        elif is_guanaco:
            formatted_conversation.append(f"{head_template}")
            for user_entry, bot_entry in zip(history["user"], history["bot"]):
                user_text = user_entry["text"]
                bot_text = bot_entry["text"]
                formatted_conversation.append(f"### Human: {user_text}")
                formatted_conversation.append(f"### Assistant: {bot_text}")
            formatted_conversation.append(f"### Human: {prompt} {foot_template}")
            formatted_conversation.append("### Assistant: ")
            formatted_conversation = "\n".join(formatted_conversation)
        else:
            formatted_conversation.append(f"Human: {head_template}")
            for user_entry, bot_entry in zip(history["user"], history["bot"]):
                user_text = user_entry["text"]
                bot_text = bot_entry["text"]
                formatted_conversation.append(f"Human: {user_text}")
                formatted_conversation.append(f"Assistant: {bot_text}")
            formatted_conversation.append(f"Human: {prompt} {foot_template}")
            formatted_conversation.append("Assistant: ")
            formatted_conversation = "\n".join(formatted_conversation)

        response = await self.generate_text(
            formatted_conversation, model, provider, is_conversational=True
        )
        try:
            return response["text"]
        except Exception as e:
            print(e)
            return "None"

    def provider_name(self):
        return "huggingface_api"
