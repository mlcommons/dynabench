# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import time

import requests


class DummyRequest:
    def __init__(self):
        self.method = "/model/single_evaluation"

    def sentiment_dummy_call(self):
        urls = [f"https://xg7yn6wnbj32scbnv2i6vvp4mm0npsyj.lambda-url.eu-west-3.on.aws"]
        data = {"statement": "This is a nice message"}
        for url in urls:
            requests.post(f"{url}{self.method}", json=data)

    def nli_dummy_call(self):
        urls = [f"https://26d2flibrxcgm453pupq7xx4pi0mgnwy.lambda-url.eu-west-3.on.aws"]
        data = {"hypothesis": "This is a nice message", "context": "This is a test"}
        for url in urls:
            requests.post(f"{url}{self.method}", json=data)

    def hs_dummy_call(self):
        urls = [f"https://7qezcrvld5pf72jxktulyv7ssa0nwwin.lambda-url.eu-west-3.on.aws"]
        data = {"statement": "This is a nice message", "context": "This is a test"}
        for url in urls:
            requests.post(f"{url}{self.method}", json=data)

    def qa_dummy_call(self):
        urls = [f"https://ostags6bh3qftqoll3336o2wgq0wshmi.lambda-url.eu-west-3.on.aws"]
        data = {
            "answer": "This is a nice message",
            "context": "This is a test",
            "question": "This is a test",
        }
        for url in urls:
            requests.post(f"{url}{self.method}", json=data)

    def qb_dummy_call(self):
        urls = [f"https://x3rgzv7ermzkymu3fp3ieciat40hcqlq.lambda-url.eu-west-3.on.aws"]
        data = {"answer": "This is a nice message", "question": "This is a test"}
        for url in urls:
            requests.post(f"{url}{self.method}", json=data)

    def principal(self):
        self.sentiment_dummy_call()
        self.nli_dummy_call()
        self.hs_dummy_call()
        self.qa_dummy_call()
        self.qb_dummy_call()


if __name__ == "__main__":
    while True:
        request = DummyRequest()
        request.principal()
        time.sleep(30)
