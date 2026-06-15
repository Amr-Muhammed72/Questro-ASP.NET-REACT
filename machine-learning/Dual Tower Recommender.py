from __future__ import annotations

import math
import os
import random
import re
import time
import zipfile
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, Dataset
from tqdm.auto import tqdm


PAD = 0

_METADATA_STOP_WORDS = frozenset({
    "the", "and", "for", "with", "from", "that", "this", "your", "you",
    "game", "movie", "film", "very", "positive", "mostly", "mixed",
    "win", "steam", "deck",
})


@dataclass
class RecConfig:
    movielens_zip: str = "ml-32m.zip"
    steam_zip: str = "archive (11).zip"
    max_seq_len: int = 30
    min_movie_rating: float = 3.5
    min_steam_hours: float = 1.0
    max_movielens_rows: int | None = 2_000_000
    max_steam_rows: int | None = 2_000_000
    max_train_samples: int = 1_000_000
    min_user_events: int = 4
    min_item_interactions: int = 5
    embedding_dim: int = 128
    transformer_layers: int = 5
    attention_heads: int = 4
    dropout: float = 0.15
    batch_size: int = 512
    epochs: int = 10
    lr: float = 2e-3
    temperature: float = 0.07
    contrastive_weight: float = 0.15
    amm_weight: float = 0.01
    gradient_clip_norm: float = 1.0
    use_causal_attention: bool = False
    hf_cache_dir: str = "hf_cache"
    hf_home_dir: str = "hf_home"
    survey_csv: str = "users_ratings.csv"
    device: str = "cuda" if torch.cuda.is_available() else "cpu"


def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def _read_csv_from_zip(zip_path: str | Path, member: str, **kwargs) -> pd.DataFrame:
    with zipfile.ZipFile(zip_path) as zf:
        with zf.open(member) as fh:
            return pd.read_csv(fh, **kwargs)


def load_movielens(cfg: RecConfig) -> tuple[pd.DataFrame, pd.DataFrame]:
    ratings = _read_csv_from_zip(
        cfg.movielens_zip,
        "ml-32m/ratings.csv",
        usecols=["userId", "movieId", "rating", "timestamp"],
        nrows=cfg.max_movielens_rows,
    )
    ratings = ratings.loc[ratings["rating"] >= cfg.min_movie_rating].copy()
    ratings["user_key"] = "ml:" + ratings["userId"].astype(str)
    ratings["item_key"] = "movie:" + ratings["movieId"].astype(str)
    ratings["domain"] = "movie"
    interactions = ratings[["user_key", "item_key", "timestamp", "domain"]]

    movies = _read_csv_from_zip(cfg.movielens_zip, "ml-32m/movies.csv")
    links = _read_csv_from_zip(cfg.movielens_zip, "ml-32m/links.csv", usecols=["movieId", "tmdbId"])
    movies = movies.merge(links, on="movieId", how="left")
    tags = _read_movielens_tags(cfg.movielens_zip)
    movies = movies.merge(tags, on="movieId", how="left")
    movies["item_key"] = "movie:" + movies["movieId"].astype(str)
    movies["domain"] = "movie"
    movies["user_reviews"] = np.nan
    movies["tmdb_id"] = movies["tmdbId"].astype("Int64")
    if "is_adult" not in movies.columns:
        movies["is_adult"] = False
    movies["is_adult"] = movies["is_adult"].fillna(False).astype(bool)
    movies["tokens"] = (
        movies["genres"].fillna("").str.replace("|", " ", regex=False)
        + " "
        + movies["genres"].fillna("").map(_movie_genre_bridge_tokens)
        + " "
        + movies["tag_tokens"].fillna("")
        + " "
        + movies["title"].fillna("").map(_title_tokens)
    )
    movies["description"] = ""
    items = movies[["item_key", "title", "domain", "tokens", "user_reviews", "description", "tmdb_id", "is_adult"]]
    return interactions, items


def load_steam(cfg: RecConfig) -> tuple[pd.DataFrame, pd.DataFrame]:
    recs = _read_csv_from_zip(
        cfg.steam_zip,
        "recommendations.csv",
        usecols=["app_id", "is_recommended", "hours", "user_id", "date"],
        nrows=cfg.max_steam_rows,
    )
    recs = recs.loc[recs["is_recommended"].astype(str).str.lower().eq("true")].copy()
    # Filter out low-engagement recommendations (< min_steam_hours played)
    recs["hours"] = pd.to_numeric(recs["hours"], errors="coerce").fillna(0)
    recs = recs.loc[recs["hours"] >= cfg.min_steam_hours]
    recs["timestamp"] = pd.to_datetime(recs["date"], errors="coerce").astype("int64") // 10**9
    recs["timestamp"] = recs["timestamp"].fillna(0).astype("int64")
    recs["user_key"] = "steam:" + recs["user_id"].astype(str)
    recs["item_key"] = "game:" + recs["app_id"].astype(str)
    recs["domain"] = "game"
    interactions = recs[["user_key", "item_key", "timestamp", "domain"]]

    games = _read_csv_from_zip(cfg.steam_zip, "games.csv")
    if 'positive' in games.columns and 'negative' in games.columns:
        total_reviews = pd.to_numeric(games['positive'], errors='coerce').fillna(0) + pd.to_numeric(games['negative'], errors='coerce').fillna(0)
        games = games[total_reviews >= 5]
    elif 'recommendations' in games.columns:
        games = games[pd.to_numeric(games['recommendations'], errors='coerce').fillna(0) >= 5]

    game_meta = _read_steam_metadata(cfg.steam_zip)
    if not game_meta.empty:
        games = games.merge(game_meta, on="app_id", how="left")
    else:
        games["tag_tokens"] = ""
        games["description"] = ""
    games["item_key"] = "game:" + games["app_id"].astype(str)
    games["domain"] = "game"
    games["tmdb_id"] = pd.NA
    for _col in ("win", "mac", "linux", "steam_deck"):
        if _col not in games.columns:
            games[_col] = False
    if "user_reviews" not in games.columns:
        games["user_reviews"] = np.nan
    if "is_adult" not in games.columns:
        games["is_adult"] = False
    games["is_adult"] = games["is_adult"].fillna(False).astype(bool)
    platform_tokens = (
        pd.Series(np.where(games["win"].fillna(False).astype(bool), " win", ""), index=games.index)
        + np.where(games["mac"].fillna(False).astype(bool), " mac", "")
        + np.where(games["linux"].fillna(False).astype(bool), " linux", "")
        + np.where(games["steam_deck"].fillna(False).astype(bool), " steam_deck", "")
    )
    games["tokens"] = (
        games["tag_tokens"].fillna("")
        + " "
        + games["description"].fillna("").map(lambda x: _text_tokens(x, limit=60))
        + " "
        + games["rating"].fillna("").astype(str).map(_text_tokens)
        + " "
        + games["positive_ratio"].fillna(0).astype(int).map(lambda x: f"posratio_{x // 10}")
        + platform_tokens
        + " "
        + games["title"].fillna("").map(_title_tokens)
    )
    items = games[["item_key", "title", "domain", "tokens", "user_reviews", "description", "tmdb_id", "is_adult"]]
    return interactions, items


def configure_hf_cache(hf_cache_dir: str | Path = "hf_cache", hf_home_dir: str | Path = "hf_home") -> None:
    """Point Hugging Face libraries at the project-local caches."""
    os.environ["HF_DATASETS_CACHE"] = str(Path(hf_cache_dir).resolve())
    os.environ["HF_HOME"] = str(Path(hf_home_dir).resolve())


def _find_cached_arrow(cache_dir: str | Path, dataset_fragment: str, filename: str) -> Path:
    cache = Path(cache_dir)
    # Try exact filename under the dataset directory first
    matches = list(cache.glob(f"**/*{dataset_fragment}*/**/{filename}"))
    if not matches:
        matches = list(cache.glob(f"**/{filename}"))
    if not matches:
        # Fallback: find any train arrow file under a directory matching the dataset
        matches = list(cache.glob(f"**/*{dataset_fragment}*/**/*train*.arrow"))
    if not matches:
        raise FileNotFoundError(
            f"Could not find {filename!r} (or any train arrow) for "
            f"{dataset_fragment!r} under {cache_dir!s}. "
            f"Run download_tmdb_hf_dataset() first."
        )
    return matches[0]


def _normalize_catalog_title(value: str) -> str:
    value = re.sub(r"\((?:19|20)\d{2}\)\s*$", "", str(value))
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _title_year(value: str) -> int | None:
    match = re.search(r"\((19\d{2}|20\d{2})\)\s*$", str(value))
    return int(match.group(1)) if match else None


def _pipe_text(value) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    return _text_tokens(str(value).replace("|", " ").replace(",", " "))


def download_tmdb_hf_dataset(cache_dir: str | Path = "hf_cache") -> None:
    """Download ada-datadruids/full_tmdb_movies_dataset to the local HF cache.

    Only needs to run once.  Safe to call again — HF caching is idempotent.

    Requires: ``pip install datasets``
    """
    try:
        from datasets import load_dataset
    except ImportError as exc:
        raise RuntimeError("Install `datasets` first: pip install datasets") from exc

    cache_dir = Path(cache_dir).resolve()
    cache_dir.mkdir(parents=True, exist_ok=True)
    os.environ["HF_DATASETS_CACHE"] = str(cache_dir)
    os.environ["HF_HOME"] = str(cache_dir)

    print("[tmdb] downloading ada-datadruids/full_tmdb_movies_dataset …")
    load_dataset("ada-datadruids/full_tmdb_movies_dataset", split="train", cache_dir=str(cache_dir))
    print("[tmdb] download complete.")


def load_cached_hf_movies(cfg: RecConfig) -> pd.DataFrame:
    """Load the cached ada-datadruids/full_tmdb_movies_dataset Arrow file.

    Columns used from the dataset
    -----------------------------
    id              - TMDB movie ID (int64)
    title           - movie title
    overview        - plot description
    genres          - pipe- or comma-separated genre string
    keywords        - comma-separated keyword string
    tagline         - short marketing tagline
    vote_count      - number of votes
    vote_average    - average rating (0-10)
    popularity      - TMDB popularity score
    poster_path     - relative poster URL path
    release_date    - release date string (YYYY-MM-DD)
    """
    configure_hf_cache(cfg.hf_cache_dir, cfg.hf_home_dir)
    try:
        from datasets import Dataset
    except ImportError as exc:
        raise RuntimeError("Install `datasets` to read the local Hugging Face Arrow cache.") from exc
    arrow = _find_cached_arrow(
        cfg.hf_cache_dir,
        "ada-datadruids___full_tmdb_movies_dataset",
        "full_tmdb_movies_dataset-train.arrow",
    )
    columns = [
        "id",
        "title",
        "overview",
        "genres",
        "keywords",
        "tagline",
        "vote_count",
        "vote_average",
        "popularity",
        "poster_path",
        "release_date",
        "original_language",
        "adult",
    ]
    ds = Dataset.from_file(str(arrow))
    fetch_cols = [c for c in columns if c in ds.column_names]
    frame = ds.select_columns(fetch_cols).to_pandas()
    frame["tmdb_id"] = pd.to_numeric(frame["id"], errors="coerce").astype("Int64")
    frame["match_title"] = frame["title"].map(_normalize_catalog_title)
    frame["match_year"] = pd.to_datetime(frame["release_date"], errors="coerce").dt.year.astype("Int64")
    frame["vote_count"] = pd.to_numeric(frame.get("vote_count"), errors="coerce")
    frame = frame[frame["vote_count"].fillna(0) >= 5]
    frame["vote_average"] = pd.to_numeric(frame.get("vote_average"), errors="coerce")

    adult_themes = frame.get('genres', '').astype(str).fillna('') + ", " + frame.get('keywords', '').astype(str).fillna('')
    adult_themes = adult_themes.str.contains(r'\b(NSFW|Nudity|Sexual Content|Adult|sex)\b', case=False, na=False)
    frame["hf_is_adult"] = frame.get("adult", pd.Series(False, index=frame.index)).fillna(False).astype(bool) | adult_themes

    frame = frame.sort_values(["vote_count", "popularity"], ascending=False, na_position="last")
    return frame.drop_duplicates(["match_title", "match_year"])


def load_cached_hf_rawg(cfg: RecConfig) -> pd.DataFrame:
    """Load useful RAWG fields from the cached Arrow file using memory mapping."""
    configure_hf_cache(cfg.hf_cache_dir, cfg.hf_home_dir)
    try:
        from datasets import Dataset
    except ImportError as exc:
        raise RuntimeError("Install `datasets` to read the local Hugging Face Arrow cache.") from exc
    arrow = _find_cached_arrow(
        cfg.hf_cache_dir,
        "atalaydenknalbant___rawg-games-dataset",
        "rawg-games-dataset-train.arrow",
    )
    columns = [
        "id",
        "name",
        "released",
        "rating",
        "ratings_count",
        "reviews_count",
        "metacritic",
        "platforms",
        "developers",
        "genres",
        "tags",
        "publishers",
        "description_raw",
        "background_image",
        "stores",
        "esrb_rating",
    ]
    ds = Dataset.from_file(str(arrow))
    fetch_cols = [c for c in columns if c in ds.column_names]
    frame = ds.select_columns(fetch_cols).to_pandas()
    
    if "stores" in frame.columns:
        frame = frame[~frame["stores"].astype(str).str.contains("itch.io", case=False, na=False)]
        
    if "ratings_count" in frame.columns:
        frame["ratings_count"] = pd.to_numeric(frame["ratings_count"], errors="coerce")
        frame = frame[frame["ratings_count"].fillna(0) >= 5]
    elif "reviews_count" in frame.columns:
        frame["reviews_count"] = pd.to_numeric(frame["reviews_count"], errors="coerce")
        frame = frame[frame["reviews_count"].fillna(0) >= 5]

    adult_tags = frame.get("tags", "").astype(str).str.contains(r'\b(NSFW|Nudity|Sexual Content|Adult|sex)\b', case=False, na=False)
    mature_esrb = frame.get("esrb_rating", "").astype(str).str.contains(r'\b(Adults Only|Mature)\b', case=False, na=False)
    frame["hf_is_adult"] = mature_esrb | adult_tags

    frame["match_title"] = frame["name"].map(_normalize_catalog_title)
    frame["match_year"] = pd.to_datetime(frame["released"], errors="coerce").dt.year.astype("Int64")
    if "ratings_count" in frame.columns:
        frame = frame.sort_values("ratings_count", ascending=False, na_position="last")
    return frame.drop_duplicates("match_title")


def enrich_item_metadata_from_hf_cache(
    item_meta: pd.DataFrame,
    cfg: RecConfig,
) -> tuple[pd.DataFrame, dict[str, int]]:
    """Enrich MovieLens and Steam metadata from the two local HF datasets.

    Movie rows are joined on normalized title and release year. RAWG does not
    expose Steam app IDs in this cache, so games use a conservative exact
    normalized-title join and retain Steam's interaction/popularity fields.
    """
    out = item_meta.copy()
    out["match_title"] = out["title"].map(_normalize_catalog_title)
    out["match_year"] = out["title"].map(_title_year).astype("Int64")

    movies = load_cached_hf_movies(cfg).rename(
        columns={
            "overview":      "hf_description",
            "genres":        "hf_genres",
            "keywords":      "hf_keywords",
            "tagline":       "hf_tagline",
            "vote_count":    "hf_vote_count",
            "vote_average":  "hf_vote_average",
            "poster_path":   "poster_url",
            "tmdb_id":       "hf_tmdb_id",
        }
    )
    movie_columns = [
        "match_title",
        "match_year",
        "hf_description",
        "hf_genres",
        "hf_keywords",
        "hf_tagline",
        "hf_vote_count",
        "hf_vote_average",
        "poster_url",
        "hf_tmdb_id",
        "hf_is_adult",
    ]
    movie_rows = out["domain"].eq("movie")
    enriched_movies = out.loc[movie_rows].merge(movies[movie_columns], on=["match_title", "match_year"], how="left")
    # Back-fill tmdb_id from HF dataset where MovieLens links.csv had no entry
    if "hf_tmdb_id" in enriched_movies.columns:
        enriched_movies["tmdb_id"] = enriched_movies["tmdb_id"].where(
            enriched_movies["tmdb_id"].notna(), enriched_movies["hf_tmdb_id"]
        )
        enriched_movies = enriched_movies.drop(columns=["hf_tmdb_id"], errors="ignore")

    rawg = load_cached_hf_rawg(cfg).rename(
        columns={
            "id": "rawg_id",
            "description_raw": "hf_description",
            "genres": "hf_genres",
            "tags": "hf_tags",
            "developers": "hf_developers",
            "publishers": "hf_publishers",
            "platforms": "hf_platforms",
            "rating": "rawg_rating",
            "ratings_count": "rawg_ratings_count",
            "reviews_count": "rawg_reviews_count",
        }
    )
    rawg_columns = [
        "match_title",
        "rawg_id",
        "hf_description",
        "hf_genres",
        "hf_tags",
        "hf_developers",
        "hf_publishers",
        "hf_platforms",
        "rawg_rating",
        "rawg_ratings_count",
        "rawg_reviews_count",
        "metacritic",
        "background_image",
        "hf_is_adult",
    ]
    game_rows = out["domain"].eq("game")
    enriched_games = out.loc[game_rows].merge(rawg[rawg_columns], on="match_title", how="left")

    other_rows = out.loc[~(movie_rows | game_rows)]
    out = pd.concat([enriched_movies, enriched_games, other_rows], ignore_index=True, sort=False)
    existing_description = out["description"].fillna("").astype(str)
    hf_description = out["hf_description"].fillna("").astype(str)
    out["description"] = existing_description.where(existing_description.str.len() >= hf_description.str.len(), hf_description)
    extra_tokens = (
        out.get("hf_genres",   pd.Series("", index=out.index)).fillna("").map(_pipe_text)
        + " "
        + out.get("hf_keywords", pd.Series("", index=out.index)).fillna("").map(_pipe_text)
        + " "
        + out.get("hf_tags",    pd.Series("", index=out.index)).fillna("").map(_pipe_text)
        + " "
        + out.get("hf_tagline", pd.Series("", index=out.index)).fillna("").map(_pipe_text)
        + " "
        + out.get("hf_developers",  pd.Series("", index=out.index)).fillna("").map(_pipe_text)
        + " "
        + out.get("hf_publishers",  pd.Series("", index=out.index)).fillna("").map(_pipe_text)
        + " "
        + out["description"].map(lambda value: _text_tokens(value, limit=100))
    )
    out["tokens"] = (out["tokens"].fillna("") + " " + extra_tokens).str.strip()
    
    hf_adult = out.get("hf_is_adult", pd.Series(False, index=out.index)).fillna(False).astype(bool)
    if "is_adult" in out.columns:
        out["is_adult"] = out["is_adult"].astype(bool) | hf_adult
    else:
        out["is_adult"] = hf_adult
    out = out.drop(columns=["hf_is_adult"], errors="ignore")

    stats = {
        "movie_rows": int(movie_rows.sum()),
        "movie_matches": int(enriched_movies["hf_description"].notna().sum()),
        "game_rows": int(game_rows.sum()),
        "game_matches": int(enriched_games["rawg_id"].notna().sum()),
    }
    return out.drop(columns=["match_title", "match_year"], errors="ignore"), stats


def _title_tokens(title: str) -> str:
    title = re.sub(r"\(\d{4}\)", "", str(title).lower())
    return " ".join(t for t in re.findall(r"[a-z0-9]+", title) if len(t) > 2)


def _text_tokens(text: str, limit: int | None = None) -> str:
    tokens = [t for t in re.findall(r"[a-z0-9]+", str(text).lower()) if len(t) > 2]
    if limit is not None:
        tokens = tokens[:limit]
    return " ".join(tokens)


def _tag_tokens(tags) -> str:
    if not isinstance(tags, list):
        return ""
    return " ".join(_text_tokens(tag) for tag in tags)


def _read_movielens_tags(zip_path: str | Path, max_tags_per_movie: int = 40) -> pd.DataFrame:
    try:
        tags = _read_csv_from_zip(zip_path, "ml-32m/tags.csv", usecols=["movieId", "tag"])
    except (KeyError, FileNotFoundError):
        return pd.DataFrame(columns=["movieId", "tag_tokens", "is_adult"])
    
    adult_tags = tags["tag"].astype(str).str.contains(r'\b(NSFW|Nudity|Sexual Content|Adult|sex)\b', case=False, na=False)
    is_adult_df = adult_tags.groupby(tags["movieId"]).any().reset_index(name="is_adult")

    tags["tag"] = tags["tag"].fillna("").astype(str).map(_text_tokens)
    tags = tags.loc[tags["tag"].ne("")]
    tags = tags.drop_duplicates(["movieId", "tag"])
    tag_tokens = (
        tags.groupby("movieId")["tag"]
        .apply(lambda values: " ".join(list(values)[:max_tags_per_movie]))
        .reset_index(name="tag_tokens")
    )
    return tag_tokens.merge(is_adult_df, on="movieId", how="left")


def _read_steam_metadata(zip_path: str | Path) -> pd.DataFrame:
    try:
        with zipfile.ZipFile(zip_path) as zf:
            with zf.open("games_metadata.json") as fh:
                meta = pd.read_json(fh, lines=True)
    except (KeyError, FileNotFoundError):
        return pd.DataFrame(columns=["app_id", "tag_tokens", "description", "is_adult"])
    
    adult_tags = meta["tags"].astype(str).str.contains(r'\b(NSFW|Nudity|Sexual Content|Hentai|Adult|sex)\b', case=False, na=False)
    meta["is_adult"] = adult_tags
    
    meta["tag_tokens"] = meta["tags"].map(_tag_tokens).fillna("")
    meta["description"] = meta["description"].fillna("").astype(str)
    return meta[["app_id", "tag_tokens", "description", "is_adult"]]


def _movie_genre_bridge_tokens(genres: str) -> str:
    bridge = {
        "Action": "action combat fast shooter fighting",
        "Adventure": "adventure exploration quest puzzle platformer",
        "Animation": "animation animated cartoony colorful cute family",
        "Children": "family friendly casual cute cozy",
        "Comedy": "funny comedy humorous casual party",
        "Crime": "crime detective mystery noir stealth",
        "Documentary": "documentary educational simulation realistic",
        "Drama": "story rich narrative emotional choices",
        "Fantasy": "fantasy magic rpg adventure mythical",
        "Film-Noir": "noir detective mystery dark",
        "Horror": "horror survival dark atmospheric",
        "Musical": "music rhythm soundtrack",
        "Mystery": "mystery detective puzzle investigation",
        "Romance": "romance emotional story rich dating",
        "Sci-Fi": "sci fi science fiction space futuristic",
        "Thriller": "thriller suspense stealth action",
        "War": "war military strategy tactical",
        "Western": "western open world adventure",
        "IMAX": "cinematic immersive",
    }
    out = []
    for genre in str(genres).split("|"):
        out.append(bridge.get(genre, _text_tokens(genre)))
    return " ".join(out)


def build_public_pretraining_data(
    cfg: RecConfig,
    enrich_from_hf: bool = True,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    ml_inter, ml_items = load_movielens(cfg)
    st_inter, st_items = load_steam(cfg)
    interactions = pd.concat([ml_inter, st_inter], ignore_index=True)
    interactions = interactions.dropna().drop_duplicates()
    # Keep only the most recent interaction per (user, item) pair
    interactions = (
        interactions.sort_values("timestamp")
        .drop_duplicates(subset=["user_key", "item_key"], keep="last")
        .reset_index(drop=True)
    )
    # Remove items with too few interactions (noisy, unlearnable)
    item_counts = interactions["item_key"].value_counts()
    keep_items = set(item_counts[item_counts >= cfg.min_item_interactions].index)
    interactions = interactions.loc[interactions["item_key"].isin(keep_items)]
    item_meta = (
        pd.concat([ml_items, st_items], ignore_index=True)
        .drop_duplicates("item_key")
        .reset_index(drop=True)
    )
    if enrich_from_hf:
        item_meta, stats = enrich_item_metadata_from_hf_cache(item_meta, cfg)
        item_meta.attrs["hf_enrichment_stats"] = stats
    return interactions, item_meta


def enrich_movie_descriptions_from_tmdb(
    item_meta: pd.DataFrame,
    api_key: str | None = None,
    cache_path: str | Path = "artifacts/tmdb_movie_descriptions.csv",
    limit: int | None = None,
    sleep_s: float = 0.03,
) -> pd.DataFrame:
    import requests

    api_key = api_key or os.getenv("TMDB_API_KEY")
    if not api_key:
        raise RuntimeError("Set TMDB_API_KEY or pass api_key=... before fetching TMDB descriptions.")
    if "tmdb_id" not in item_meta.columns:
        raise ValueError("item_meta has no tmdb_id column. Rebuild item_meta with the current loader first.")

    cache_path = Path(cache_path)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    if cache_path.exists():
        cache = pd.read_csv(cache_path)
    else:
        cache = pd.DataFrame(columns=["tmdb_id", "description"])
    cached = set(cache["tmdb_id"].dropna().astype(int).tolist())

    movie_ids = (
        item_meta.loc[item_meta["domain"].eq("movie"), "tmdb_id"]
        .dropna()
        .astype(int)
        .drop_duplicates()
        .tolist()
    )
    missing = [tmdb_id for tmdb_id in movie_ids if tmdb_id not in cached]
    if limit is not None:
        missing = missing[:limit]

    rows = []
    for tmdb_id in tqdm(missing, desc="fetch TMDB overviews"):
        url = f"https://api.themoviedb.org/3/movie/{tmdb_id}"
        try:
            r = requests.get(url, params={"api_key": api_key, "language": "en-US"}, timeout=20)
            if r.status_code == 404:
                continue
            r.raise_for_status()
            rows.append({"tmdb_id": tmdb_id, "description": r.json().get("overview", "") or ""})
            if len(rows) % 100 == 0:
                cache = pd.concat([cache, pd.DataFrame(rows)], ignore_index=True).drop_duplicates("tmdb_id", keep="last")
                cache.to_csv(cache_path, index=False)
                rows = []
            if sleep_s:
                time.sleep(sleep_s)
        except requests.RequestException:
            continue

    if rows:
        cache = pd.concat([cache, pd.DataFrame(rows)], ignore_index=True).drop_duplicates("tmdb_id", keep="last")
        cache.to_csv(cache_path, index=False)

    out = item_meta.copy()
    cache["tmdb_id"] = cache["tmdb_id"].astype("Int64")
    out = out.merge(cache, on="tmdb_id", how="left", suffixes=("", "_tmdb"))
    out["description"] = out["description_tmdb"].fillna(out.get("description", ""))
    out = out.drop(columns=[c for c in ["description_tmdb"] if c in out.columns])
    out["tokens"] = out["tokens"].fillna("") + " " + out["description"].fillna("").map(lambda x: _text_tokens(x, limit=80))
    return out


def build_text_embedding_tensor(
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    cache_path: str | Path = "artifacts/item_text_embeddings.pt",
    batch_size: int = 128,
    force_recompute: bool = False,
) -> torch.Tensor:
    cache_path = Path(cache_path)
    n_items = max(item_to_idx.values()) + 1
    ordered = item_meta.loc[item_meta["item_key"].isin(item_to_idx)].copy()
    ordered["idx"] = ordered["item_key"].map(item_to_idx)
    ordered = ordered.sort_values("idx")
    signature = {
        "model_name": model_name,
        "item_keys": ordered["item_key"].tolist(),
        "descriptions": ordered["description"].fillna("").tolist(),
        "tokens": ordered["tokens"].fillna("").tolist(),
    }

    if cache_path.exists() and not force_recompute:
        cached = torch.load(cache_path, map_location="cpu", weights_only=False)
        if cached.get("signature") == signature:
            return cached["tensor"]

    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise RuntimeError("Install sentence-transformers first: %pip install -q sentence-transformers") from exc

    texts = (
        ordered["title"].fillna("")
        + ". "
        + ordered["description"].fillna("")
        + " "
        + ordered["tokens"].fillna("")
    ).tolist()
    encoder = SentenceTransformer(model_name)
    embeddings = encoder.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )

    tensor = torch.zeros((n_items, embeddings.shape[1]), dtype=torch.float32)
    tensor[torch.tensor(ordered["idx"].to_numpy(), dtype=torch.long)] = torch.tensor(embeddings, dtype=torch.float32)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"signature": signature, "tensor": tensor}, cache_path)
    return tensor


def make_vocab(values: Iterable[str], add_pad: bool = True) -> dict[str, int]:
    start = 1 if add_pad else 0
    vocab = {v: i + start for i, v in enumerate(sorted(set(map(str, values))))}
    if add_pad:
        vocab["<PAD>"] = PAD
    return vocab


SURVEY_RATING_VALUES = {
    "5 Stars": 5.0,
    "4 Stars": 4.0,
    "Didn't watch but would watch": 3.5,
    "Didn't play but would play": 3.5,
    "3 Stars": 3.0,
    "2 Stars": 2.0,
    "Didn't watch and wouldn't watch": 1.5,
    "Didn't play and wouldn't play": 1.5,
    "1 Star": 1.0,
}


def parse_survey_item_id(value: str) -> str:
    domain, item_id = str(value).split("_", 1)
    if domain not in {"movie", "game"} or not item_id:
        raise ValueError(f"Unsupported survey item id: {value!r}")
    return f"{domain}:{item_id}"


def survey_rating_value(value: str) -> float:
    if value not in SURVEY_RATING_VALUES:
        raise ValueError(f"Unknown survey rating label: {value!r}")
    return SURVEY_RATING_VALUES[value]


def survey_rating_weight(value: str) -> float:
    return max(-1.0, min((survey_rating_value(value) - 3.0) / 2.0, 1.0))


def _split_genres(value) -> list[str]:
    if pd.isna(value):
        return []
    return [part.strip().lower() for part in str(value).split("|") if part.strip()]


def build_genre_vocab(survey: pd.DataFrame) -> dict[str, int]:
    columns = [
        "movie_genres_fav",
        "movie_genres_disliked",
        "game_genres_fav",
        "game_genres_disliked",
    ]
    values = {genre for column in columns for value in survey[column] for genre in _split_genres(value)}
    return {genre: idx for idx, genre in enumerate(sorted(values))}


def genre_preference_vector(row: pd.Series, genre_vocab: dict[str, int]) -> torch.Tensor:
    vector = torch.zeros(len(genre_vocab), dtype=torch.float32)
    for column in ["movie_genres_fav", "game_genres_fav"]:
        for genre in _split_genres(row[column]):
            if genre in genre_vocab:
                vector[genre_vocab[genre]] = 1.0
    for column in ["movie_genres_disliked", "game_genres_disliked"]:
        for genre in _split_genres(row[column]):
            if genre in genre_vocab:
                vector[genre_vocab[genre]] = -1.0
    return vector


def load_survey_user_profiles(
    csv_path: str | Path,
    item_to_idx: dict[str, int] | None = None,
) -> tuple[list[dict], dict[str, int]]:
    survey = pd.read_csv(csv_path)
    genre_vocab = build_genre_vocab(survey)
    profiles = []
    for user_number, row in survey.iterrows():
        ratings = json.loads(row["ratings"])
        profile_ratings = []
        for rating in ratings:
            item_key = parse_survey_item_id(rating["item_id"])
            item_id = None if item_to_idx is None else item_to_idx.get(item_key)
            profile_ratings.append(
                {
                    "item_key": item_key,
                    "item_id": item_id,
                    "title": rating.get("title", ""),
                    "domain": rating.get("type", item_key.split(":", 1)[0]),
                    "label": rating["rating"],
                    "value": survey_rating_value(rating["rating"]),
                    "weight": survey_rating_weight(rating["rating"]),
                }
            )
        profiles.append(
            {
                "user_key": f"survey:{user_number}",
                "age": int(row["age"]),
                "gender": str(row["gender"]).strip().lower(),
                "profession": str(row["profession"]).strip().lower(),
                "country": str(row["country"]).strip().lower(),
                "movie_genres_fav": _split_genres(row["movie_genres_fav"]),
                "movie_genres_disliked": _split_genres(row["movie_genres_disliked"]),
                "game_genres_fav": _split_genres(row["game_genres_fav"]),
                "game_genres_disliked": _split_genres(row["game_genres_disliked"]),
                "genre_preferences": genre_preference_vector(row, genre_vocab),
                "ratings": profile_ratings,
            }
        )
    return profiles, genre_vocab


def build_survey_interactions(
    csv_path: str | Path,
    positive_threshold: float = 3.5,
) -> pd.DataFrame:
    """Convert explicit survey labels into ordered positive pretraining events."""
    profiles, _ = load_survey_user_profiles(csv_path)
    rows = []
    for profile in profiles:
        for position, rating in enumerate(profile["ratings"]):
            if rating["value"] < positive_threshold:
                continue
            rows.append(
                {
                    "user_key": profile["user_key"],
                    "item_key": rating["item_key"],
                    "timestamp": position,
                    "domain": rating["domain"],
                    "rating_value": rating["value"],
                    "rating_weight": rating["weight"],
                }
            )
    return pd.DataFrame(rows)


def survey_catalog_coverage(profiles: Sequence[dict]) -> dict[str, int | float]:
    ratings = [rating for profile in profiles for rating in profile["ratings"]]
    mapped = [rating for rating in ratings if rating.get("item_id") is not None]
    return {
        "ratings": len(ratings),
        "mapped_ratings": len(mapped),
        "unique_items": len({rating["item_key"] for rating in ratings}),
        "mapped_unique_items": len({rating["item_key"] for rating in mapped}),
        "coverage": len(mapped) / max(len(ratings), 1),
    }


def _profile_rating_map(profile: dict) -> dict[int, float]:
    return {
        int(rating["item_id"]): float(rating["weight"])
        for rating in profile["ratings"]
        if rating.get("item_id") is not None
    }


def survey_user_similarity(
    target_profile: dict,
    other_profile: dict,
    rating_weight: float = 0.7,
    genre_weight: float = 0.3,
    overlap_shrinkage: float = 3.0,
) -> dict[str, float]:
    """Blend shared-rating cosine similarity with explicit genre preferences."""
    target_ratings = _profile_rating_map(target_profile)
    other_ratings = _profile_rating_map(other_profile)
    shared = sorted(set(target_ratings) & set(other_ratings))

    rating_similarity = 0.0
    if shared:
        target_values = np.array([target_ratings[item_id] for item_id in shared], dtype=np.float32)
        other_values = np.array([other_ratings[item_id] for item_id in shared], dtype=np.float32)
        denominator = float(np.linalg.norm(target_values) * np.linalg.norm(other_values))
        if denominator > 0:
            raw_similarity = float(target_values @ other_values / denominator)
            shrinkage = len(shared) / (len(shared) + max(float(overlap_shrinkage), 0.0))
            rating_similarity = raw_similarity * shrinkage

    target_genres = torch.as_tensor(target_profile["genre_preferences"], dtype=torch.float32)
    other_genres = torch.as_tensor(other_profile["genre_preferences"], dtype=torch.float32)
    genre_denominator = float(target_genres.norm() * other_genres.norm())
    genre_similarity = (
        float(torch.dot(target_genres, other_genres) / genre_denominator)
        if genre_denominator > 0
        else 0.0
    )

    available_rating_weight = float(rating_weight) if shared else 0.0
    available_genre_weight = float(genre_weight) if genre_denominator > 0 else 0.0
    total_weight = available_rating_weight + available_genre_weight
    similarity = 0.0
    if total_weight > 0:
        similarity = (
            available_rating_weight * rating_similarity
            + available_genre_weight * genre_similarity
        ) / total_weight
    return {
        "similarity": float(similarity),
        "rating_similarity": float(rating_similarity),
        "genre_similarity": float(genre_similarity),
        "shared_items": float(len(shared)),
    }


def find_similar_survey_users(
    target_profile: dict,
    profiles: Sequence[dict],
    k: int = 15,
    min_similarity: float = 0.0,
    rating_weight: float = 0.7,
    genre_weight: float = 0.3,
    overlap_shrinkage: float = 3.0,
) -> list[dict]:
    neighbors = []
    for other in profiles:
        if other.get("user_key") == target_profile.get("user_key"):
            continue
        similarity = survey_user_similarity(
            target_profile,
            other,
            rating_weight=rating_weight,
            genre_weight=genre_weight,
            overlap_shrinkage=overlap_shrinkage,
        )
        if similarity["similarity"] < min_similarity:
            continue
        neighbors.append(
            {
                "user_key": other["user_key"],
                "profile": other,
                **similarity,
            }
        )
    neighbors.sort(
        key=lambda row: (row["similarity"], row["shared_items"]),
        reverse=True,
    )
    return neighbors[:k]


def recommend_user_cf(
    target_profile: dict,
    profiles: Sequence[dict],
    k: int = 10,
    neighbor_count: int = 15,
    domain: str | None = None,
    min_similarity: float = 0.05,
    min_score: float = 0.0,
    rating_weight: float = 0.7,
    genre_weight: float = 0.3,
    overlap_shrinkage: float = 3.0,
) -> tuple[list[tuple[int, float]], list[dict]]:
    """Recommend unseen survey items from the target user's nearest neighbors."""
    if domain not in {None, "movie", "game"}:
        raise ValueError("domain must be None, 'movie', or 'game'.")
    neighbors = find_similar_survey_users(
        target_profile,
        profiles,
        k=neighbor_count,
        min_similarity=min_similarity,
        rating_weight=rating_weight,
        genre_weight=genre_weight,
        overlap_shrinkage=overlap_shrinkage,
    )
    seen = set(_profile_rating_map(target_profile))
    weighted_scores: dict[int, float] = {}
    similarity_sums: dict[int, float] = {}
    support: dict[int, int] = {}
    for neighbor in neighbors:
        similarity = float(neighbor["similarity"])
        for rating in neighbor["profile"]["ratings"]:
            item_id = rating.get("item_id")
            if item_id is None or item_id in seen:
                continue
            if domain is not None and rating["domain"] != domain:
                continue
            weighted_scores[item_id] = weighted_scores.get(item_id, 0.0) + similarity * float(rating["weight"])
            similarity_sums[item_id] = similarity_sums.get(item_id, 0.0) + abs(similarity)
            support[item_id] = support.get(item_id, 0) + 1

    rows = []
    for item_id, numerator in weighted_scores.items():
        score = numerator / max(similarity_sums[item_id], 1e-8)
        # A small support adjustment prevents single-neighbor items from
        # dominating equally scored items with broader agreement.
        score *= support[item_id] / (support[item_id] + 1.0)
        if score >= min_score:
            rows.append((int(item_id), float(score)))
    rows.sort(key=lambda row: (row[1], support[row[0]]), reverse=True)
    return rows[:k], neighbors


def evaluate_user_cf_leave_one_out(
    profiles: Sequence[dict],
    k: int = 10,
    neighbor_count: int = 15,
    domain: str | None = None,
    min_similarity: float = 0.05,
) -> dict[str, float]:
    """Evaluate user-CF by hiding each survey user's final positive item."""
    hits, reciprocal_rank, total, users_with_recommendations = 0, 0.0, 0, 0
    for profile in tqdm(profiles, total=len(profiles), desc="evaluate user CF", leave=False):
        positive_indices = [
            index
            for index, rating in enumerate(profile["ratings"])
            if rating.get("item_id") is not None
            and rating["weight"] > 0
            and (domain is None or rating["domain"] == domain)
        ]
        if len(positive_indices) < 2:
            continue
        held_out_index = positive_indices[-1]
        target = int(profile["ratings"][held_out_index]["item_id"])
        target_profile = {
            **profile,
            "ratings": [
                rating
                for index, rating in enumerate(profile["ratings"])
                if index != held_out_index
            ],
        }
        recommendations, _ = recommend_user_cf(
            target_profile,
            profiles,
            k=k,
            neighbor_count=neighbor_count,
            domain=domain,
            min_similarity=min_similarity,
        )
        ranked = [item_id for item_id, _ in recommendations]
        total += 1
        users_with_recommendations += int(bool(ranked))
        if target in ranked:
            rank = ranked.index(target) + 1
            hits += 1
            reciprocal_rank += 1.0 / rank
    return {
        f"UserCF_HR@{k}": hits / max(total, 1),
        f"UserCF_MRR@{k}": reciprocal_rank / max(total, 1),
        "user_cf_users": float(total),
        "user_cf_coverage": users_with_recommendations / max(total, 1),
    }


def recommend_hybrid_survey_user(
    target_profile: dict,
    profiles: Sequence[dict],
    model: CLEPIDTN,
    item_index: torch.Tensor,
    cfg: RecConfig,
    k: int = 10,
    domain: str | None = None,
    neural_weight: float = 0.75,
    user_cf_weight: float = 0.25,
    candidate_multiplier: int = 5,
    text_index: torch.Tensor | None = None,
    neighbor_count: int = 15,
) -> tuple[list[tuple[int, float]], dict]:
    """Fuse neural and survey user-CF rankings with reciprocal-rank fusion."""
    mapped_ratings = [
        rating for rating in target_profile["ratings"] if rating.get("item_id") is not None
    ]
    if not mapped_ratings:
        raise ValueError("The survey profile has no items mapped to the model catalog.")
    history_ids = [int(rating["item_id"]) for rating in mapped_ratings]
    history_weights = [float(rating["weight"]) for rating in mapped_ratings]
    pool_size = max(k, k * max(int(candidate_multiplier), 1))
    neural = recommend_from_history(
        model,
        item_index,
        history_ids,
        user_id=None,
        activity=len(history_ids),
        cfg=cfg,
        k=pool_size,
        domain=domain,
        text_index=text_index,
        history_weights=history_weights,
    )
    user_cf, neighbors = recommend_user_cf(
        target_profile,
        profiles,
        k=pool_size,
        neighbor_count=neighbor_count,
        domain=domain,
    )

    fused: dict[int, float] = {}
    rank_constant = 20.0
    for rank, (item_id, _) in enumerate(neural, start=1):
        fused[item_id] = fused.get(item_id, 0.0) + float(neural_weight) / (rank_constant + rank)
    for rank, (item_id, _) in enumerate(user_cf, start=1):
        fused[item_id] = fused.get(item_id, 0.0) + float(user_cf_weight) / (rank_constant + rank)
    rows = sorted(fused.items(), key=lambda row: row[1], reverse=True)[:k]
    return rows, {
        "neural_recommendations": neural,
        "user_cf_recommendations": user_cf,
        "neighbors": neighbors,
    }


def encode_item_metadata(item_meta: pd.DataFrame, item_to_idx: dict[str, int], max_tokens: int = 80):
    token_counts: dict[str, int] = {}
    for text in tqdm(
        item_meta["tokens"].fillna(""),
        total=len(item_meta),
        desc="count metadata tokens",
        leave=False,
    ):
        for token in str(text).split():
            token_counts[token] = token_counts.get(token, 0) + 1
    kept = [t for t, c in token_counts.items() if c >= 3]
    token_to_idx = {"<PAD>": PAD, "<UNK>": 1, **{t: i + 2 for i, t in enumerate(sorted(kept))}}
    domain_to_idx = {"movie": 0, "game": 1}

    n_items = max(item_to_idx.values()) + 1
    token_ids = np.zeros((n_items, max_tokens), dtype=np.int64)
    domain_ids = np.zeros(n_items, dtype=np.int64)
    title_lookup = {}

    for row in tqdm(
        item_meta.itertuples(index=False),
        total=len(item_meta),
        desc="encode item metadata",
        leave=False,
    ):
        idx = item_to_idx.get(row.item_key)
        if idx is None:
            continue
        toks = [token_to_idx.get(t, 1) for t in str(row.tokens).split()[:max_tokens]]
        token_ids[idx, : len(toks)] = toks
        domain_ids[idx] = domain_to_idx.get(row.domain, 0)
        title_lookup[idx] = row.title
    return token_to_idx, torch.tensor(token_ids), torch.tensor(domain_ids), title_lookup


def make_sequence_samples(interactions: pd.DataFrame, cfg: RecConfig, all_item_keys: Iterable[str] | None = None):
    user_counts = interactions.groupby("user_key").size()
    keep_users = set(user_counts[user_counts >= cfg.min_user_events].index)
    interactions = interactions.loc[interactions["user_key"].isin(keep_users)].copy()

    user_to_idx = make_vocab(interactions["user_key"], add_pad=False)
    if all_item_keys is None:
        item_values = interactions["item_key"]
    else:
        item_values = pd.concat(
            [interactions["item_key"], pd.Series(list(all_item_keys), dtype="object")],
            ignore_index=True,
        )
    item_to_idx = make_vocab(item_values, add_pad=True)
    interactions["u"] = interactions["user_key"].map(user_to_idx).astype(np.int64)
    interactions["i"] = interactions["item_key"].map(item_to_idx).astype(np.int64)
    interactions = interactions.sort_values(["u", "timestamp"])

    histories, targets, users, activity = [], [], [], []
    eval_rows = []
    grouped = interactions.groupby("u", sort=False)
    for u, g in tqdm(grouped, total=grouped.ngroups, desc="build sequences", leave=False):
        seq = g["i"].tolist()
        if len(seq) < cfg.min_user_events:
            continue
        eval_rows.append((u, seq[:-1][-cfg.max_seq_len :], seq[-1]))
        for pos in range(1, len(seq) - 1):
            histories.append(seq[:pos][-cfg.max_seq_len :])
            targets.append(seq[pos])
            users.append(u)
            activity.append(min(int(math.log2(len(seq))), 8))
            if len(targets) >= cfg.max_train_samples:
                break
        if len(targets) >= cfg.max_train_samples:
            break

    return {
        "user_to_idx": user_to_idx,
        "item_to_idx": item_to_idx,
        "histories": histories,
        "targets": targets,
        "users": users,
        "activity": activity,
        "eval_rows": eval_rows,
    }


def make_temporal_sequence_splits(
    interactions: pd.DataFrame,
    cfg: RecConfig,
    all_item_keys: Iterable[str] | None = None,
) -> dict:
    """Create leakage-resistant train/validation/test next-item splits.

    The last event is test, the penultimate event is validation, and training
    targets come only from earlier events. Users need at least four events for
    all three partitions.
    """
    user_counts = interactions.groupby("user_key").size()
    keep_users = set(user_counts[user_counts >= cfg.min_user_events].index)
    frame = interactions.loc[interactions["user_key"].isin(keep_users)].copy()
    user_to_idx = make_vocab(frame["user_key"], add_pad=False)
    item_values = frame["item_key"]
    if all_item_keys is not None:
        item_values = pd.concat([item_values, pd.Series(list(all_item_keys), dtype="object")], ignore_index=True)
    item_to_idx = make_vocab(item_values, add_pad=True)
    frame["u"] = frame["user_key"].map(user_to_idx).astype(np.int64)
    frame["i"] = frame["item_key"].map(item_to_idx).astype(np.int64)
    frame = frame.sort_values(["u", "timestamp"])

    histories, targets, users, activity = [], [], [], []
    validation_rows, test_rows = [], []
    grouped = frame.groupby("u", sort=False)
    for u, group in tqdm(grouped, total=grouped.ngroups, desc="build temporal splits", leave=False):
        sequence = group["i"].tolist()
        if len(sequence) < 4:
            continue
        validation_rows.append((u, sequence[:-2][-cfg.max_seq_len :], sequence[-2]))
        test_rows.append((u, sequence[:-1][-cfg.max_seq_len :], sequence[-1]))
        if len(targets) >= cfg.max_train_samples:
            continue
        for position in range(1, len(sequence) - 2):
            histories.append(sequence[:position][-cfg.max_seq_len :])
            targets.append(sequence[position])
            users.append(u)
            activity.append(min(int(math.log2(len(sequence))), 8))
            if len(targets) >= cfg.max_train_samples:
                break

    return {
        "user_to_idx": user_to_idx,
        "item_to_idx": item_to_idx,
        "histories": histories,
        "targets": targets,
        "users": users,
        "activity": activity,
        "validation_rows": validation_rows,
        "test_rows": test_rows,
        "eval_rows": validation_rows,
    }


class SequenceDataset(Dataset):
    def __init__(self, histories, targets, users, activity, max_seq_len: int):
        self.histories = histories
        self.targets = targets
        self.users = users
        self.activity = activity
        self.max_seq_len = max_seq_len

    def __len__(self) -> int:
        return len(self.targets)

    def __getitem__(self, idx: int):
        hist = self.histories[idx]
        padded = [PAD] * (self.max_seq_len - len(hist)) + hist[-self.max_seq_len :]
        mask = [0] * (self.max_seq_len - len(hist)) + [1] * min(len(hist), self.max_seq_len)
        return {
            "history": torch.tensor(padded, dtype=torch.long),
            "mask": torch.tensor(mask, dtype=torch.bool),
            "target": torch.tensor(self.targets[idx], dtype=torch.long),
            "user": torch.tensor(self.users[idx], dtype=torch.long),
            "activity": torch.tensor(self.activity[idx], dtype=torch.long),
        }


class CLEPIDTN(nn.Module):
    def __init__(
        self,
        n_items: int,
        n_users: int,
        n_tokens: int,
        item_token_ids: torch.Tensor,
        item_domain_ids: torch.Tensor,
        cfg: RecConfig,
        item_text_embeddings: torch.Tensor | None = None,
    ):
        super().__init__()
        d = cfg.embedding_dim
        self.cfg = cfg
        self.item_token_ids = item_token_ids
        self.item_domain_ids = item_domain_ids
        self.item_text_embeddings = item_text_embeddings
        self.item_id = nn.Embedding(n_items, d, padding_idx=PAD)
        self.user_id = nn.Embedding(n_users, d)
        self.activity = nn.Embedding(9, d)
        self.token = nn.Embedding(n_tokens, d, padding_idx=PAD)
        self.domain = nn.Embedding(2, d)
        self.pos = nn.Embedding(cfg.max_seq_len, d)
        text_dim = 0 if item_text_embeddings is None else int(item_text_embeddings.shape[1])
        self.text_proj = nn.Linear(text_dim, d) if text_dim else None

        enc_layer = nn.TransformerEncoderLayer(
            d_model=d,
            nhead=cfg.attention_heads,
            dim_feedforward=d * 4,
            dropout=cfg.dropout,
            batch_first=True,
            activation="gelu",
        )
        # Nested tensors can fail when stochastic augmentation produces heavily
        # padded batches. Dense tensors are more predictable for our fixed,
        # left-padded sequence layout.
        self.sequence_encoder = nn.TransformerEncoder(
            enc_layer,
            num_layers=cfg.transformer_layers,
            enable_nested_tensor=False,
        )
        self.user_aug = nn.Sequential(nn.Linear(d * 2, d), nn.GELU(), nn.Linear(d, d))
        self.item_aug = nn.Sequential(nn.Linear(d * 2, d), nn.GELU(), nn.Linear(d, d))
        self.user_proj = nn.Sequential(nn.Linear(d * 4, d), nn.GELU(), nn.Dropout(cfg.dropout), nn.Linear(d, d))
        item_input_dim = d * 4 if self.text_proj is not None else d * 3
        self.item_proj = nn.Sequential(nn.Linear(item_input_dim, d), nn.GELU(), nn.Dropout(cfg.dropout), nn.Linear(d, d))

    def item_features(
        self,
        item_ids: torch.Tensor,
        mask_tokens: bool = False,
        return_aux: bool = False,
    ) -> torch.Tensor | tuple[torch.Tensor, dict[str, torch.Tensor]]:
        token_ids = self.item_token_ids.to(item_ids.device)[item_ids]
        if self.training and mask_tokens:
            keep = torch.rand_like(token_ids.float()) > self.cfg.dropout
            token_ids = token_ids * keep.long()
        token_mask = token_ids.ne(PAD).unsqueeze(-1)
        token_sum = (self.token(token_ids) * token_mask).sum(dim=1)
        tok = token_sum / token_mask.sum(dim=1).clamp_min(1)
        dom = self.domain(self.item_domain_ids.to(item_ids.device)[item_ids])
        iid = self.item_id(item_ids)
        pav = self.item_aug(torch.cat([iid, tok], dim=-1))
        parts = [iid, tok + pav, dom]
        if self.text_proj is not None and self.item_text_embeddings is not None:
            text = self.item_text_embeddings.to(item_ids.device)[item_ids].float()
            parts.append(self.text_proj(text))
        out = F.normalize(self.item_proj(torch.cat(parts, dim=-1)), dim=-1)
        if return_aux:
            return out, {"pav": F.normalize(pav, dim=-1)}
        return out

    def user_features(
        self,
        history: torch.Tensor,
        mask: torch.Tensor,
        user: torch.Tensor | None,
        activity: torch.Tensor,
        augment: bool = False,
        anonymous: bool = False,
        return_aux: bool = False,
    ):
        hist = history
        hist_mask = mask
        if not hist_mask.any(dim=1).all():
            raise ValueError("Every user history must contain at least one non-padding item.")
        if self.training and augment:
            keep = (torch.rand_like(hist.float()) > self.cfg.dropout) & hist_mask
            emptied = ~keep.any(dim=1)
            if emptied.any():
                positions = torch.arange(hist.size(1), device=hist.device).unsqueeze(0)
                recent_original = positions.masked_fill(~hist_mask, -1).max(dim=1).values
                empty_rows = torch.nonzero(emptied, as_tuple=False).squeeze(1)
                keep[empty_rows, recent_original[empty_rows]] = True
            hist = hist * keep.long()
            hist_mask = keep
        x = self.item_id(hist)
        positions = torch.arange(hist.size(1), device=hist.device).unsqueeze(0)
        x = x + self.pos(positions)
        causal_mask = None
        if self.cfg.use_causal_attention:
            causal_mask = torch.triu(
                torch.ones(hist.size(1), hist.size(1), dtype=torch.bool, device=hist.device),
                diagonal=1,
            )
        encoded = self.sequence_encoder(x, mask=causal_mask, src_key_padding_mask=~hist_mask)
        denom = hist_mask.sum(dim=1).clamp_min(1).unsqueeze(-1)
        pooled = (encoded * hist_mask.unsqueeze(-1)).sum(dim=1) / denom
        sequence_positions = torch.arange(hist.size(1), device=hist.device).unsqueeze(0)
        recent_idx = sequence_positions.masked_fill(~hist_mask, -1).max(dim=1).values.clamp_min(0)
        recent = encoded[torch.arange(hist.size(0), device=hist.device), recent_idx]
        if anonymous or user is None:
            uattr = torch.zeros_like(pooled)
            activity_vec = torch.zeros_like(pooled)
        else:
            activity_vec = self.activity(activity)
            uattr = self.user_id(user) + activity_vec
        pav = self.user_aug(torch.cat([uattr, pooled], dim=-1))
        out = self.user_proj(torch.cat([uattr + pav, pooled, recent, activity_vec], dim=-1))
        result = F.normalize(out, dim=-1), F.normalize(pooled, dim=-1), F.normalize(uattr, dim=-1)
        if return_aux:
            return (*result, {"pav": F.normalize(pav, dim=-1)})
        return result

    def forward(self, batch):
        user_vec, seq_vec, attr_vec, user_aux = self.user_features(
            batch["history"],
            batch["mask"],
            batch["user"],
            batch["activity"],
            augment=False,
            return_aux=True,
        )
        item_vec, item_aux = self.item_features(batch["target"], mask_tokens=False, return_aux=True)
        return user_vec, item_vec, seq_vec, attr_vec, user_aux, item_aux


def info_nce(a: torch.Tensor, b: torch.Tensor, temperature: torch.Tensor | float) -> torch.Tensor:
    logits = a @ b.T / temperature
    labels = torch.arange(a.size(0), device=a.device)
    return F.cross_entropy(logits, labels)


def build_training_scheduler(optimizer, loader: DataLoader, cfg: RecConfig):
    """Create a OneCycleLR scheduler spanning all epochs.

    Linear warmup for the first 5% of steps, then cosine decay to 0.
    """
    return torch.optim.lr_scheduler.OneCycleLR(
        optimizer,
        max_lr=cfg.lr,
        total_steps=len(loader) * cfg.epochs,
        pct_start=0.05,
        anneal_strategy="cos",
    )


def train_one_epoch(
    model: CLEPIDTN,
    loader: DataLoader,
    optimizer,
    cfg: RecConfig,
    desc: str | None = None,
    scheduler=None,
) -> float:
    model.train()
    total, steps = 0.0, 0
    progress = tqdm(loader, desc=desc or "train", leave=False)
    for batch in progress:
        batch = {k: v.to(cfg.device) for k, v in batch.items()}

        # View 1 (clean): main InfoNCE loss + auxiliary vectors
        user_vec, item_vec, _, _, user_aux, item_aux = model(batch)
        main_loss = info_nce(user_vec, item_vec, cfg.temperature)

        # View 2 (augmented): contrastive SSL pairs
        _, seq_a, attr_a = model.user_features(
            batch["history"], batch["mask"], batch["user"], batch["activity"],
            augment=True,
        )
        _, seq_b, attr_b = model.user_features(
            batch["history"], batch["mask"], batch["user"], batch["activity"],
            augment=True,
        )
        item_a = model.item_features(batch["target"], mask_tokens=True)
        item_b = model.item_features(batch["target"], mask_tokens=True)

        ssl = (
            info_nce(seq_a, seq_b, cfg.temperature)
            + info_nce(attr_a, attr_b, cfg.temperature)
            + info_nce(item_a, item_b, cfg.temperature)
        ) / 3

        # AMM loss: cosine similarity instead of MSE to avoid collapse
        amm_loss = (
            1.0 - F.cosine_similarity(user_aux["pav"], item_vec.detach(), dim=-1).mean()
            + 1.0 - F.cosine_similarity(item_aux["pav"], user_vec.detach(), dim=-1).mean()
        )

        loss = main_loss + cfg.contrastive_weight * ssl + cfg.amm_weight * amm_loss
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        if cfg.gradient_clip_norm > 0:
            torch.nn.utils.clip_grad_norm_(model.parameters(), cfg.gradient_clip_norm)
        optimizer.step()
        if scheduler is not None:
            scheduler.step()
        total += loss.item()
        steps += 1
        progress.set_postfix(loss=f"{total / steps:.4f}")
    return total / max(steps, 1)


@torch.no_grad()
def build_item_index(model: CLEPIDTN, batch_size: int = 4096) -> torch.Tensor:
    """Build a full item index tensor of shape ``(n_items, d)``.

    Position 0 (PAD) is a zero vector.  Every other position stores the
    normalized item-tower output so that ``item_index[item_id]`` gives the
    correct vector without any offset arithmetic.
    """
    model.eval()
    n_items = model.item_id.num_embeddings
    device = next(model.parameters()).device
    vecs = []
    starts = range(1, n_items, batch_size)
    for start in tqdm(starts, desc="index items", leave=False):
        ids = torch.arange(start, min(start + batch_size, n_items), device=device)
        vecs.append(model.item_features(ids).cpu())
    item_vecs = torch.cat(vecs, dim=0)
    # Prepend a zero vector for PAD (index 0) so item_index[item_id] works directly.
    pad_vec = torch.zeros(1, item_vecs.size(1), dtype=item_vecs.dtype)
    return torch.cat([pad_vec, item_vecs], dim=0)


def item_index_ids(model: CLEPIDTN) -> torch.Tensor:
    return torch.arange(1, model.item_id.num_embeddings)


def candidate_item_ids_from_metadata(
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
    domain: str | None = None,
    min_reviews: int | None = None,
) -> torch.Tensor:
    candidates = item_meta.copy()
    if domain is not None:
        candidates = candidates.loc[candidates["domain"].eq(domain)]
    if min_reviews is not None and "user_reviews" in candidates.columns:
        candidates = candidates.loc[candidates["user_reviews"].fillna(0) >= min_reviews]
    ids = [item_to_idx[k] for k in candidates["item_key"] if k in item_to_idx]
    if not ids:
        raise ValueError("No candidates matched the requested metadata filters.")
    return torch.tensor(sorted(set(ids)), dtype=torch.long)


def recommend_cross_domain_content(
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
    history_ids: list[int],
    target_domain: str,
    k: int = 10,
    text_index: torch.Tensor | None = None,
    min_reviews: int | None = 500,
    exclude_addons: bool = True,
    semantic_weight: float = 0.35,
    token_weight: float = 0.30,
    title_weight: float = 0.25,
    popularity_weight: float = 0.10,
    history_weights: list[float] | None = None,
) -> list[tuple[int, float]]:
    """Content-first cross-domain retrieval for cold-start recommendations.

    This is intentionally separate from the trained interaction model. Public
    MovieLens users and public Steam users are not the same people, so
    cross-domain recommendations are more reliable when ranked by shared
    language, tags, descriptions, franchise/entity overlap, and catalog quality.
    """
    idx_to_key = {idx: key for key, idx in item_to_idx.items()}
    meta = item_meta.loc[item_meta["item_key"].isin(item_to_idx)].copy()
    meta["idx"] = meta["item_key"].map(item_to_idx)

    source_ids, source_weights = _normalize_history_weights(history_ids, history_weights)
    positive_ids = [idx for idx, weight in zip(source_ids, source_weights) if weight > 0]
    negative_ids = [idx for idx, weight in zip(source_ids, source_weights) if weight < 0]

    source = meta.loc[meta["idx"].isin(positive_ids)]
    if source.empty:
        raise ValueError("No positive source items found. Ratings of 4-5 are needed to build a profile.")
    negative_source = meta.loc[meta["idx"].isin(negative_ids)]

    candidates = meta.loc[meta["domain"].eq(target_domain)].copy()
    if min_reviews is not None and "user_reviews" in candidates.columns:
        candidates = candidates.loc[candidates["user_reviews"].fillna(0) >= min_reviews]
    if exclude_addons:
        addon_pattern = r"\b(?:dlc|demo|pack|skin|skins|season pass|expansion|challenge pack|batmobile|soundtrack)\b"
        candidates = candidates.loc[~candidates["title"].fillna("").str.contains(addon_pattern, case=False, regex=True)]
    if candidates.empty:
        raise ValueError("No target-domain candidates remain after filtering.")

    source_tokens = _weighted_metadata_token_scores(source, source_ids, source_weights, positive_only=True)
    negative_tokens = _weighted_metadata_token_scores(negative_source, source_ids, source_weights, positive_only=False)
    source_title_tokens = _important_title_tokens(source["title"].fillna("").tolist())
    if not source_tokens:
        raise ValueError("Source items have no usable metadata tokens.")

    rows = []
    candidate_indices = torch.tensor(candidates["idx"].to_numpy(), dtype=torch.long)

    semantic_scores = torch.zeros(len(candidates), dtype=torch.float32)
    if text_index is not None:
        hist_indices = torch.tensor(source_ids, dtype=torch.long)
        hist_weights = torch.tensor(source_weights, dtype=torch.float32).unsqueeze(1)
        hist_vec = text_index[hist_indices] * hist_weights
        hist_vec = F.normalize(hist_vec.sum(dim=0, keepdim=True), dim=-1)
        cand_vec = F.normalize(text_index[candidate_indices], dim=-1)
        semantic_scores = (hist_vec @ cand_vec.T).squeeze(0).cpu()

    max_reviews = float(np.log1p(candidates["user_reviews"].fillna(0).astype(float)).max() or 1.0)
    candidate_rows = candidates.itertuples(index=False)
    for pos, row in enumerate(
        tqdm(candidate_rows, total=len(candidates), desc="rank cross-domain candidates", leave=False)
    ):
        candidate_tokens = set(str(row.tokens).split())
        token_score = sum(source_tokens.get(t, 0.0) for t in candidate_tokens)
        token_score -= sum(abs(negative_tokens.get(t, 0.0)) for t in candidate_tokens)
        token_score = token_score / max(sum(abs(v) for v in source_tokens.values()) ** 0.5, 1.0)

        title_tokens = set(_title_tokens(row.title).split())
        title_score = min(len(source_title_tokens & title_tokens), 3) / 3.0
        if source_title_tokens and source_title_tokens.issubset(title_tokens):
            title_score = 1.0

        reviews = getattr(row, "user_reviews", 0) or 0
        popularity_score = float(np.log1p(reviews)) / max_reviews
        score = (
            semantic_weight * float(semantic_scores[pos])
            + token_weight * float(token_score)
            + title_weight * float(title_score)
            + popularity_weight * popularity_score
        )
        rows.append((int(row.idx), float(score)))

    rows.sort(key=lambda x: x[1], reverse=True)
    return rows[:k]



def _normalize_history_weights(
    history_ids: list[int],
    history_weights: list[float] | None = None,
    star_rating_scale: bool = False,
) -> tuple[list[int], list[float]]:
    """Pair item IDs with normalized weights in [-1, 1].

    Parameters
    ----------
    star_rating_scale : bool
        When *True*, weights are treated as 1-5 star ratings and linearly
        mapped to [-1, 1] via ``(w - 3) / 2``.  When *False* (default),
        weights are assumed to already be in [-1, 1] and are only clamped.
    """
    ids = [int(i) for i in history_ids if i > 0]
    if history_weights is None:
        return ids, [1.0] * len(ids)
    if len(history_weights) != len(history_ids):
        raise ValueError("history_weights must have the same length as history_ids.")
    out_ids, out_weights = [], []
    for item_id, raw_weight in zip(history_ids, history_weights):
        if item_id <= 0:
            continue
        weight = float(raw_weight)
        if star_rating_scale:
            weight = (weight - 3.0) / 2.0
        out_ids.append(int(item_id))
        out_weights.append(max(-1.0, min(weight, 1.0)))
    return out_ids, out_weights


def _weighted_metadata_token_scores(
    rows: pd.DataFrame,
    history_ids: list[int],
    history_weights: list[float],
    positive_only: bool,
) -> dict[str, float]:
    weight_by_idx = dict(zip(history_ids, history_weights))
    scores: dict[str, float] = {}
    for row in rows.itertuples(index=False):
        weight = float(weight_by_idx.get(int(row.idx), 0.0))
        if positive_only and weight <= 0:
            continue
        if not positive_only and weight >= 0:
            continue
        for token in str(row.tokens).split():
            if len(token) <= 2 or token in _METADATA_STOP_WORDS or token.startswith("posratio_"):
                continue
            scores[token] = scores.get(token, 0.0) + weight
    return scores


def _important_title_tokens(titles: list[str]) -> set[str]:
    stop = {"the", "and", "part", "movie", "film", "edition", "year"}
    tokens = set()
    for title in titles:
        tokens.update(t for t in _title_tokens(title).split() if len(t) > 2 and t not in stop)
    return tokens


def add_tmdb_movie_descriptions(
    cfg: RecConfig,
    item_meta: pd.DataFrame,
    cache_path: str | Path = "artifacts/tmdb_movie_descriptions.csv",
    bearer_token: str | None = None,
    limit: int | None = None,
    sleep_seconds: float = 0.025,
) -> pd.DataFrame:
    import requests

    bearer_token = bearer_token or os.getenv("TMDB_BEARER_TOKEN")
    if not bearer_token:
        raise RuntimeError("Set TMDB_BEARER_TOKEN or pass bearer_token=... before fetching TMDB descriptions.")

    cache_path = Path(cache_path)
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    if cache_path.exists():
        cached = pd.read_csv(cache_path)
    else:
        cached = pd.DataFrame(columns=["item_key", "tmdbId", "description"])

    cached_keys = set(cached["item_key"].astype(str))
    links = _read_csv_from_zip(cfg.movielens_zip, "ml-32m/links.csv", usecols=["movieId", "tmdbId"])
    links = links.dropna(subset=["tmdbId"]).copy()
    links["tmdbId"] = links["tmdbId"].astype(int)
    links["item_key"] = "movie:" + links["movieId"].astype(str)
    links = links.loc[links["item_key"].isin(set(item_meta["item_key"]))]
    links = links.loc[~links["item_key"].isin(cached_keys)]
    if limit is not None:
        links = links.head(limit)

    rows = []
    headers = {"Authorization": f"Bearer {bearer_token}"}
    for row in tqdm(links.itertuples(index=False), total=len(links), desc="fetch tmdb descriptions"):
        try:
            r = requests.get(
                f"https://api.themoviedb.org/3/movie/{row.tmdbId}",
                headers=headers,
                timeout=20,
            )
            if r.status_code == 404:
                continue
            r.raise_for_status()
            data = r.json()
            rows.append(
                {
                    "item_key": row.item_key,
                    "tmdbId": row.tmdbId,
                    "description": data.get("overview") or "",
                }
            )
            if sleep_seconds:
                time.sleep(sleep_seconds)
        except requests.RequestException:
            continue

    if rows:
        cached = pd.concat([cached, pd.DataFrame(rows)], ignore_index=True)
        cached = cached.drop_duplicates("item_key", keep="last")
        cached.to_csv(cache_path, index=False)

    enriched = item_meta.copy()
    enriched = enriched.merge(cached[["item_key", "description"]], on="item_key", how="left", suffixes=("", "_tmdb"))
    if "description_tmdb" in enriched.columns:
        enriched["description"] = enriched["description_tmdb"].fillna(enriched.get("description", ""))
        enriched = enriched.drop(columns=["description_tmdb"])
    enriched["description"] = enriched["description"].fillna("")
    enriched["tokens"] = (
        enriched["tokens"].fillna("")
        + " "
        + enriched["description"].map(lambda x: _text_tokens(x, limit=80))
    )
    return enriched


def build_text_embedding_index(
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    batch_size: int = 128,
    device: str | None = None,
) -> tuple[torch.Tensor, torch.Tensor]:
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as exc:
        raise ImportError("Install sentence-transformers first: %pip install -q sentence-transformers") from exc

    n_items = max(item_to_idx.values()) + 1
    rows = []
    for row in tqdm(
        item_meta.itertuples(index=False),
        total=len(item_meta),
        desc="prepare text index",
        leave=False,
    ):
        item_id = item_to_idx.get(row.item_key)
        if item_id is None:
            continue
        description = getattr(row, "description", "") or ""
        text = f"{row.title}. {description} {getattr(row, 'tokens', '')}"
        rows.append((item_id, text))

    rows.sort(key=lambda x: x[0])
    ids = torch.tensor([r[0] for r in rows], dtype=torch.long)
    texts = [r[1] for r in rows]
    encoder = SentenceTransformer(model_name, device=device)
    emb = encoder.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        convert_to_tensor=True,
        normalize_embeddings=True,
    ).cpu()

    index = torch.zeros((n_items, emb.size(1)), dtype=torch.float32)
    index[ids] = emb
    return index, ids


@torch.no_grad()
def recommend_from_history(
    model: CLEPIDTN,
    item_index: torch.Tensor,
    history_ids: list[int],
    user_id: int | None,
    activity: int,
    cfg: RecConfig,
    k: int = 10,
    domain: str | None = None,
    anonymous_item_weight: float = 0.65,
    content_boost: float = 0.20,
    candidate_item_ids: torch.Tensor | None = None,
    text_index: torch.Tensor | None = None,
    text_weight: float = 0.25,
    title_boost: float = 0.25,
    history_weights: list[float] | None = None,
):
    model.eval()
    if candidate_item_ids is None:
        candidate_item_ids = item_index_ids(model)
    else:
        candidate_item_ids = candidate_item_ids.cpu().long()
    weighted_ids, weighted_values = _normalize_history_weights(history_ids, history_weights)
    positive_weighted_ids = [idx for idx, weight in zip(weighted_ids, weighted_values) if weight > 0]
    hist = positive_weighted_ids[-cfg.max_seq_len :]
    if not hist:
        # Fall back to all items when no positives exist (e.g. all neutral/negative).
        hist = weighted_ids[-cfg.max_seq_len :]
    if not hist:
        return []
    padded = [PAD] * (cfg.max_seq_len - len(hist)) + hist
    mask = [0] * (cfg.max_seq_len - len(hist)) + [1] * len(hist)
    user_tensor = None if user_id is None else torch.tensor([user_id], device=cfg.device)
    batch = {
        "history": torch.tensor([padded], device=cfg.device),
        "mask": torch.tensor([mask], dtype=torch.bool, device=cfg.device),
        "user": user_tensor,
        "activity": torch.tensor([min(activity, 8)], device=cfg.device),
    }
    user_vec, _, _ = model.user_features(
        batch["history"],
        batch["mask"],
        batch["user"],
        batch["activity"],
        anonymous=user_id is None,
    )
    if user_id is None and weighted_ids:
        hist_ids = torch.tensor(weighted_ids, device=cfg.device)
        hist_weights = torch.tensor(weighted_values, device=cfg.device, dtype=torch.float32).unsqueeze(1)
        hist_vec = model.item_features(hist_ids) * hist_weights
        hist_vec = hist_vec.sum(dim=0, keepdim=True)
        hist_vec = F.normalize(hist_vec, dim=-1)
        w = max(0.0, min(float(anonymous_item_weight), 1.0))
        user_vec = F.normalize((1.0 - w) * user_vec + w * hist_vec, dim=-1)
    # item_index now has shape (n_items, d) with PAD at index 0 — no offset needed.
    scores = (user_vec.cpu() @ item_index[candidate_item_ids].T).squeeze(0)
    if user_id is None and weighted_ids and content_boost > 0:
        item_tokens = model.item_token_ids[candidate_item_ids].cpu()
        pos_tokens = model.item_token_ids[[i for i, weight in zip(weighted_ids, weighted_values) if weight > 0]].cpu().flatten()
        neg_tokens = model.item_token_ids[[i for i, weight in zip(weighted_ids, weighted_values) if weight < 0]].cpu().flatten()
        pos_tokens = pos_tokens[(pos_tokens != PAD) & (pos_tokens != 1)].unique()
        neg_tokens = neg_tokens[(neg_tokens != PAD) & (neg_tokens != 1)].unique()
        if len(pos_tokens) > 0:
            overlap = torch.isin(item_tokens, pos_tokens).float().sum(dim=1)
            if len(neg_tokens) > 0:
                # Only penalize tokens that are exclusive to disliked items,
                # so shared tokens like "action" don't suppress liked genres.
                neg_only_tokens = neg_tokens[~torch.isin(neg_tokens, pos_tokens)]
                if len(neg_only_tokens) > 0:
                    overlap = overlap - torch.isin(item_tokens, neg_only_tokens).float().sum(dim=1)
            lengths = (item_tokens > 1).float().sum(dim=1).clamp_min(1.0)
            overlap = overlap / lengths.sqrt()
            scores = scores + float(content_boost) * overlap
    if text_index is None and getattr(model, "item_text_embeddings", None) is not None:
        text_index = model.item_text_embeddings.cpu()
    if text_index is not None and weighted_ids and text_weight > 0:
        hist_ids = torch.tensor(weighted_ids, dtype=torch.long)
        hist_weights = torch.tensor(weighted_values, dtype=torch.float32).unsqueeze(1)
        hist_text = (text_index[hist_ids] * hist_weights).sum(dim=0, keepdim=True)
        hist_text = F.normalize(hist_text, dim=-1)
        candidate_text = F.normalize(text_index[candidate_item_ids], dim=-1)
        text_scores = (hist_text @ candidate_text.T).squeeze(0)
        scores = scores + float(text_weight) * text_scores
    if user_id is None and positive_weighted_ids and title_boost > 0:
        hist_tokens = model.item_token_ids[positive_weighted_ids].cpu().flatten()
        item_tokens = model.item_token_ids[candidate_item_ids].cpu()
        hist_tokens = hist_tokens[(hist_tokens != PAD) & (hist_tokens != 1)].unique()
        if len(hist_tokens) > 0:
            # Title tokens are appended *last* in the token string, so use
            # the tail of the token tensor (the head contains genre/tag tokens).
            titleish = torch.isin(item_tokens[:, -12:], hist_tokens).float().sum(dim=1).clamp(max=3.0) / 3.0
            scores = scores + float(title_boost) * titleish
    if weighted_ids:
        blocked_items = torch.tensor(weighted_ids, dtype=torch.long)
        blocked = torch.isin(candidate_item_ids, blocked_items)
        scores[blocked] = -1e9
    if domain is not None:
        domain_to_idx = {"movie": 0, "game": 1}
        if domain not in domain_to_idx:
            raise ValueError(f"domain must be one of {sorted(domain_to_idx)}, got {domain!r}")
        item_domains = model.item_domain_ids[candidate_item_ids].cpu()
        domain_mask = item_domains == domain_to_idx[domain]
        if not domain_mask.any():
            raise ValueError(f"No {domain!r} candidates are available in this item index.")
        scores[~domain_mask] = -1e9
    valid_count = int((scores > -1e8).sum().item())
    if valid_count == 0:
        raise ValueError("No valid recommendation candidates remain after filtering.")
    k = min(k, valid_count)
    values, offsets = torch.topk(scores, k)
    item_ids = candidate_item_ids[offsets].tolist()
    return list(zip(item_ids, values.tolist()))


@torch.no_grad()
def evaluate_retrieval(
    model: CLEPIDTN,
    item_index: torch.Tensor,
    eval_rows: Sequence[tuple[int, list[int], int]],
    cfg: RecConfig,
    ks: Sequence[int] = (10, 50),
    candidate_item_ids: torch.Tensor | None = None,
    max_users: int | None = None,
    eval_batch_size: int = 256,
) -> dict[str, float]:
    """Batched evaluation — encodes users in GPU batches and scores with one matmul."""
    model.eval()
    max_k = max(ks)
    rows = eval_rows if max_users is None else eval_rows[:max_users]

    # Filter valid rows
    valid = [(u, h, t) for u, h, t in rows if h and t > 0]
    if not valid:
        return {"users": 0.0, "MRR": 0.0, **{f"HR@{k}": 0.0 for k in ks},
                **{f"Recall@{k}": 0.0 for k in ks}, **{f"NDCG@{k}": 0.0 for k in ks}}

    # Build candidate index on CPU
    if candidate_item_ids is None:
        candidate_item_ids = torch.arange(1, item_index.size(0))
    cand_vecs = item_index[candidate_item_ids]  # (n_cand, d)

    # Map targets to candidate offsets for fast lookup
    cand_id_to_offset = {int(cid): off for off, cid in enumerate(candidate_item_ids.tolist())}

    hits = {k: 0.0 for k in ks}
    ndcg = {k: 0.0 for k in ks}
    reciprocal_rank = 0.0
    total = 0

    for batch_start in range(0, len(valid), eval_batch_size):
        batch_rows = valid[batch_start : batch_start + eval_batch_size]
        B = len(batch_rows)

        # Pad histories and build masks
        padded_batch = []
        mask_batch = []
        user_batch = []
        activity_batch = []
        target_offsets = []  # offset in candidate_item_ids, or -1

        for user_id, history, target in batch_rows:
            h = history[-cfg.max_seq_len:]
            pad_len = cfg.max_seq_len - len(h)
            padded_batch.append([PAD] * pad_len + h)
            mask_batch.append([0] * pad_len + [1] * len(h))
            user_batch.append(user_id)
            activity_batch.append(min(len(history), 8))
            target_offsets.append(cand_id_to_offset.get(target, -1))

        # Encode users on GPU
        hist_t = torch.tensor(padded_batch, dtype=torch.long, device=cfg.device)
        mask_t = torch.tensor(mask_batch, dtype=torch.bool, device=cfg.device)
        user_t = torch.tensor(user_batch, dtype=torch.long, device=cfg.device)
        act_t = torch.tensor(activity_batch, dtype=torch.long, device=cfg.device)

        with torch.no_grad():
            user_vecs, _, _ = model.user_features(hist_t, mask_t, user_t, act_t)
            user_vecs = user_vecs.cpu()  # (B, d)

        # Score all candidates at once: (B, d) @ (d, n_cand) -> (B, n_cand)
        scores = user_vecs @ cand_vecs.T

        # Get top-k per user
        topk_vals, topk_idx = torch.topk(scores, min(max_k, scores.size(1)), dim=1)

        for i in range(B):
            target_off = target_offsets[i]
            if target_off < 0:
                continue  # target not in candidates
            total += 1
            ranked_offsets = topk_idx[i].tolist()
            if target_off in ranked_offsets:
                rank = ranked_offsets.index(target_off) + 1
                reciprocal_rank += 1.0 / rank
                for k in ks:
                    if rank <= k:
                        hits[k] += 1.0
                        ndcg[k] += 1.0 / math.log2(rank + 1)

    metrics = {"users": float(total), "MRR": reciprocal_rank / max(total, 1)}
    for k in ks:
        metrics[f"HR@{k}"] = hits[k] / max(total, 1)
        metrics[f"Recall@{k}"] = hits[k] / max(total, 1)
        metrics[f"NDCG@{k}"] = ndcg[k] / max(total, 1)
    return metrics


def build_popularity_rankings(
    interactions: pd.DataFrame,
    item_to_idx: dict[str, int],
    domain_by_item_key: dict[str, str] | None = None,
) -> dict[str | None, list[int]]:
    counts = interactions["item_key"].value_counts()
    rows = [(item_to_idx[key], int(count)) for key, count in counts.items() if key in item_to_idx]
    rows.sort(key=lambda value: value[1], reverse=True)
    rankings: dict[str | None, list[int]] = {None: [item_id for item_id, _ in rows]}
    if domain_by_item_key is not None:
        for domain in sorted(set(domain_by_item_key.values())):
            rankings[domain] = [
                item_to_idx[key]
                for key in counts.index
                if key in item_to_idx and domain_by_item_key.get(key) == domain
            ]
    return rankings


def evaluate_popularity_baseline(
    rankings: dict[str | None, list[int]] | list[int],
    eval_rows: Sequence[tuple[int, list[int], int]],
    ks: Sequence[int] = (10, 50),
) -> dict[str, float]:
    ranking = rankings[None] if isinstance(rankings, dict) else rankings
    max_k = max(ks)
    hits = {k: 0.0 for k in ks}
    ndcg = {k: 0.0 for k in ks}
    total = 0
    for _, history, target in tqdm(
        eval_rows,
        total=len(eval_rows),
        desc="evaluate popularity",
        leave=False,
    ):
        seen = set(history)
        candidates = [item_id for item_id in ranking if item_id not in seen][:max_k]
        total += 1
        if target in candidates:
            rank = candidates.index(target) + 1
            for k in ks:
                if rank <= k:
                    hits[k] += 1.0
                    ndcg[k] += 1.0 / math.log2(rank + 1)
    metrics = {"users": float(total)}
    for k in ks:
        metrics[f"Popularity_HR@{k}"] = hits[k] / max(total, 1)
        metrics[f"Popularity_NDCG@{k}"] = ndcg[k] / max(total, 1)
    return metrics


def build_token_knn_index(
    item_token_ids: torch.Tensor,
    candidate_item_ids: torch.Tensor | None = None,
) -> dict[int, set[int]]:
    if candidate_item_ids is None:
        candidate_item_ids = torch.arange(1, item_token_ids.size(0))
    index = {}
    candidate_ids = candidate_item_ids.tolist()
    for item_id in tqdm(candidate_ids, total=len(candidate_ids), desc="build token KNN", leave=False):
        tokens = item_token_ids[item_id]
        index[int(item_id)] = set(tokens[(tokens != PAD) & (tokens != 1)].tolist())
    return index


def recommend_item_knn(
    history_ids: list[int],
    token_index: dict[int, set[int]],
    k: int = 10,
    history_weights: list[float] | None = None,
) -> list[tuple[int, float]]:
    source_ids, weights = _normalize_history_weights(history_ids, history_weights)
    profile_scores: dict[int, float] = {}
    for item_id, weight in zip(source_ids, weights):
        if weight <= 0:
            continue
        for token in token_index.get(item_id, set()):
            profile_scores[token] = profile_scores.get(token, 0.0) + weight
    blocked = set(source_ids)
    rows = []
    denom = max(sum(abs(value) for value in profile_scores.values()) ** 0.5, 1.0)
    for item_id, tokens in tqdm(
        token_index.items(),
        total=len(token_index),
        desc="score token KNN",
        leave=False,
    ):
        if item_id in blocked:
            continue
        score = sum(profile_scores.get(token, 0.0) for token in tokens) / denom
        rows.append((item_id, float(score)))
    rows.sort(key=lambda value: value[1], reverse=True)
    return rows[:k]


def evaluate_survey_leave_one_out(
    profiles: Sequence[dict],
    model: CLEPIDTN,
    item_index: torch.Tensor,
    cfg: RecConfig,
    k: int = 10,
) -> dict[str, float]:
    hits, total = 0, 0
    for profile in tqdm(profiles, total=len(profiles), desc="evaluate survey", leave=False):
        positives = [
            rating
            for rating in profile["ratings"]
            if rating.get("item_id") is not None and rating["weight"] > 0
        ]
        if len(positives) < 2:
            continue
        target = positives[-1]["item_id"]
        history = [rating["item_id"] for rating in positives[:-1]]
        weights = [rating["weight"] for rating in positives[:-1]]
        try:
            recs = recommend_from_history(
                model,
                item_index,
                history,
                user_id=None,
                activity=len(history),
                cfg=cfg,
                k=k,
                history_weights=weights,
            )
        except (ValueError, RuntimeError):
            # Skip users whose history is too sparse or entirely negative
            # after weight normalization.
            continue
        if not recs:
            total += 1
            continue
        hits += int(target in [item_id for item_id, _ in recs])
        total += 1
    return {f"Survey_HR@{k}": hits / max(total, 1), "survey_users": float(total)}


def anonymous_history_from_titles(query_titles: list[str], item_meta: pd.DataFrame, item_to_idx: dict[str, int]) -> list[int]:
    out = []
    titles = item_meta[["item_key", "title"]].copy()
    titles["norm"] = titles["title"].fillna("").map(lambda x: re.sub(r"[^a-z0-9]+", " ", str(x).lower()).strip())
    for q in query_titles:
        qn = re.sub(r"[^a-z0-9]+", " ", q.lower()).strip()
        hit = titles.loc[titles["norm"].str.contains(re.escape(qn), na=False)].head(1)
        if not hit.empty:
            out.append(item_to_idx[hit.iloc[0]["item_key"]])
    return out


def anonymous_history_from_ratings(
    title_ratings: dict[str, float] | list[tuple[str, float]],
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
) -> tuple[list[int], list[float]]:
    pairs = title_ratings.items() if isinstance(title_ratings, dict) else title_ratings
    history_ids, ratings = [], []
    for title, rating in pairs:
        matched = anonymous_history_from_titles([title], item_meta, item_to_idx)
        if matched:
            history_ids.append(matched[0])
            ratings.append(float(rating))
    return history_ids, ratings


def item_from_external_id(
    source: str,
    external_id: int,
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
) -> dict:
    """Resolve a TMDB, RAWG, MovieLens, or Steam ID into the model catalog."""
    source = source.strip().lower()
    column_by_source = {
        "tmdb": "tmdb_id",
        "rawg": "rawg_id",
        "movielens": "item_key",
        "movie": "item_key",
        "steam": "item_key",
        "game": "item_key",
    }
    if source not in column_by_source:
        raise ValueError(f"source must be one of {sorted(column_by_source)}, got {source!r}")

    if source in {"movielens", "movie"}:
        matches = item_meta.loc[item_meta["item_key"].eq(f"movie:{int(external_id)}")]
    elif source in {"steam", "game"}:
        matches = item_meta.loc[item_meta["item_key"].eq(f"game:{int(external_id)}")]
    else:
        column = column_by_source[source]
        if column not in item_meta.columns:
            raise ValueError(
                f"{column!r} is unavailable. Build metadata with HF enrichment for RAWG "
                "or MovieLens links for TMDB."
            )
        numeric_ids = pd.to_numeric(item_meta[column], errors="coerce")
        matches = item_meta.loc[numeric_ids.eq(int(external_id))]

    matches = matches.loc[matches["item_key"].isin(item_to_idx)].copy()
    if matches.empty:
        raise KeyError(f"No catalog item mapped from {source} id {external_id}.")
    if len(matches) > 1:
        popularity = pd.to_numeric(matches.get("user_reviews"), errors="coerce").fillna(0)
        matches = matches.loc[[popularity.idxmax()]]
    row = matches.iloc[0]
    return {
        "item_id": int(item_to_idx[row["item_key"]]),
        "item_key": row["item_key"],
        "title": row["title"],
        "domain": row["domain"],
        "source": source,
        "external_id": int(external_id),
    }


def history_from_external_ratings(
    external_ratings: Sequence[tuple[str, int, float]],
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
    ignore_missing: bool = False,
) -> tuple[list[int], list[float], list[dict]]:
    """Resolve `(source, external_id, rating)` triples for anonymous inference."""
    history_ids, ratings, resolved = [], [], []
    for source, external_id, rating in external_ratings:
        try:
            item = item_from_external_id(source, external_id, item_meta, item_to_idx)
        except KeyError:
            if ignore_missing:
                continue
            raise
        history_ids.append(item["item_id"])
        ratings.append(float(rating))
        resolved.append(item)
    if not history_ids:
        raise ValueError("None of the supplied external IDs mapped to the model catalog.")
    return history_ids, ratings, resolved


def recommend_from_external_ratings(
    model: CLEPIDTN,
    item_index: torch.Tensor,
    external_ratings: Sequence[tuple[str, int, float]],
    item_meta: pd.DataFrame,
    item_to_idx: dict[str, int],
    cfg: RecConfig,
    k: int = 10,
    domain: str | None = None,
    text_index: torch.Tensor | None = None,
    ignore_missing: bool = False,
    **recommend_kwargs,
) -> tuple[list[tuple[int, float]], list[dict]]:
    history_ids, ratings, resolved = history_from_external_ratings(
        external_ratings,
        item_meta,
        item_to_idx,
        ignore_missing=ignore_missing,
    )
    # External ratings are 1-5 star ratings; convert to [-1, 1] weights
    # before passing to recommend_from_history.
    _, normalized_weights = _normalize_history_weights(
        history_ids, ratings, star_rating_scale=True,
    )
    recommendations = recommend_from_history(
        model,
        item_index,
        history_ids,
        user_id=None,
        activity=len(history_ids),
        cfg=cfg,
        k=k,
        domain=domain,
        text_index=text_index,
        history_weights=normalized_weights,
        **recommend_kwargs,
    )
    return recommendations, resolved


def maybe_enrich_with_rawg(app_id: int) -> dict:
    import requests

    key = os.getenv("RAWG_API_KEY")
    if not key:
        raise RuntimeError("Set RAWG_API_KEY before calling RAWG enrichment.")
    r = requests.get(f"https://api.rawg.io/api/games/{app_id}", params={"key": key}, timeout=20)
    r.raise_for_status()
    return r.json()


def maybe_enrich_with_tmdb(tmdb_id: int) -> dict:
    import requests

    token = os.getenv("TMDB_BEARER_TOKEN")
    if not token:
        raise RuntimeError("Set TMDB_BEARER_TOKEN before calling TMDB enrichment.")
    r = requests.get(
        f"https://api.themoviedb.org/3/movie/{tmdb_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=20,
    )
    r.raise_for_status()
    return r.json()
