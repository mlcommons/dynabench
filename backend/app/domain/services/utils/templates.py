# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

"""Templates to make requests to the different LLM providers"""

OPENAI_HEAD_TEMPLATE: str = """You are a helpful assistant."""
OPENAI_FOOT_TEMPLATE: str = """Limit your answers to 50 words."""
COHERE_HEAD_TEMPLATE: str = """You are a helpful assistant."""
COHERE_FOOT_TEMPLATE: str = """Limit your answers to 50 words."""
ANTHROPIC_HEAD_TEMPLATE: str = """You are a helpful assistant."""
ANTHROPIC_FOOT_TEMPLATE: str = """Limit your answers to 50 words."""
