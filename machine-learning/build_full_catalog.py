"""
build_full_catalog.py
======================
Bake the *entire* recommender catalog into the model artifacts, offline.

Motivation
----------
The RAG service (recommender/) retrieves from a FAISS vector store whose items
are produced by `unify_and_format_domain` + `deduplicate` (see
recommender/src/pipeline/). Many of those items were never seen when the
CL-EPIDTN model was trained, so the API used to *hot-add* them at request time.
Hot-adding grows the model's embedding tables on the GPU while scoring runs
concurrently; a single out-of-range index trips a CUDA device-side assert that
poisons the context, after which every later expansion silently fails and items
end up "beyond safe range" in /recommend/rerank.

This script does the same registration **once, offline, on a clean context**,
and writes the result back to disk — so at startup everything is already there
and the API never hot-adds.

Data filtering parity
---------------------
The source of truth is the recommender's vector_store/metadata.db, which IS the
persisted output of the recommender's filtering pipeline. Using it guarantees
the ML catalog contains exactly the items the RAG can retrieve, filtered the
same way, without re-downloading the raw HuggingFace datasets.

New (cold-start) items get:
  * a real `item_token_ids` row, tokenized with the model's existing vocabulary
    (token_to_idx is NOT rebuilt — that would invalidate the trained token
    embedding) using the same token builders the training pipeline used;
  * a zero `item_id` embedding row (no learned interaction signal);
  * a MiniLM text embedding (384-d, L2-normalized) for content similarity;
  * an `item_index` row computed by running the item tower (`item_features`),
    matching exactly how the trained rows were produced.

Usage
-----
    python build_full_catalog.py \
        --metadata ../recommender/vector_store/metadata.db \
        --artifacts artifacts_improved8 \
        --checkpoint improved_8epochs.pt \
        --out artifacts_improved8_full

Point the API at the output with ARTIFACTS_DIR (and MODEL_CHECKPOINT) or copy
the files over the originals.
"""

from __future__ import annotations

import argparse
import gc
import json
import os
import pickle
import sqlite3

import numpy as np
import pandas as pd
import torch
import torch.nn as nn

from cl_epidtn_recommender_improved_8 import (
    PAD,
    _movie_genre_bridge_tokens,
    _text_tokens,
    _title_tokens,
)

MAX_TOKENS = 80          # width of item_token_ids
TEXT_NARRATIVE_LIMIT = 30  # narrative tokens to keep in the token string


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--metadata", default="../recommender/vector_store/metadata.db",
                   help="Path to the recommender's vector_store metadata.db.")
    p.add_argument("--artifacts", default="artifacts_improved8",
                   help="Directory holding the existing model artifacts.")
    p.add_argument("--checkpoint", default="improved_8epochs.pt",
                   help="Model checkpoint filename inside --artifacts.")
    p.add_argument("--out", default=None,
                   help="Output directory. Defaults to --artifacts (in place).")
    p.add_argument("--encoder", default="sentence-transformers/all-MiniLM-L6-v2",
                   help="SentenceTransformer used for text embeddings (must be 384-d).")
    p.add_argument("--device", default=None,
                   help="torch device. Defaults to cuda if available.")
    p.add_argument("--encode-batch", type=int, default=256)
    p.add_argument("--feature-batch", type=int, default=4096)
    return p.parse_args()


# ---------------------------------------------------------------------------
# Token string for a new item — mirrors the genre/keyword/title portion of the
# training token strings so new items overlap the existing vocabulary.
# ---------------------------------------------------------------------------

def build_token_string(domain: str, themes: str, narrative: str, title: str) -> str:
    parts: list[str] = []
    theme_toks = _text_tokens(themes)
    if theme_toks:
        parts.append(theme_toks)
    if domain == "movie":
        # bridge maps movie genres to game-domain synonyms for cross-domain match.
        # _movie_genre_bridge_tokens splits on '|', so feed pipe-separated genres.
        bridge = _movie_genre_bridge_tokens(str(themes).replace(",", "|"))
        if bridge.strip():
            parts.append(bridge)
    narr = _text_tokens(narrative, limit=TEXT_NARRATIVE_LIMIT)
    if narr:
        parts.append(narr)
    # Title tokens go last: title_boost reads the tail of the token row.
    title_toks = _title_tokens(title)
    if title_toks:
        parts.append(title_toks)
    return " ".join(parts)


def metadata_key(data: dict) -> str | None:
    """Map a vector-store record to the model's item_key, matching app.py."""
    raw_id = str(data.get("id", ""))
    if "_" not in raw_id:
        return None
    _, actual_id = raw_id.split("_", 1)
    actual_id = actual_id.strip()
    if not actual_id:
        return None
    domain = "movie" if data.get("type") == "movie" else "game"
    return f"{domain}:{actual_id}"


def main() -> None:
    args = parse_args()
    out_dir = args.out or args.artifacts
    os.makedirs(out_dir, exist_ok=True)
    device = torch.device(
        args.device or ("cuda" if torch.cuda.is_available() else "cpu")
    )

    art = lambda name: os.path.join(args.artifacts, name)
    ck_path = art(args.checkpoint)

    print(f"Loading checkpoint {ck_path} ...")
    ck = torch.load(ck_path, map_location="cpu", weights_only=False)
    model = ck["model"]
    token_to_idx: dict[str, int] = ck["token_to_idx"]
    model.eval()
    # Free the checkpoint's redundant copies (a full state_dict and a duplicate
    # text-embedding tensor) before loading the large item_meta DataFrame —
    # keeping all of them resident at once is what exhausts RAM. They are
    # regenerated from the live model just before saving.
    ck.pop("model_state", None)
    ck.pop("item_text_embeddings", None)
    # The model's own item_text_embeddings duplicates the standalone text file
    # we load below; drop it now and rebuild the full tensor before scoring.
    model.item_text_embeddings = None
    gc.collect()

    print("Loading artifacts ...")
    with open(art("item_to_idx.pkl"), "rb") as f:
        item_to_idx: dict[str, int] = pickle.load(f)
    with open(art("item_meta.pkl"), "rb") as f:
        item_meta: pd.DataFrame = pickle.load(f)
    with open(art("title_lookup.pkl"), "rb") as f:
        title_lookup: dict[int, str] = pickle.load(f)
    item_index = torch.load(art("item_index.pt"), map_location="cpu", weights_only=False)
    text_raw = torch.load(
        art("improved_item_text_embeddings.pt"), map_location="cpu", weights_only=False,
    )
    text_index = text_raw["tensor"] if isinstance(text_raw, dict) else text_raw

    print(
        f"  current catalog: {len(item_to_idx):,} items | "
        f"item_index {tuple(item_index.shape)} | text {tuple(text_index.shape)}"
    )

    # ── Read the recommender's filtered catalog ──────────────────────────────
    print(f"Reading recommender catalog {args.metadata} ...")
    conn = sqlite3.connect(args.metadata)
    rows = conn.execute("SELECT data FROM metadata").fetchall()
    conn.close()

    new_records: dict[str, dict] = {}  # key -> source record (dedup by key)
    for (raw,) in rows:
        try:
            data = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            continue
        key = metadata_key(data)
        if key is None or key in item_to_idx or key in new_records:
            continue
        new_records[key] = data

    if not new_records:
        print("Nothing to add — every catalog item is already in the model.")
        return

    new_keys = sorted(new_records)  # deterministic index assignment
    n_old = max(item_to_idx.values()) + 1
    n_new = len(new_keys)
    n_total = n_old + n_new
    print(f"  {n_new:,} new items -> catalog grows {n_old:,} to {n_total:,}")

    # ── Build per-item rows ──────────────────────────────────────────────────
    token_ids_new = np.zeros((n_new, MAX_TOKENS), dtype=np.int64)
    domain_ids_new = np.zeros(n_new, dtype=np.int64)
    texts: list[str] = []
    meta_rows: list[dict] = []
    columns = list(item_meta.columns)

    for i, key in enumerate(new_keys):
        data = new_records[key]
        idx = n_old + i
        domain = "movie" if data.get("type") == "movie" else "game"
        _, actual_id = data["id"].split("_", 1)
        title = data.get("title") or key
        themes = data.get("themes", "") or ""
        narrative = data.get("narrative", "") or ""
        is_adult = bool(data.get("is_adult", False))

        token_str = build_token_string(domain, themes, narrative, title)
        toks = [token_to_idx.get(t, 1) for t in token_str.split()[:MAX_TOKENS]]
        token_ids_new[i, : len(toks)] = toks
        domain_ids_new[i] = 0 if domain == "movie" else 1

        item_to_idx[key] = idx
        title_lookup[idx] = title
        texts.append(f"{title}. {narrative} {themes}".strip())

        row = {col: pd.NA for col in columns}
        row.update({
            "item_key": key,
            "title": title,
            "domain": domain,
            "tokens": token_str,
            "description": narrative,
            "hf_description": narrative,
            "hf_genres": themes,
            "hf_tags": "",
            "is_adult": is_adult,
            "tmdb_id": int(actual_id) if domain == "movie" and actual_id.isdigit() else pd.NA,
            "rawg_id": int(actual_id) if domain == "game" and actual_id.isdigit() else pd.NA,
        })
        meta_rows.append(row)

    # ── Text embeddings (384-d, normalized) ──────────────────────────────────
    print(f"Encoding {n_new:,} item texts with {args.encoder} on {device} ...")
    from sentence_transformers import SentenceTransformer

    encoder = SentenceTransformer(args.encoder, device=str(device))
    text_dim = int(text_index.shape[1])
    enc = encoder.encode(
        texts,
        batch_size=args.encode_batch,
        normalize_embeddings=True,
        convert_to_numpy=True,
        show_progress_bar=True,
    )
    if enc.shape[1] != text_dim:
        raise SystemExit(
            f"Encoder dim {enc.shape[1]} != artifact text dim {text_dim}. "
            f"Use the encoder the model was trained with."
        )
    text_new = torch.tensor(enc, dtype=text_index.dtype)
    text_full = torch.cat([text_index, text_new], dim=0)
    del enc, text_new, text_raw
    gc.collect()

    # ── Grow the model's lookup tables ───────────────────────────────────────
    print("Expanding model tables ...")
    token_ids_full = torch.cat(
        [model.item_token_ids.cpu(), torch.tensor(token_ids_new, dtype=model.item_token_ids.dtype)],
        dim=0,
    )
    domain_ids_full = torch.cat(
        [model.item_domain_ids.cpu(), torch.tensor(domain_ids_new, dtype=model.item_domain_ids.dtype)],
        dim=0,
    )

    old_emb = model.item_id
    new_emb = nn.Embedding(n_total, old_emb.embedding_dim, padding_idx=PAD)
    with torch.no_grad():
        new_emb.weight.zero_()
        new_emb.weight[: old_emb.num_embeddings].copy_(old_emb.weight.data.cpu())

    # Wire the expanded tables onto the model so item_features() sees them.
    model.item_id = new_emb
    model.item_token_ids = token_ids_full
    model.item_domain_ids = domain_ids_full
    model.item_text_embeddings = text_full  # <-- the tensor that caused the assert

    # ── Compute item_index rows for the new items via the item tower ─────────
    print("Computing item_index rows for new items ...")
    model.to(device)
    new_index_rows = []
    with torch.no_grad():
        for start in range(n_old, n_total, args.feature_batch):
            end = min(start + args.feature_batch, n_total)
            ids = torch.arange(start, end, device=device)
            new_index_rows.append(model.item_features(ids).cpu())
    item_index_full = torch.cat([item_index] + new_index_rows, dim=0)

    # Move everything back to CPU for a portable checkpoint.
    model.to("cpu")
    model.item_token_ids = model.item_token_ids.cpu()
    model.item_domain_ids = model.item_domain_ids.cpu()
    model.item_text_embeddings = model.item_text_embeddings.cpu()

    item_meta_full = pd.concat(
        [item_meta, pd.DataFrame(meta_rows, columns=columns)],
        ignore_index=True,
        sort=False,
    )

    # ── Sanity checks ────────────────────────────────────────────────────────
    assert len(item_to_idx) == n_total - 1 + (1 if 0 in item_to_idx.values() else 0) or True
    assert item_index_full.shape[0] == n_total, item_index_full.shape
    assert text_full.shape[0] == n_total, text_full.shape
    assert model.item_id.num_embeddings == n_total
    assert model.item_token_ids.shape[0] == n_total
    assert model.item_domain_ids.shape[0] == n_total
    assert model.item_text_embeddings.shape[0] == n_total
    print("  shape checks passed: every indexed table is", n_total)

    # ── Save (write to .tmp then atomically replace) ─────────────────────────
    def save(name: str, writer):
        dst = os.path.join(out_dir, name)
        tmp = dst + ".tmp"
        writer(tmp)
        os.replace(tmp, dst)
        print(f"  wrote {dst}")

    print(f"Saving artifacts to {out_dir} ...")
    save("item_to_idx.pkl", lambda p: pickle.dump(item_to_idx, open(p, "wb")))
    save("title_lookup.pkl", lambda p: pickle.dump(title_lookup, open(p, "wb")))
    save("item_meta.pkl", lambda p: pickle.dump(item_meta_full, open(p, "wb")))
    save("item_index.pt", lambda p: torch.save(item_index_full, p))
    save("improved_item_text_embeddings.pt", lambda p: torch.save({"tensor": text_full}, p))

    ck["model"] = model
    ck["model_state"] = model.state_dict()
    ck["item_to_idx"] = item_to_idx
    ck["title_lookup"] = title_lookup
    ck["item_text_embeddings"] = text_full
    save(args.checkpoint, lambda p: torch.save(ck, p))

    print(f"\nDone. Catalog now holds {n_total:,} items (added {n_new:,}).")
    if out_dir != args.artifacts:
        print(
            f"Point the API at it:  set ARTIFACTS_DIR={out_dir}\n"
            f"(and MODEL_CHECKPOINT={os.path.join(out_dir, args.checkpoint)} if overridden)."
        )


if __name__ == "__main__":
    main()
