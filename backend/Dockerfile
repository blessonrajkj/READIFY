FROM python:3.11-slim

# Install system dependencies for EasyOCR (OpenCV) and PyMuPDF
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    libglib2.0-0 \
    libgl1-mesa-glx \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Set Python path to ensure module imports resolve correctly
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["python", "run.py"]
