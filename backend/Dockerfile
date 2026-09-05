FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (curl for health check, libpq, build tools)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend codebase
COPY . .

# Ensure upload and storage directories exist
RUN mkdir -p uploads storage

# Expose port
EXPOSE 8000

# Set Python path
ENV PYTHONPATH=/app

# Start server
CMD ["sh", "-c", "alembic upgrade head && python -m app.seed && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
