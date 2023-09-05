# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from multiprocessing import Pool

from app.domain.services.utils.image_generators import (  # DynabenchImageProvider,
    HFImageProvider,
    OpenAIImageProvider,
    SDVariableAutoEncoder,
)


class ImageGenerator:
    def __init__(self):
        self.image_providers = [
            HFImageProvider(),
            # DynabenchImageProvider(),
            SDVariableAutoEncoder(),
            OpenAIImageProvider(),
        ]

    def generate_images_parallel(self, generator, prompt, num_images, models, endpoint):
        return generator.generate_images(prompt, num_images, models, endpoint)

    def generate_all_images(
        self, prompt: str, num_images: int, models: list, endpoint: str
    ) -> list:
        with Pool(len(self.image_providers)) as _:
            with Pool() as pool:
                results = pool.starmap(
                    self.generate_images_parallel,
                    [
                        (generator, prompt, num_images, models, endpoint)
                        for generator in self.image_providers
                    ],
                )
            pool.close()
            pool.join()
        return results
