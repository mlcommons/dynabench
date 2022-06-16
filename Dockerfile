FROM python:3.9
# Install dependencies
WORKDIR /dynabench
COPY api api
COPY evaluation evaluation
ADD evaluation evaluation
RUN pip install -r api/requirements.txt --no-cache-dir
RUN pip install -r evaluation/requirements.txt --no-cache-dir
# Run API server
WORKDIR /dynabench/api
ENV PORT 8080
EXPOSE 8080
CMD python server.py prod
