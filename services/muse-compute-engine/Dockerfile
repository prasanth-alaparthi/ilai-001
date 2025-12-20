# ===========================================
# MUSE Compute Engine - Optimized Multi-Stage Build
# Target: Reduce image from ~10GB to ~2GB
# ===========================================

# Stage 1: Builder - Full Python with build tools
FROM python:3.11 AS builder

WORKDIR /build

# Install build dependencies for compiled packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies into venv
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Download NLP models
RUN python -m spacy download en_core_web_sm
RUN python -c "import nltk; nltk.download('cmudict', quiet=True)"

# ===========================================
# Stage 2: Runtime - Slim image without build tools
# ===========================================
FROM python:3.11-slim

WORKDIR /app

# Install only runtime dependencies (no build-essential!)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy NLTK data
COPY --from=builder /root/nltk_data /root/nltk_data

# Copy application code
COPY . .

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
