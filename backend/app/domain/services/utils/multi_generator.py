# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import asyncio
import random
from multiprocessing import Pool

from app.domain.services.utils.image_generators import (
    HF_SDXL,
    Dalle2ImageProvider,
    Dalle3ImageProvider,
    SDRunwayMLImageProvider,
    SDRunwayMLImageProvider2,
    SDRunwayMLImageProvider3,
    SDVariableAutoEncoder,
    SDVariableAutoEncoder2,
    SDVariableAutoEncoder3,
    SDXLImageProvider,
    SDXLImageProvider2,
    SDXLImageProvider3,
    SDXLTurboImageProvider,
    SDXLTurboImageProvider2,
    SDXLTurboImageProvider3,
    SDXLTurboImageProvider4,
    SDXLTurboImageProvider5,
    SDXLTurboImageProvider6,
)
from app.domain.services.utils.llm import (
    AlephAlphaProvider,
    AnthropicProvider,
    CohereProvider,
    GoogleProvider,
    HuggingFaceAPIProvider,
    HuggingFaceProvider,
    OpenAIProvider,
    ReplicateProvider,
)


class LLMGenerator:
    def __init__(self):
        # Providers
        self.llm_providers = {
            "openai": OpenAIProvider(),
            "cohere": CohereProvider(),
            "huggingface": HuggingFaceProvider(),
            "anthropic": AnthropicProvider(),
            "aleph": AlephAlphaProvider(),
            "google": GoogleProvider(),
            "replicate": ReplicateProvider(),
            "huggingface_api": HuggingFaceAPIProvider(),
        }

    async def generate_one_text(
        self, generator, prompt, model, is_conversational: bool = False
    ):
        text = await generator.generate_text(prompt, model, is_conversational)
        return text

    async def generate_all_texts(
        self, prompt: str, model, is_conversational: bool = False
    ) -> list:
        """Generate text from all LLM providers asynchronously

        Args:
            prompt (str): The text to generate from
            model (dict): Contains all relevant info for the model
            is_conversational (bool, optional): _description_. Defaults to False.

        Returns:
            list: A list of dictionaries with the metadata and generated text
        """
        selected_providers = [list(providers.keys())[0] for providers in model]
        parameters = []
        for provider, cur_model in zip(selected_providers, model):
            if list(cur_model.keys())[0] == provider:
                parameters.append(
                    [self.llm_providers[provider], prompt, cur_model, is_conversational]
                )

        all_tasks = set()
        for parameter in parameters:
            task = asyncio.create_task(self.generate_one_text(*parameter))
            all_tasks.add(task)
        results = await asyncio.gather(*all_tasks)

        final_results = []
        for result in results:
            if result is not None:
                if result["text"] != "":
                    final_results.append(result)

        if len(final_results) == 0:
            return [
                {
                    "text": "No models are available right now",
                    "provider_name": "None",
                    "model_name": "none",
                    "artifacts": {},
                }
            ]
        else:
            return final_results


class ImageGenerator:
    def __init__(self):
        self.image_providers = [
            SDVariableAutoEncoder(),
            SDVariableAutoEncoder2(),
            SDVariableAutoEncoder3(),
            Dalle3ImageProvider(),
            Dalle2ImageProvider(),
            SDRunwayMLImageProvider(),
            SDRunwayMLImageProvider2(),
            SDRunwayMLImageProvider3(),
            SDXLImageProvider(),
            SDXLImageProvider2(),
            SDXLImageProvider3(),
            SDXLTurboImageProvider(),
            SDXLTurboImageProvider2(),
            SDXLTurboImageProvider3(),
            SDXLTurboImageProvider4(),
            SDXLTurboImageProvider5(),
            SDXLTurboImageProvider6(),
            HF_SDXL(),
        ]

    def generate_images_parallel(self, generator, prompt, num_images, models, endpoint):
        return generator.generate_images(prompt, num_images, models, endpoint)

    def generate_all_images(
        self, prompt: str, num_images: int, models: list, endpoint: str
    ) -> list:
        generators = random.sample(self.image_providers, num_images)
        with Pool(len(generators)) as _:
            with Pool() as pool:
                results = pool.starmap(
                    self.generate_images_parallel,
                    [
                        (generator, prompt, num_images, models, endpoint)
                        for generator in generators
                    ],
                )
            pool.close()
            pool.join()
        return results

    def generate_one_image(self, prompt, num_images, models, endpoint, user_id):
        model = random.sample(self.image_providers, 1)[0]
        return model.generate_images(prompt, num_images, models, endpoint, user_id)
