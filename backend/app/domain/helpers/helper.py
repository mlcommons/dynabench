# Copyright (c) MLCommons and its affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

from urllib.parse import urlparse


def parse_url(url, host_name=None):
    """
    parse and extract the host name and server scheme from request url
    :param url:
    :return: url hostname {https://dynabench.org}
    """

    try:
        if not host_name:
            parsed_uri = urlparse(url)
            formed_url = "{uri.scheme}://{uri.netloc}".format(uri=parsed_uri)
            return formed_url
        return host_name
    except Exception:
        return "https://dynabench.org"
