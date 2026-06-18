# syntax=docker/dockerfile:1

# CL-EPIDTN recommender model API (improved_8) — CPU-only FastAPI/Uvicorn image.
FROM python:3.11-slim

# --- Environment ---------------------------------------------------------
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=7749 \
    ARTIFACTS_DIR=artifacts_improved8 \
    # Bake the Hugging Face cache into the image so the text encoder used by
    # /catalog/add is available offline and without a runtime download.
    HF_HOME=/app/hf_cache

WORKDIR /app

# --- System dependencies -------------------------------------------------
# build-essential covers any package without a prebuilt wheel; curl powers the healthcheck.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential curl \
    && rm -rf /var/lib/apt/lists/*

# --- Python dependencies -------------------------------------------------
# CPU-only torch first (the GPU build is huge and unnecessary for serving),
# then the rest of the dependencies from PyPI.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.6.0

COPY requirements.docker.txt ./
RUN pip install -r requirements.docker.txt

# Pre-download the text encoder used for catalog hot-add so the container does
# not need to fetch it from Hugging Face at runtime.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')"

# --- Model artifacts -----------------------------------------------------
# The ~1.2 GB artifacts exceed the Space repo storage limit, so they are NOT
# bundled. Pull them from the public model repo at build time instead. This
# layer is placed before COPY so code changes don't re-trigger the download.
ENV MODEL_REPO=zeyadgamal00/CL-EPIDTN
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='$MODEL_REPO', repo_type='model', allow_patterns=['artifacts_improved8/**'], local_dir='/app')"

# --- Application ---------------------------------------------------------
# Copies the API + model code only (artifacts already downloaded above; the
# artifacts dir is excluded from the build context via .dockerignore).
COPY . .

EXPOSE 7749

# /health reports model_loaded once artifacts finish loading at startup.
HEALTHCHECK --interval=30s --timeout=10s --start-period=180s --retries=3 \
    CMD curl -fsS http://localhost:${PORT}/health || exit 1

CMD ["sh", "-c", "uvicorn recommender_api_improved8:app --host 0.0.0.0 --port ${PORT}"]
