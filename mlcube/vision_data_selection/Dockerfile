FROM python:3.9-slim

RUN apt update -y
RUN apt install default-jdk -y

COPY requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

COPY *.py /app/
COPY *.yaml /app/

WORKDIR /app/
ENTRYPOINT python3 main.py --docker_flag True
