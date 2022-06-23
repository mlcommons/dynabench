FROM python:3.9
# Install dependencies
WORKDIR /dynabench

COPY api/requirements.txt api/requirements.txt
COPY evaluation/requirements.txt evaluation/requirements.txt
RUN pip install -r api/requirements.txt --no-cache-dir
RUN pip install -r evaluation/requirements.txt --no-cache-dir

COPY api api
COPY evaluation evaluation
# Run API server
WORKDIR /dynabench/api
ENV PORT 8081
EXPOSE 8080
CMD python server.py dev
