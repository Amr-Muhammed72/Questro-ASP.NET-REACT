---
title: Questro Recommender Model API
emoji: 🎬
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7749
pinned: false
---

# Questro Recommender Model API (CL-EPIDTN, improved_8)

FastAPI service that scores and re-ranks movie/game candidates for the Questro
RAG pipeline. It exposes `/recommend`, `/recommend/rerank`, `/catalog/add`,
`/genres`, and `/health` on port **7749**.

The full catalog (189,753 items) is baked into the artifacts, so the model
never hot-adds items at runtime. The ~1.2 GB artifacts are **not** stored in
this Space — the Dockerfile downloads them from the public model repo
[`zeyadgamal00/CL-EPIDTN`](https://huggingface.co/zeyadgamal00/CL-EPIDTN) at
build time (`MODEL_REPO` env). See
[RECOMMENDER_API_IMPROVED8_DOCS.md](RECOMMENDER_API_IMPROVED8_DOCS.md) for the
API reference.
