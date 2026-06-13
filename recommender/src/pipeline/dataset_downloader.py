import os
import pandas as pd
from datasets import load_dataset

CACHE_DIR = "./data_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def load_or_download_dataset(hf_repo: str, split: str, filename: str) -> pd.DataFrame:
    """Checks if the dataset exists locally and is the full split. If not, loads/caches it."""
    file_path = os.path.join(CACHE_DIR, filename)
    
    if os.path.exists(file_path):
        df = pd.read_parquet(file_path)
        if len(df) > 1000:
            print(f"Loading full {filename} directly from local cache (rows: {len(df)})...")
            return df
        print(f"Old 1000-row slice found for {filename}. Overwriting with full split...")
    
    print(f"Loading full {hf_repo} split '{split}' from Hugging Face cache...")
    if hf_repo == "atalaydenknalbant/rawg-games-dataset":
        rawg_local_path = "./hf_cache/raw_parquets/rawg_games_cached_full.parquet"
        if os.path.exists(rawg_local_path):
            print(f"Loading full RAWG dataset directly from local parquet {rawg_local_path}...")
            df = pd.read_parquet(rawg_local_path)
        else:
            df = load_dataset(hf_repo, split=split, cache_dir="./hf_cache").to_pandas()
    else:
        df = load_dataset(hf_repo, split=split, cache_dir="./hf_cache").to_pandas()
        
    print(f"Saving full {filename} to local cache (rows: {len(df)})...")
    df.to_parquet(file_path, index=False)
    return df

def get_all_datasets() -> dict:
    """Loads all datasets and returns them as lists of dictionaries for the RAG pipeline."""
    print("Initializing Local Dataset Pipeline...\n")

    df_steam = load_or_download_dataset(
        hf_repo="FronkonGames/steam-games-dataset", 
        split="train", 
        filename="steam_games_cached.parquet"
    )

    df_tmdb = load_or_download_dataset(
        hf_repo="ada-datadruids/full_tmdb_movies_dataset",
        split="train",
        filename="tmdb_movies_cached.parquet"
    )

    df_rawg = load_or_download_dataset(
        hf_repo="atalaydenknalbant/rawg-games-dataset", 
        split="train", 
        filename="rawg_games_cached.parquet"
    )

    print("\nAll datasets loaded and ready!")
    
    return {
        "steam": df_steam,
        "tmdb": df_tmdb,
        "rawg": df_rawg
    }

