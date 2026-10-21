FROM python:3.11-slim

# HuggingFace Spaces runs as user 1000
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend static files → served by FastAPI
COPY velocity-app/dist/ ./backend/static/rydex-app/
COPY frontend/dist/ ./backend/static/sre-dashboard/

# Set working directory to backend
WORKDIR /app/backend

# HuggingFace Spaces requires port 7860
ENV PORT=7860
ENV PYTHONPATH=/app/backend

# Run FastAPI on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
