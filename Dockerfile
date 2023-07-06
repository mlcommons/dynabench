FROM python:3.9
# Install dependencies
WORKDIR /dynabench

COPY api/requirements.txt api/requirements.txt
COPY api/evaluation/requirements.txt api/evaluation/requirements.txt
RUN pip install -r api/requirements.txt --no-cache-dir
RUN pip install -r api/evaluation/requirements.txt --no-cache-dir

COPY api api
COPY api/evaluation api/evaluation
# Run API server
WORKDIR /dynabench/api
ENV PORT 8080
EXPOSE 8080
CMD python server.py prod
