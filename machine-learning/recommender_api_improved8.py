"""
recommender_api_improved8.py
============================
FastAPI server for the CL-EPIDTN recommender (improved_8).
No QuestroDb dependency — all user signals arrive in the request body.

Features
--------
- Accepts users_ratings.csv-style profiles (survey labels) AND numeric stars.
- Wishlist / ignore-list items mapped to "Didn't watch but would watch" /
  "Didn't watch and wouldn't watch" signals automatically.
- Parental-control genre/tag blocking (always case-insensitive).
- Pagination via `offset` parameter so the backend can fetch more pages.
- RAG reranking endpoint: score a pre-fetched candidate list with the model.
- API-safe IDs: accepts `movie_123`, `movie:123`, and returns string IDs.
- Runtime catalog hot-add for cold-start items.

Start with:
    uvicorn recommender_api_improved8:app --host 0.0.0.0 --port 7749 --reload

Artifacts directory: ./artifacts_improved8/
"""

from __future__ import annotations

import math
import os
import pickle
import re
import threading
from contextlib import asynccontextmanager
from typing import Literal

import pandas as pd
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from cl_epidtn_recommender_improved_8 import (
    CLEPIDTN,
    PAD,
    RecConfig,
    SURVEY_RATING_VALUES,
    recommend_from_history,
    survey_rating_weight,
)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

ARTIFACTS_DIR = os.getenv("ARTIFACTS_DIR", "artifacts_improved8")

CONFIG = {
    "model_checkpoint": os.getenv(
        "MODEL_CHECKPOINT",
        os.path.join(ARTIFACTS_DIR, "improved_8epochs.pt"),
    ),
    "item_meta_path": os.getenv(
        "ITEM_META_PATH",
        os.path.join(ARTIFACTS_DIR, "item_meta.pkl"),
    ),
    "item_index_path": os.getenv(
        "ITEM_INDEX_PATH",
        os.path.join(ARTIFACTS_DIR, "item_index.pt"),
    ),
    "item_to_idx_path": os.getenv(
        "ITEM_TO_IDX_PATH",
        os.path.join(ARTIFACTS_DIR, "item_to_idx.pkl"),
    ),
    "title_lookup_path": os.getenv(
        "TITLE_LOOKUP_PATH",
        os.path.join(ARTIFACTS_DIR, "title_lookup.pkl"),
    ),
    "text_embeddings_path": os.getenv(
        "TEXT_EMBEDDINGS_PATH",
        os.path.join(ARTIFACTS_DIR, "improved_item_text_embeddings.pt"),
    ),
    "model_version": "improved_8",
    "max_recs": int(os.getenv("MAX_RECS", "100")),
    "text_encoder_model": os.getenv(
        "TEXT_ENCODER_MODEL",
        "sentence-transformers/all-MiniLM-L6-v2",
    ),
    # Over-fetch multiplier: fetch this many more candidates before filtering
    # so that blocked-genre filtering still returns the requested `k` items.
    "overfetch_multiplier": int(os.getenv("OVERFETCH_MULTIPLIER", "5")),
    # Title-family calibration helps single-seed profiles prefer obvious
    # franchise neighbors before broad genre matches like "open world action".
    "title_family_boost": float(os.getenv("TITLE_FAMILY_BOOST", "0.40")),
    "title_family_extra_candidates": int(os.getenv("TITLE_FAMILY_EXTRA_CANDIDATES", "50")),
}


# ---------------------------------------------------------------------------
# Rating label mappings — matches users_ratings.csv exactly
# ---------------------------------------------------------------------------

# Survey text labels → numeric weight in [-1, 1]
_LABEL_WEIGHTS: dict[str, float] = {
    label: survey_rating_weight(label) for label in SURVEY_RATING_VALUES
}

# Star ratings (1–5) → weight in [-1, 1]
def _stars_to_weight(stars: float) -> float:
    return max(-1.0, min((stars - 3.0) / 2.0, 1.0))


# ---------------------------------------------------------------------------
# Genre / tag lookup builder
# ---------------------------------------------------------------------------

def _build_item_genre_lookup(
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
) -> dict[int, set[str]]:
    """Build item_id → set of lowercase genre/tag strings.

    Sources (all lowercased):
    - `hf_genres` column (pipe- or comma-separated)
    - `hf_tags` column (pipe- or comma-separated)
    - first 20 tokens from the `tokens` column (genre-like keywords)
    """
    lookup: dict[int, set[str]] = {}
    for row in item_meta.itertuples(index=False):
        idx = item_to_idx.get(row.item_key)
        if idx is None:
            continue
        genres: set[str] = set()
        for col_name in ("hf_genres", "hf_tags"):
            value = getattr(row, col_name, None)
            if value and not (isinstance(value, float) and math.isnan(value)):
                for part in re.split(r"[|,]", str(value)):
                    part = part.strip().lower()
                    if part:
                        genres.add(part)
        # Also extract the first tokens which are usually genre keywords
        tokens_value = getattr(row, "tokens", "")
        if tokens_value and isinstance(tokens_value, str):
            for tok in tokens_value.split()[:20]:
                tok = tok.strip().lower()
                if len(tok) > 2:
                    genres.add(tok)
        lookup[idx] = genres
    return lookup


def _filter_blocked_genres(
    recommendations: list[tuple[int, float]],
    blocked_genres: set[str],
    genre_lookup: dict[int, set[str]],
) -> list[tuple[int, float]]:
    """Remove items whose genre set intersects the blocked set."""
    if not blocked_genres:
        return recommendations
    return [
        (item_id, score)
        for item_id, score in recommendations
        if not genre_lookup.get(item_id, set()).intersection(blocked_genres)
    ]


def _clean_int_id(value) -> int | None:
    if value is None or pd.isna(value):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _build_provider_id_lookup(
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
) -> dict[int, dict[str, int | None]]:
    lookup: dict[int, dict[str, int | None]] = {}
    for row in item_meta.itertuples(index=False):
        idx = item_to_idx.get(row.item_key)
        if idx is None:
            continue
        lookup[idx] = {
            "tmdb_id": _clean_int_id(getattr(row, "tmdb_id", None)),
            "rawg_id": _clean_int_id(getattr(row, "rawg_id", None)),
        }
    return lookup


# ---------------------------------------------------------------------------
# Application state
# ---------------------------------------------------------------------------

class AppState:
    model: CLEPIDTN | None = None
    item_index: torch.Tensor | None = None
    text_index: torch.Tensor | None = None
    item_meta: pd.DataFrame | None = None
    item_to_idx: dict[str, int] | None = None
    idx_to_key: dict[int, str] | None = None
    title_lookup: dict[int, str] | None = None
    provider_id_lookup: dict[int, dict[str, int | None]] | None = None
    item_genre_lookup: dict[int, set[str]] | None = None
    cfg: RecConfig | None = None
    lock = threading.RLock()
    hot_added_count: int = 0


state = AppState()


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    _load_artifacts()
    yield


def _load_artifacts() -> None:
    with state.lock:
        cfg = RecConfig()
        state.cfg = cfg

        # item_to_idx
        with open(CONFIG["item_to_idx_path"], "rb") as f:
            state.item_to_idx = pickle.load(f)
        state.idx_to_key = {v: k for k, v in state.item_to_idx.items()}

        # item_meta
        with open(CONFIG["item_meta_path"], "rb") as f:
            state.item_meta = pickle.load(f)

        # title_lookup
        if os.path.exists(CONFIG["title_lookup_path"]):
            with open(CONFIG["title_lookup_path"], "rb") as f:
                state.title_lookup = pickle.load(f)
        else:
            state.title_lookup = {}

        # text embeddings (optional — enhances content-based scoring)
        text_emb_path = CONFIG["text_embeddings_path"]
        if os.path.exists(text_emb_path):
            raw = torch.load(text_emb_path, map_location="cpu", weights_only=False)
            if isinstance(raw, dict) and "tensor" in raw:
                state.text_index = raw["tensor"]
            elif isinstance(raw, torch.Tensor):
                state.text_index = raw
            else:
                state.text_index = None
            print(f"[startup] text embeddings loaded: {state.text_index.shape if state.text_index is not None else 'N/A'}")
        else:
            state.text_index = None

        # item_index
        state.item_index = torch.load(
            CONFIG["item_index_path"], map_location="cpu", weights_only=False,
        )

        # model
        checkpoint = torch.load(
            CONFIG["model_checkpoint"], map_location=cfg.device, weights_only=False,
        )
        model: CLEPIDTN = checkpoint["model"]
        model.to(cfg.device)
        model.eval()
        state.model = model

        # genre lookup
        state.item_genre_lookup = _build_item_genre_lookup(
            state.item_meta, state.item_to_idx,
        )
        state.provider_id_lookup = _build_provider_id_lookup(
            state.item_meta, state.item_to_idx,
        )
        state.hot_added_count = 0

        print(
            f"[startup] model loaded | "
            f"{len(state.item_to_idx):,} items | "
            f"item_index {state.item_index.shape} | "
            f"genres tracked: {len(state.item_genre_lookup):,} items"
        )


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Questro Recommender API (improved_8)",
    version=CONFIG["model_version"],
    description=(
        "CL-EPIDTN recommendation engine with parental-control genre blocking, "
        "pagination, and a RAG reranking tool."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class RatingItem(BaseModel):
    """A single item rating — supports BOTH survey labels and numeric stars.

    Provide exactly ONE of `rating` (survey label) or `stars` (numeric).
    You can also use `source` to signal wishlist/ignore items.
    """
    item_id: str = Field(
        description=(
            'Item identifier in the format "movie_123", "movie:123", '
            '"game_123", or "game:123".'
        ),
    )
    title: str | None = Field(
        default=None,
        description="Human-readable title (optional, for logging only).",
    )
    type: Literal["movie", "game"] | None = Field(
        default=None,
        description='Domain hint. Inferred from item_id prefix if omitted.',
    )
    rating: str | None = Field(
        default=None,
        description=(
            "Survey-style label.  One of: "
            '"5 Stars", "4 Stars", "3 Stars", "2 Stars", "1 Star", '
            '"Didn\'t watch but would watch", "Didn\'t play but would play", '
            '"Didn\'t watch and wouldn\'t watch", "Didn\'t play and wouldn\'t play".'
        ),
    )
    stars: float | None = Field(
        default=None,
        ge=1.0,
        le=5.0,
        description="Numeric star rating (1.0–5.0). Alternative to `rating`.",
    )
    source: Literal["rating", "wishlist", "ignore"] | None = Field(
        default=None,
        description=(
            'Signal source.  "wishlist" → treated as "would watch/play" (3.5 stars).  '
            '"ignore" → treated as "wouldn\'t watch/play" (1.5 stars).  '
            '"rating" or null → uses `rating` or `stars` field.'
        ),
    )

    @field_validator("rating", mode="before")
    @classmethod
    def _validate_label(cls, v):
        if v is not None and v not in SURVEY_RATING_VALUES:
            raise ValueError(
                f"Invalid rating label: {v!r}. "
                f"Must be one of: {list(SURVEY_RATING_VALUES.keys())}"
            )
        return v


class UserProfile(BaseModel):
    """User profile matching users_ratings.csv schema."""
    age: int | None = Field(default=None, ge=1, le=120)
    gender: str | None = None
    profession: str | None = None
    country: str | None = None
    movie_genres_fav: str | None = Field(
        default=None,
        description='Pipe-separated favourite movie genres, e.g. "Action|Comedy".',
    )
    movie_genres_disliked: str | None = Field(
        default=None,
        description='Pipe-separated disliked movie genres.',
    )
    game_genres_fav: str | None = Field(
        default=None,
        description='Pipe-separated favourite game genres.',
    )
    game_genres_disliked: str | None = Field(
        default=None,
        description='Pipe-separated disliked game genres.',
    )
    ratings: list[RatingItem] = Field(
        min_length=1,
        description="User's interaction history (at least 1 item).",
    )


class RecommendRequest(BaseModel):
    """Request body for /recommend."""
    user: UserProfile
    domain: Literal["movie", "game"] | None = Field(
        default=None,
        description='Filter to "movie" or "game".  Omit for cross-domain.',
    )
    k: int = Field(
        default=10,
        ge=1,
        le=100,
        description="Number of recommendations per page.",
    )
    offset: int = Field(
        default=0,
        ge=0,
        description="Pagination offset.  0 = first page, k = second page, etc.",
    )
    blocked_genres: list[str] | None = Field(
        default=None,
        description=(
            "Genres/tags to block (parental controls).  "
            "Case-insensitive.  Pass null or omit for no blocking."
        ),
    )


class CandidateItem(BaseModel):
    """An item from the RAG's candidate list."""
    item_id: str = Field(
        description='Item identifier, e.g. "movie_155", "movie:155", "game_271590", or "game:271590".',
    )
    title: str | None = Field(default=None, description="Optional title.")


class CatalogNewItem(BaseModel):
    """Register a catalog item that was not present when improved_8 was trained."""
    item_id: str = Field(
        description='API/internal item ID. Accepts "movie_123", "movie:123", "game_123", or "game:123".',
    )
    title: str
    domain: Literal["movie", "game"] | None = Field(
        default=None,
        description="Optional domain override. Inferred from item_id when omitted.",
    )
    description: str = ""
    genres: str = Field(default="", description='Pipe- or comma-separated genres, e.g. "Action|RPG".')
    tags: str = Field(default="", description="Pipe- or comma-separated tags.")
    provider_id: int | None = Field(
        default=None,
        description="TMDB ID for movies, RAWG ID for games.",
    )


class CatalogAddRequest(BaseModel):
    items: list[CatalogNewItem] = Field(min_length=1, max_length=500)


class CatalogAddResponse(BaseModel):
    added: list[str]
    already_exists: list[str]
    failed: dict[str, str]
    n_items: int
    text_index_updated: bool


class ReloadResponse(BaseModel):
    status: str
    n_items: int
    text_index_loaded: bool
    hot_added_count: int


class RerankRequest(BaseModel):
    """Request body for /recommend/rerank (RAG tool)."""
    user: UserProfile
    candidate_items: list[CandidateItem] = Field(
        min_length=1,
        description="Items fetched by the RAG to be re-ranked by the recommender.",
    )
    blocked_genres: list[str] | None = Field(
        default=None,
        description="Genres/tags to block (case-insensitive).",
    )
    k: int | None = Field(
        default=None,
        ge=1,
        le=100,
        description="Max items to return.  null = return all candidates ranked.",
    )


class RecommendationItem(BaseModel):
    item_id: int | None = Field(
        default=None,
        description="Backend provider ID: TMDB ID for movies, RAWG ID for games.",
    )
    item_key: str
    title: str
    domain: Literal["movie", "game"]
    score: float


class RecommendResponse(BaseModel):
    count: int
    total_available: int
    domain: str | None
    offset: int
    k: int
    recommendations: list[RecommendationItem]
    signals_used: int
    blocked_genres: list[str]
    model_version: str
    has_more: bool


class RerankResponse(BaseModel):
    count: int
    recommendations: list[RecommendationItem]
    signals_used: int
    candidates_submitted: int
    candidates_matched: int
    blocked_genres: list[str]
    model_version: str


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    n_items: int
    n_genres_tracked: int
    text_index_loaded: bool
    model_version: str
    hot_added_count: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _require_model() -> None:
    if state.model is None or state.item_index is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet.")


def _parse_item_key(item_id: str, domain_hint: str | None = None) -> str | None:
    """Normalize API IDs to internal item keys (`movie:123`, `game:123`)."""
    value = str(item_id).strip()
    if not value:
        return None
    if ":" in value:
        domain, raw_id = value.split(":", 1)
    elif "_" in value:
        domain, raw_id = value.split("_", 1)
    else:
        return None
    domain = (domain_hint or domain).strip().lower()
    raw_id = raw_id.strip()
    if domain not in {"movie", "game"} or not raw_id:
        return None
    return f"{domain}:{raw_id}"


def _catalog_tokens(*values: str) -> str:
    text = " ".join(value for value in values if value)
    return " ".join(t for t in re.findall(r"[a-z0-9]+", text.lower()) if len(t) > 2)


_TITLE_VERSION_WORDS = {
    "i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x",
    "one", "two", "three", "four", "five",
    "definitive", "edition", "complete", "collection", "remastered",
    "remaster", "reload", "reloaded", "deluxe", "ultimate", "goty",
    "enhanced", "pack", "dlc", "expansion", "pass", "starter",
    "content", "mod", "multiplayer",
}


def _title_family_tokens(title: str) -> tuple[str, ...]:
    """Extract stable franchise-like title tokens.

    This intentionally drops version/edition/DLC words so "Grand Theft Auto V"
    can match "Grand Theft Auto IV" without hard-coding either title.
    """
    value = re.sub(r"\((?:19|20)\d{2}\)", " ", str(title).lower())
    value = value.replace("™", " ").replace("®", " ")
    tokens = [
        token
        for token in re.findall(r"[a-z0-9]+", value)
        if len(token) > 1
        and not token.isdigit()
        and token not in _TITLE_VERSION_WORDS
    ]
    return tuple(tokens[:4])


def _family_prefix_score(a: tuple[str, ...], b: tuple[str, ...]) -> float:
    if len(a) < 2 or len(b) < 2:
        return 0.0
    shared_prefix = 0
    for left, right in zip(a, b):
        if left != right:
            break
        shared_prefix += 1
    if shared_prefix >= 3:
        return 1.0
    if shared_prefix == 2:
        return 0.65
    return 0.0


def _positive_history_ids(history_ids: list[int], weights: list[float]) -> list[int]:
    return [idx for idx, weight in zip(history_ids, weights) if weight > 0]


def _title_family_candidates(
    history_ids: list[int],
    weights: list[float],
    domain: str | None,
) -> list[int]:
    if state.item_meta is None or state.item_to_idx is None:
        return []
    positive_families = [
        _title_family_tokens((state.title_lookup or {}).get(item_id, ""))
        for item_id in _positive_history_ids(history_ids, weights)
    ]
    positive_families = [family for family in positive_families if len(family) >= 2]
    if not positive_families:
        return []

    history_set = set(history_ids)
    rows: list[tuple[int, float]] = []
    for row in state.item_meta.itertuples(index=False):
        item_key = getattr(row, "item_key", None)
        if not item_key:
            continue
        item_id = state.item_to_idx.get(item_key)
        if item_id is None or item_id in history_set:
            continue
        row_domain = getattr(row, "domain", None)
        if domain is not None and row_domain != domain:
            continue
        family = _title_family_tokens(getattr(row, "title", ""))
        score = max((_family_prefix_score(src, family) for src in positive_families), default=0.0)
        if score > 0:
            rows.append((item_id, score))
    rows.sort(key=lambda pair: pair[1], reverse=True)
    return [item_id for item_id, _ in rows[: CONFIG["title_family_extra_candidates"]]]


def _apply_title_family_boost(
    recommendations: list[tuple[int, float]],
    history_ids: list[int],
    weights: list[float],
) -> list[tuple[int, float]]:
    boost = CONFIG["title_family_boost"]
    if boost <= 0:
        return recommendations
    positive_families = [
        _title_family_tokens((state.title_lookup or {}).get(item_id, ""))
        for item_id in _positive_history_ids(history_ids, weights)
    ]
    positive_families = [family for family in positive_families if len(family) >= 2]
    if not positive_families:
        return recommendations

    adjusted: list[tuple[int, float]] = []
    for item_id, score in recommendations:
        title = (state.title_lookup or {}).get(item_id, "")
        family = _title_family_tokens(title)
        family_score = max((_family_prefix_score(src, family) for src in positive_families), default=0.0)
        adjusted.append((item_id, float(score) + boost * family_score))
    adjusted.sort(key=lambda pair: pair[1], reverse=True)
    return adjusted


def _genre_set_from_new_item(item: CatalogNewItem) -> set[str]:
    out: set[str] = set()
    for value in (item.genres, item.tags):
        for part in re.split(r"[|,]", value or ""):
            part = part.strip().lower()
            if part:
                out.add(part)
    return out


def _candidate_ids_for_loaded_index() -> torch.Tensor:
    """Use the loaded item_index length, not only the model embedding table length."""
    if state.item_index is None:
        return torch.empty(0, dtype=torch.long)
    return torch.arange(1, state.item_index.size(0), dtype=torch.long)


def _expand_model_for_hot_item(model: CLEPIDTN, new_max_idx: int, domain_ids_map: dict[int, int]) -> None:
    """Grow model lookup tables for a batch of hot-added items in one pass.

    Args:
        model:          The live CLEPIDTN model.
        new_max_idx:    The highest new item index in this batch.
        domain_ids_map: {item_idx: domain_id (0=movie,1=game)} for every new item.

    All intermediate tensors are built on CPU and moved to the target device in a
    single .to() call — this avoids accumulating CUDA async errors from repeated
    per-item GPU allocations.
    """
    device = model.item_id.weight.device

    # ── item_id embedding ────────────────────────────────────────────────────
    old_emb = model.item_id
    if new_max_idx >= old_emb.num_embeddings:
        new_emb = nn.Embedding(new_max_idx + 1, old_emb.embedding_dim, padding_idx=PAD)
        with torch.no_grad():
            new_emb.weight.zero_()
            new_emb.weight[: old_emb.num_embeddings].copy_(old_emb.weight.data.cpu())
        model.item_id = new_emb.to(device)

    # ── item_token_ids ───────────────────────────────────────────────────────
    if new_max_idx >= model.item_token_ids.size(0):
        extra = new_max_idx + 1 - model.item_token_ids.size(0)
        pad_rows = torch.zeros(
            (extra, model.item_token_ids.size(1)),
            dtype=model.item_token_ids.dtype,
        )
        model.item_token_ids = torch.cat(
            [model.item_token_ids.cpu(), pad_rows], dim=0
        ).to(device)

    # ── item_domain_ids ──────────────────────────────────────────────────────
    if new_max_idx >= model.item_domain_ids.size(0):
        extra = new_max_idx + 1 - model.item_domain_ids.size(0)
        # Default 0 (movie); will be overwritten per-item below.
        pad_domains = torch.zeros(extra, dtype=model.item_domain_ids.dtype)
        model.item_domain_ids = torch.cat(
            [model.item_domain_ids.cpu(), pad_domains], dim=0
        ).to(device)

    for idx, domain_id in domain_ids_map.items():
        model.item_domain_ids[idx] = domain_id


def _encode_catalog_text(items: list[CatalogNewItem]) -> torch.Tensor | None:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        return None
    # Always encode on CPU — the main CUDA context may be in an error state
    # from a stale device-side assert, and loading a second model to the same
    # GPU device would surface that error here and crash the server.
    encoder = SentenceTransformer(CONFIG["text_encoder_model"], device="cpu")
    texts = [
        f"{item.title}. {item.description} {item.genres} {item.tags}".strip()
        for item in items
    ]
    emb = encoder.encode(texts, normalize_embeddings=True, convert_to_numpy=True)
    return torch.tensor(emb, dtype=torch.float32)


def _resolve_rating_item(item: RatingItem) -> tuple[int, float] | None:
    """Resolve a single RatingItem to (model_item_id, weight).

    Returns None if the item can't be resolved.
    """
    # Determine weight
    weight: float
    if item.source == "wishlist":
        weight = _LABEL_WEIGHTS.get("Didn't watch but would watch", 0.25)
    elif item.source == "ignore":
        weight = _LABEL_WEIGHTS.get("Didn't watch and wouldn't watch", -0.75)
    elif item.rating is not None:
        weight = _LABEL_WEIGHTS.get(item.rating, 0.0)
    elif item.stars is not None:
        weight = _stars_to_weight(item.stars)
    else:
        # No rating info at all — treat as mild positive
        weight = 0.25

    item_key = _parse_item_key(item.item_id, item.type)
    if item_key is None:
        return None

    model_idx = state.item_to_idx.get(item_key)
    if model_idx is None:
        return None

    return model_idx, weight


def _resolve_user_profile(
    profile: UserProfile,
) -> tuple[list[int], list[float]]:
    """Convert a UserProfile's ratings into (history_ids, weights)."""
    history_ids: list[int] = []
    weights: list[float] = []
    for item in profile.ratings:
        result = _resolve_rating_item(item)
        if result is not None:
            history_ids.append(result[0])
            weights.append(result[1])
    return history_ids, weights


def _format_recommendation(
    item_id: int,
    score: float,
) -> RecommendationItem:
    """Map a model item_id + score into a response item."""
    item_key = state.idx_to_key.get(item_id, "")
    domain_part, _, _ = item_key.partition(":")
    title = (state.title_lookup or {}).get(item_id, item_key)
    provider_ids = (state.provider_id_lookup or {}).get(item_id, {})
    provider_item_id = (
        provider_ids.get("tmdb_id")
        if domain_part == "movie"
        else provider_ids.get("rawg_id")
        if domain_part == "game"
        else None
    )
    return RecommendationItem(
        item_id=provider_item_id,
        item_key=item_key,
        title=title,
        domain=domain_part if domain_part in {"movie", "game"} else "movie",
        score=round(float(score), 6),
    )


def _normalize_blocked(blocked_genres: list[str] | None) -> set[str]:
    """Return a lowercased set of blocked genres/tags."""
    if not blocked_genres:
        return set()
    return {g.strip().lower() for g in blocked_genres if g.strip()}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["Meta"])
def health():
    """Health check — verify the model is loaded before sending requests."""
    with state.lock:
        return HealthResponse(
            status="ok",
            model_loaded=state.model is not None,
            n_items=len(state.item_to_idx) if state.item_to_idx else 0,
            n_genres_tracked=len(state.item_genre_lookup) if state.item_genre_lookup else 0,
            text_index_loaded=state.text_index is not None,
            model_version=CONFIG["model_version"],
            hot_added_count=state.hot_added_count,
        )


@app.get("/genres", tags=["Meta"], summary="List all genres available for blocking")
def list_genres():
    """Return all unique genres/tags in the catalog (lowercased).

    Use this to populate the parental-controls UI.
    """
    if not state.item_genre_lookup:
        return {"genres": []}
    all_genres: set[str] = set()
    for genres in state.item_genre_lookup.values():
        all_genres.update(genres)
    # Return sorted, keeping only meaningful genre-like tokens (len > 2)
    return {"genres": sorted(g for g in all_genres if len(g) > 2)}


@app.post(
    "/admin/reload",
    response_model=ReloadResponse,
    tags=["Admin"],
    summary="Reload model artifacts from disk",
)
def reload_artifacts():
    """Reload all on-disk artifacts. Runtime hot-added items are intentionally cleared."""
    _load_artifacts()
    return ReloadResponse(
        status="ok",
        n_items=len(state.item_to_idx) if state.item_to_idx else 0,
        text_index_loaded=state.text_index is not None,
        hot_added_count=state.hot_added_count,
    )


@app.post(
    "/catalog/add",
    response_model=CatalogAddResponse,
    tags=["Catalog"],
    summary="Hot-add cold-start catalog items at runtime",
)
def add_catalog_items(request: CatalogAddRequest):
    """Register new catalog items without retraining.

    Hot-added items receive zero learned embeddings, but can rank through text
    similarity when `sentence-transformers` is installed and text embeddings are
    loaded. They are runtime-only; use `/admin/reload` or restart to return to
    the persisted artifact state.
    """
    _require_model()

    added: list[str] = []
    already_exists: list[str] = []
    failed: dict[str, str] = {}
    items_to_encode: list[CatalogNewItem] = []
    ids_to_encode: list[int] = []

    with state.lock:
        if state.item_to_idx is None or state.idx_to_key is None:
            raise HTTPException(status_code=503, detail="Catalog mappings not loaded.")
        if state.item_index is None or state.model is None:
            raise HTTPException(status_code=503, detail="Model index not loaded.")

        next_idx = max(state.idx_to_key.keys(), default=0) + 1

        # Collect the highest new index and domain mapping for a single batch
        # expansion after the loop (avoids repeated GPU alloc/cat per item).
        new_max_idx: int = -1
        domain_ids_map: dict[int, int] = {}
        new_meta_rows: list[dict] = []

        for item in request.items:
            item_key = _parse_item_key(item.item_id, item.domain)
            if item_key is None:
                failed[item.item_id] = "Invalid item_id. Expected movie/game with '_' or ':'."
                continue
            domain, _, _ = item_key.partition(":")
            if item_key in state.item_to_idx:
                already_exists.append(item_key)
                continue

            new_idx = next_idx
            next_idx += 1

            state.item_to_idx[item_key] = new_idx
            state.idx_to_key[new_idx] = item_key
            if state.title_lookup is None:
                state.title_lookup = {}
            state.title_lookup[new_idx] = item.title
            new_max_idx = max(new_max_idx, new_idx)
            domain_ids_map[new_idx] = 0 if domain == "movie" else 1

            if state.item_genre_lookup is None:
                state.item_genre_lookup = {}
            genres = _genre_set_from_new_item(item)
            tokens = _catalog_tokens(item.genres, item.tags, item.title, item.description)
            for tok in tokens.split()[:20]:
                genres.add(tok)
            state.item_genre_lookup[new_idx] = genres
            if state.provider_id_lookup is None:
                state.provider_id_lookup = {}
            state.provider_id_lookup[new_idx] = {
                "tmdb_id": item.provider_id if domain == "movie" else None,
                "rawg_id": item.provider_id if domain == "game" else None,
            }

            new_row = {
                "item_key": item_key,
                "title": item.title,
                "domain": domain,
                "tokens": tokens,
                "user_reviews": 0,
                "description": item.description,
                "tmdb_id": pd.NA,
                "rawg_id": pd.NA,
                "hf_genres": item.genres,
                "hf_tags": item.tags,
            }
            if domain == "movie" and item.provider_id is not None:
                new_row["tmdb_id"] = item.provider_id
            if domain == "game" and item.provider_id is not None:
                new_row["rawg_id"] = item.provider_id
            new_meta_rows.append(new_row)

            if state.text_index is not None:
                items_to_encode.append(item)
                ids_to_encode.append(new_idx)
            added.append(item_key)

        # ── Single-pass tensor expansion for all newly added items ────────
        # Build on CPU then move to device in one .to() call — prevents CUDA
        # async errors from accumulating across per-item GPU allocations.
        if new_max_idx >= 0:
            _device = state.item_index.device

            try:
                if new_max_idx >= state.item_index.size(0):
                    needed = new_max_idx + 1 - state.item_index.size(0)
                    zero_vecs = torch.zeros(
                        (needed, state.item_index.size(1)),
                        dtype=state.item_index.dtype,
                    )
                    state.item_index = torch.cat(
                        [state.item_index.cpu(), zero_vecs], dim=0
                    ).to(_device)
            except RuntimeError as _exc:
                # A stale CUDA async error from a previous request can surface
                # here on the first .to(device) call.  The catalog state is still
                # valid on CPU; the items will score with zero embeddings and
                # the rerank bounds-guard will keep them out of the CUDA forward.
                print(
                    f"Warning: item_index GPU expansion failed (max_idx={new_max_idx}): {_exc}\n"
                    "Catalog entries are registered; they will be skipped by rerank."
                )

            try:
                _expand_model_for_hot_item(state.model, new_max_idx, domain_ids_map)
            except RuntimeError as _exc:
                print(
                    f"Warning: GPU model expansion failed for hot-add batch "
                    f"(max_idx={new_max_idx}): {_exc}\n"
                    "Items are registered in catalog but will score with zero embeddings."
                )

            if state.text_index is not None and new_max_idx >= state.text_index.size(0):
                try:
                    needed = new_max_idx + 1 - state.text_index.size(0)
                    zero_text = torch.zeros(
                        (needed, state.text_index.size(1)),
                        dtype=state.text_index.dtype,
                    )
                    state.text_index = torch.cat(
                        [state.text_index.cpu(), zero_text], dim=0
                    ).to(_device)
                except RuntimeError as _exc:
                    print(f"Warning: text_index GPU expansion failed: {_exc}")

        # Bulk pandas concat — one allocation for the entire batch instead of
        # one per item (O(N²) → O(N)).
        if new_meta_rows:
            state.item_meta = pd.concat(
                [state.item_meta, pd.DataFrame(new_meta_rows)],
                ignore_index=True,
                sort=False,
            )

        state.hot_added_count += len(added)

    text_index_updated = False
    if items_to_encode:
        try:
            encoded = _encode_catalog_text(items_to_encode)
        except Exception as _enc_exc:
            print(f"Warning: text encoding failed, skipping text index update: {_enc_exc}")
            encoded = None
        if encoded is not None:
            try:
                with state.lock:
                    if state.text_index is not None:
                        if encoded.size(1) != state.text_index.size(1):
                            for item_key in added:
                                failed[item_key] = "Text encoder dimension did not match loaded text index."
                        else:
                            needed = max(ids_to_encode) + 1 - state.text_index.size(0)
                            if needed > 0:
                                pad = torch.zeros(
                                    (needed, state.text_index.size(1)),
                                    dtype=state.text_index.dtype,
                                )
                                state.text_index = torch.cat([state.text_index, pad], dim=0)
                            state.text_index[ids_to_encode] = encoded.to(state.text_index.dtype)
                            text_index_updated = True
            except Exception as _tidx_exc:
                print(f"Warning: text index write failed: {_tidx_exc}")

    return CatalogAddResponse(
        added=added,
        already_exists=already_exists,
        failed=failed,
        n_items=len(state.item_to_idx) if state.item_to_idx else 0,
        text_index_updated=text_index_updated,
    )


@app.post(
    "/recommend",
    response_model=RecommendResponse,
    tags=["Recommendations"],
    summary="Get personalised recommendations with pagination & parental controls",
)
def recommend(request: RecommendRequest):
    """Accept a user profile and return personalised, genre-filtered recommendations.

    - Supports survey labels, numeric stars, and wishlist/ignore signals.
    - `blocked_genres` removes items matching any blocked genre/tag (case-insensitive).
    - The API guarantees exactly `k` results (or fewer if the catalog is exhausted),
      AFTER genre filtering.
    - Use `offset` for pagination: page 1 = offset 0, page 2 = offset k, etc.
    """
    _require_model()

    blocked = _normalize_blocked(request.blocked_genres)
    desired_total = request.offset + request.k
    multiplier = CONFIG["overfetch_multiplier"] if blocked else 1
    fetch_k = min(max(desired_total * multiplier, desired_total + 1), CONFIG["max_recs"] * multiplier)

    # Hold the lock for the entire inference block.  /catalog/add swaps tensors
    # and model attributes (state.item_index, model.item_id, …) under the same
    # lock; reading them concurrently without the lock risks shape-mismatch
    # crashes from a mid-swap read.  A read-write lock is the next step if this
    # becomes a throughput bottleneck.
    with state.lock:
        # Resolve user ratings
        history_ids, weights = _resolve_user_profile(request.user)
        if not history_ids:
            raise HTTPException(
                status_code=422,
                detail="None of the provided items are in the model catalog.",
            )

        try:
            raw_recs = recommend_from_history(
                state.model,
                state.item_index,
                history_ids,
                user_id=None,
                activity=len(history_ids),
                cfg=state.cfg,
                k=fetch_k,
                domain=request.domain,
                text_index=state.text_index,
                history_weights=weights,
                candidate_item_ids=_candidate_ids_for_loaded_index(),
            )
            title_family_ids = _title_family_candidates(history_ids, weights, request.domain)
            if title_family_ids:
                candidate_ids = sorted({item_id for item_id, _ in raw_recs}.union(title_family_ids))
                raw_recs = recommend_from_history(
                    state.model,
                    state.item_index,
                    history_ids,
                    user_id=None,
                    activity=len(history_ids),
                    cfg=state.cfg,
                    k=len(candidate_ids),
                    domain=request.domain,
                    text_index=state.text_index,
                    history_weights=weights,
                    candidate_item_ids=torch.tensor(candidate_ids, dtype=torch.long),
                )
                raw_recs = _apply_title_family_boost(raw_recs, history_ids, weights)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        # Apply genre blocking
        if blocked:
            filtered = _filter_blocked_genres(raw_recs, blocked, state.item_genre_lookup)
        else:
            filtered = raw_recs

        # Pagination: slice [offset : offset + k]
        total_available = len(filtered)
        page = filtered[request.offset : request.offset + request.k]
        results = [_format_recommendation(item_id, score) for item_id, score in page]

    return RecommendResponse(
        count=len(results),
        total_available=total_available,
        domain=request.domain,
        offset=request.offset,
        k=request.k,
        recommendations=results,
        signals_used=len(history_ids),
        blocked_genres=sorted(blocked) if blocked else [],
        model_version=CONFIG["model_version"],
        has_more=(request.offset + request.k) < total_available,
    )


@app.post(
    "/recommend/rerank",
    response_model=RerankResponse,
    tags=["RAG Tool"],
    summary="Re-rank a RAG-fetched candidate list using the recommender model",
)
def rerank(request: RerankRequest):
    """Score and re-rank a list of externally-fetched items using the user's profile.

    Use this as a tool in your RAG pipeline:
    1. Your RAG retrieves a broad list of candidate items.
    2. POST them here with the user's profile.
    3. The recommender scores each candidate against the user and returns them
       ranked by personalised relevance, with blocked genres filtered out.
    """
    _require_model()

    # Same lock rationale as /recommend: /catalog/add swaps model attributes and
    # tensor references under state.lock; inference must hold the same lock to
    # avoid reading a half-swapped tensor.
    with state.lock:
        # Resolve user ratings
        history_ids, weights = _resolve_user_profile(request.user)
        if not history_ids:
            raise HTTPException(
                status_code=422,
                detail="None of the user's items are in the model catalog.",
            )

        # Resolve candidate items to model IDs
        candidate_model_ids: list[int] = []
        candidate_map: dict[int, CandidateItem] = {}
        for candidate in request.candidate_items:
            item_key = _parse_item_key(candidate.item_id)
            if item_key is None:
                continue
            model_idx = state.item_to_idx.get(item_key)
            if model_idx is not None:
                candidate_model_ids.append(model_idx)
                candidate_map[model_idx] = candidate

        if not candidate_model_ids:
            raise HTTPException(
                status_code=422,
                detail="None of the candidate items are in the model catalog.",
            )

        # Remove candidates that are already in the user's history
        history_set = set(history_ids)
        candidate_model_ids = [c for c in candidate_model_ids if c not in history_set]

        if not candidate_model_ids:
            raise HTTPException(
                status_code=422,
                detail="All candidate items are already in the user's history.",
            )

        # Clamp to the safe scoring range.
        # Hot-added items whose index exceeds the trained embedding bounds have zero
        # learned vectors and — more critically — would trigger a CUDA device-side
        # assert inside item_features() because the embedding kernel asserts
        # 0 <= idx < num_embeddings.  We skip them here; they remain in the catalog
        # and Gemini/RAG still sees their FAISS similarity scores.
        n_safe = min(
            state.model.item_id.num_embeddings,
            state.model.item_token_ids.size(0),
            state.model.item_domain_ids.size(0),
            state.item_index.size(0),
        )
        scoreable = [mid for mid in candidate_model_ids if mid < n_safe]
        unscoreable = [mid for mid in candidate_model_ids if mid >= n_safe]

        if unscoreable:
            print(
                f"Rerank: {len(unscoreable)} hot-added candidates skipped "
                f"(indices {min(unscoreable)}–{max(unscoreable)} beyond safe "
                f"range {n_safe}). They will use FAISS scores."
            )

        if not scoreable:
            # All candidates are hot-added items — return empty so RAG falls back
            # to raw FAISS scores rather than crashing.
            return RerankResponse(
                count=0,
                recommendations=[],
                signals_used=len(history_ids),
                candidates_submitted=len(request.candidate_items),
                candidates_matched=len(candidate_map),
                blocked_genres=[],
                model_version=CONFIG["model_version"],
            )

        # Bounds-check history too.  recommend_from_history passes history_ids
        # to model.item_features() on the same CUDA path as candidates — an
        # out-of-range history index (e.g. user rated a hot-added item) poisons
        # the CUDA context just as badly as an out-of-range candidate would.
        safe_hist = [(h, w) for h, w in zip(history_ids, weights) if h < n_safe]
        if not safe_hist:
            return RerankResponse(
                count=0,
                recommendations=[],
                signals_used=0,
                candidates_submitted=len(request.candidate_items),
                candidates_matched=len(candidate_map),
                blocked_genres=[],
                model_version=CONFIG["model_version"],
            )
        history_ids = [h for h, w in safe_hist]
        weights = [w for h, w in safe_hist]

        # Score candidates using the model
        candidate_tensor = torch.tensor(
            sorted(set(scoreable)), dtype=torch.long,
        )

        try:
            scored = recommend_from_history(
                state.model,
                state.item_index,
                history_ids,
                user_id=None,
                activity=len(history_ids),
                cfg=state.cfg,
                k=len(candidate_tensor),
                domain=None,  # don't domain-filter — candidates are already curated
                text_index=state.text_index,
                history_weights=weights,
                candidate_item_ids=candidate_tensor,
            )
        except (ValueError, RuntimeError) as exc:
            if "CUDA" in str(exc) or "device-side" in str(exc):
                # A stale CUDA async error surfaced during scoring.
                # Return empty so RAG falls back to FAISS scores rather than crash.
                print(f"Rerank: CUDA error during model scoring, falling back to FAISS. {exc}")
                return RerankResponse(
                    count=0,
                    recommendations=[],
                    signals_used=len(history_ids),
                    candidates_submitted=len(request.candidate_items),
                    candidates_matched=len(candidate_map),
                    blocked_genres=[],
                    model_version=CONFIG["model_version"],
                )
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        # Apply genre blocking
        blocked = _normalize_blocked(request.blocked_genres)
        if blocked:
            scored = _filter_blocked_genres(scored, blocked, state.item_genre_lookup)

        # Limit results
        if request.k is not None:
            scored = scored[: request.k]

        results = [_format_recommendation(item_id, score) for item_id, score in scored]

    return RerankResponse(
        count=len(results),
        recommendations=results,
        signals_used=len(history_ids),
        candidates_submitted=len(request.candidate_items),
        candidates_matched=len(candidate_map),
        blocked_genres=sorted(blocked) if blocked else [],
        model_version=CONFIG["model_version"],
    )
