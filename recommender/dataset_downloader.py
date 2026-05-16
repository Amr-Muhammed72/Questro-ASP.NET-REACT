import os
import pandas as pd
from datasets import load_dataset

CACHE_DIR = "./data_cache"
os.makedirs(CACHE_DIR, exist_ok=True)

def load_or_download_dataset(hf_repo: str, split: str, filename: str) -> pd.DataFrame:
    """Checks if the dataset exists locally. If not, downloads and caches it."""
    file_path = os.path.join(CACHE_DIR, filename)
    
    if os.path.exists(file_path):
        print(f"Loading {filename} directly from local cache...")
        return pd.read_parquet(file_path)
    else:
        print(f"Downloading {hf_repo} from Hugging Face...")
        df = load_dataset(hf_repo, cache_dir="./hf_cache", split=split).to_pandas()
        
        print(f"Saving {filename} to local cache for future use...")
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
        hf_repo="Pablinho/movies-dataset", 
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

