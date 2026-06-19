"""
validate_dataset.py
-------------------
Validates the SCHEMA of all datasets by fetching only a tiny sample (10 rows).
Does NOT download the full dataset — use this before running build_index.py
to catch column-name mismatches early.

Usage:
    python validate_dataset.py
"""

import sys
from datasets import load_dataset

# ---------------------------------------------------------------------------
# Expected columns per dataset (minimum required by preprocess.py)
# ---------------------------------------------------------------------------
DATASETS = [
    {
        "name": "TMDB (ada-datadruids/full_tmdb_movies_dataset)",
        "hf_repo": "ada-datadruids/full_tmdb_movies_dataset",
        "required_cols": {"id", "title", "overview", "genres", "keywords", "production_companies"},
    },
    {
        "name": "RAWG (atalaydenknalbant/rawg-games-dataset)",
        "hf_repo": "atalaydenknalbant/rawg-games-dataset",
        "required_cols": {"id", "name", "developers", "genres", "tags"},
    },
]

SAMPLE_SIZE = 10  # rows — just enough to read the schema


def validate_schema(hf_repo: str, required_cols: set) -> tuple[bool, list]:
    """Loads 10 rows and checks that all required columns are present."""
    ds = load_dataset(hf_repo, split=f"train[:{SAMPLE_SIZE}]", cache_dir="./hf_cache")
    actual_cols = set(ds.column_names)
    missing = required_cols - actual_cols
    return (len(missing) == 0), sorted(actual_cols), sorted(missing)


def main():
    all_ok = True

    for ds in DATASETS:
        print(f"\n{'='*60}")
        print(f"  Validating schema: {ds['name']}")
        print(f"{'='*60}")

        try:
            ok, actual_cols, missing = validate_schema(ds["hf_repo"], ds["required_cols"])
        except Exception as e:
            print(f"  [FAIL] Could not load dataset: {e}")
            all_ok = False
            continue

        print(f"  Columns found : {actual_cols}")

        if missing:
            print(f"  [FAIL] Missing required columns: {missing}")
            all_ok = False
        else:
            print(f"  [PASS] All required columns present.")

    print(f"\n{'='*60}")
    if all_ok:
        print("  ✓ All schemas valid. Safe to run build_index.py.")
    else:
        print("  ✗ Schema validation failed. Fix column mappings in preprocess.py before building.")
        sys.exit(1)


if __name__ == "__main__":
    main()
