# syntax=docker/dockerfile:1

# Recommender RAG service — CPU-only Flask image served by waitress.
FROM python:3.11-slim

# --- Environment ---------------------------------------------------------
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=5000 \
    # Bake the Hugging Face cache into the image so the embedding model is
    # available offline and the container starts without downloading it.
    HF_HOME=/app/hf_cache \
    TRANSFORMERS_OFFLINE=0

WORKDIR /app

# --- System dependencies -------------------------------------------------
# build-essential covers any package without a prebuilt wheel for this
# platform; curl is used by the healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# --- Python dependencies -------------------------------------------------
# Install CPU-only torch first from the PyTorch CPU index (the project pins
# +cu124 CUDA wheels which are huge and unnecessary for serving), then the
# rest of the dependencies from PyPI.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.6.0

COPY requirements.docker.txt ./
RUN pip install -r requirements.docker.txt

# Pre-download the sentence-transformers embedding model so the container does
# not need to fetch it from Hugging Face at runtime.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('multi-qa-mpnet-base-dot-v1')"

# --- Application ---------------------------------------------------------
# Copy the app source and the prebuilt FAISS index/metadata (vector_store/).
# Large dataset caches (data_cache/) and the venv are excluded via .dockerignore.
COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -fsS -X POST http://localhost:${PORT}/api/recommend \
        -H "Content-Type: application/json" -d '{"query":"healthcheck"}' || exit 1

CMD ["python", "serve.py"]
