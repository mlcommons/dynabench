FROM python:3.10-slim

# Install system dependencies required for audio processing and ML libraries
RUN apt-get update && apt-get install -y \
    git \
    gcc \
    g++ \
    make \
    wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy the handler code
COPY handler.py .

# Start the container
CMD ["python3", "-u", "handler.py"]
