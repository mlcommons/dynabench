FROM python:3.10

WORKDIR /app
COPY worker/requirements.txt .
RUN pip install -r requirements.txt
COPY ./app ./app
COPY ./worker ./worker
COPY ./worker/celery_entrypoint.sh ./celery_entrypoint.sh