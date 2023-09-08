# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import requests
from requests.adapters import HTTPAdapter


class RequestSession:
    def __init__(self):
        self.custom_adapter = HTTPAdapter(max_retries=1)
        self.session = requests.Session()
        self.session.mount("https://", self.custom_adapter)
        self.session.mount("http://", self.custom_adapter)

    def session(self):
        return self.session
