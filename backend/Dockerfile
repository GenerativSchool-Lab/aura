FROM python:3.11-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies (this layer will be cached if requirements.txt doesn't change)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .

# Expose port (Railway will set PORT env var)
EXPOSE ${PORT:-8000}

# Run the application
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

