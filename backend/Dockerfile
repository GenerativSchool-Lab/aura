FROM python:3.11-slim

WORKDIR /app

# Upgrade pip to avoid warnings
RUN pip install --upgrade pip

# Copy requirements first for better caching
COPY backend/requirements.txt .

# Install dependencies (this layer will be cached if requirements.txt doesn't change)
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/main.py .
COPY backend/clinical_scoring.py .

# Expose port (Railway will set PORT env var at runtime)
EXPOSE 8000

# Run the application (PORT env var will be set by Railway)
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}

