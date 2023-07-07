# Copyright (c) Facebook, Inc. and its affiliates.
#
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

FROM nvidia/cuda:10.2-cudnn7-runtime-ubuntu18.04

ENV PYTHONUNBUFFERED TRUE

ARG tarball
ARG requirements
ARG setup
ARG my_secret
ARG task_code

RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
    fakeroot \
    ca-certificates \
    dpkg-dev \
    g++ \
    python3.6-dev \
    python3-pip \
    openjdk-11-jre-headless \
    curl \
    vim \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.6 1
RUN cd /tmp \
    && curl -O https://bootstrap.pypa.io/pip/3.6/get-pip.py \
    && python3 get-pip.py

# Explicitly install nvgpu until the issue is fixed
# https://github.com/pytorch/serve/issues/1516
RUN python -m pip install --no-cache-dir torchserve nvgpu
RUN python -m pip install --no-cache-dir torch==1.8.1

COPY dockerd-entrypoint.sh /usr/local/bin/dockerd-entrypoint.sh
RUN chmod +x /usr/local/bin/dockerd-entrypoint.sh

RUN mkdir -p /home/model-server/ && mkdir -p /home/model-server/tmp
COPY config.properties /home/model-server/config.properties
COPY ${task_code}.json /home/model-server/code/

ENV TEMP=/home/model-server/tmp
ADD ${tarball} /home/model-server/code
WORKDIR /home/model-server/code

RUN if [ -f requirements.txt ] && [ ${requirements} = True ]; then python -m pip install --no-cache-dir --force-reinstall -r requirements.txt; fi
RUN if [ -f setup.py ] && [ ${setup} = True ]; then python -m pip install --no-cache-dir --force-reinstall -e .; fi

RUN python -m pip install --force-reinstall git+https://github.com/facebookresearch/dynalab.git


RUN echo 'from dynalab.tasks.task_io import TaskIO; TaskIO("'${task_code}'")'
RUN python -c 'from dynalab.tasks.task_io import TaskIO; TaskIO("'${task_code}'")'

ENV PYTHONIOENCODING=UTF-8
ENV MY_SECRET=${my_secret}
ENTRYPOINT ["/usr/local/bin/dockerd-entrypoint.sh"]
CMD ["serve"]
