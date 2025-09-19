FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update \
 && apt-get install -y --no-install-recommends git \
 && rm -rf /var/lib/apt/lists/*

RUN python -m venv /opt/venv \
  && /opt/venv/bin/pip install --upgrade pip

RUN /opt/venv/bin/pip install runpod boto3 python-dotenv requests tqdm


# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy your handler file
COPY handler.py .

# Include small datasets inside the image
COPY data ./data

# Start the container
CMD ["python3", "-u", "handler.py"]
