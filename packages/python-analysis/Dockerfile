# Multi-stage Dockerfile for Python Analysis Service
# Dockerfile multi-estágio para o Serviço de Análise Python

# Stage 1: Base image with Python and system dependencies
FROM python:3.11-slim AS base
LABEL maintainer="Advanced DMS Team <dev@adms.ao>"
LABEL description="Python analysis service with OCR and NLP for Advanced DMS"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Tesseract OCR and language packs
    tesseract-ocr \
    tesseract-ocr-por \
    tesseract-ocr-eng \
    tesseract-ocr-fra \
    # Image processing libraries
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    # PDF processing
    poppler-utils \
    # Build tools (needed for some Python packages)
    gcc \
    g++ \
    make \
    # Network tools
    curl \
    # Clean up
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r adms && useradd -r -g adms adms

# Set working directory
WORKDIR /app

# Stage 2: Dependencies installation
FROM base AS deps

# Copy requirements
COPY packages/python-analysis/pyproject.toml ./
COPY packages/python-analysis/requirements.txt* ./

# Install Python dependencies
RUN pip install --upgrade pip setuptools wheel && \
    pip install -e . && \
    pip cache purge

# Stage 3: Development dependencies
FROM deps AS deps-dev

# Install development dependencies
RUN pip install -e .[dev] && \
    pip cache purge

# Download spaCy models
RUN python -m spacy download pt_core_news_lg && \
    python -m spacy download en_core_web_lg && \
    python -m spacy download fr_core_news_lg

# Stage 4: Development image
FROM deps-dev AS development
ENV ENVIRONMENT=development

# Copy source code
COPY packages/python-analysis/src/ ./src/
COPY packages/python-analysis/tests/ ./tests/

# Create necessary directories
RUN mkdir -p /app/storage/temp /app/storage/cache && \
    chown -R adms:adms /app

USER adms

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start command for development (with hot reload)
CMD ["python", "-m", "uvicorn", "src.adms_analysis.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# Stage 5: Production image
FROM deps AS production
ENV ENVIRONMENT=production

# Download spaCy models for production
RUN python -m spacy download pt_core_news_lg && \
    python -m spacy download en_core_web_lg && \
    python -m spacy download fr_core_news_lg

# Copy source code
COPY packages/python-analysis/src/ ./src/

# Create necessary directories
RUN mkdir -p /app/storage/temp /app/storage/cache && \
    chown -R adms:adms /app

USER adms

# Expose port
EXPOSE 8001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start command for production
CMD ["python", "-m", "uvicorn", "src.adms_analysis.main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "4"]

# Default target is development
FROM development AS default