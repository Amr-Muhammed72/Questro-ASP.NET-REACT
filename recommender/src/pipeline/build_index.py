import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import gc
import pandas as pd

from src.pipeline.dataset_downloader import get_all_datasets
from src.core.rag import CrossDomainRAGIndex
from src.core.util import generate_recommendation_prompt, clean_disk
from src.pipeline.preprocess import unify_and_format_domain

INDEX_FILE = "./vector_store/faiss_index.bin"
META_FILE = "./vector_store/metadata.db"

def deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    """
    1. Drop exact ID duplicates.
    2. Cross-source game dedup: RAWG takes priority over Steam for the same title.
       Same game in both sources produces near-identical vectors — keep RAWG
       since it carries richer descriptions and a normalised rating.
    """
    before = len(df)
    df = df.drop_duplicates(subset='id').copy()

    norm_title = (
        df['title'].str.lower()
        .str.replace(r'[^a-z0-9\s]', '', regex=True)
        .str.strip()
    )
    df['_norm_title'] = norm_title

    rawg_titles = set(df.loc[df['domain'] == 'rawg', '_norm_title'])
    steam_dupes = (df['domain'] == 'steam') & (df['_norm_title'].isin(rawg_titles))

    df = df[~steam_dupes].drop(columns='_norm_title').reset_index(drop=True)
    print(f"  [dedup] {before} -> {len(df)} items (dropped {before - len(df)} duplicates)")
    return df


def get_unified_records(datasets: dict) -> list:

    steam_clean = unify_and_format_domain(datasets['steam'], "steam")
    tmdb_clean  = unify_and_format_domain(datasets['tmdb'], "tmdb")
    rawg_clean  = unify_and_format_domain(datasets['rawg'], "rawg")

    unified_df = pd.concat([steam_clean, tmdb_clean, rawg_clean], ignore_index=True)

    print("Deduplicating cross-source entries...")
    unified_df = deduplicate(unified_df)
    
    print("Building final embedding strings...")

    # Natural prose format — sentence transformers encode natural text better than labelled fields
    unified_df['embedding_text'] = (
        unified_df['title'].astype(str) + " is a " + unified_df['type'].astype(str) + ". " +
        unified_df['narrative'].astype(str) + " Themes and tags: " + unified_df['themes'].astype(str) + "."
    )
    
    columns_to_keep = ['id', 'type', 'title', 'creators', 'themes', 'narrative',
                       'domain', 'embedding_text', 'is_adult', 'year', 'score', 'review_count']
    final_df = unified_df[columns_to_keep]
    
    print(f"Successfully unified {len(final_df)} records.")
    
    return final_df.to_dict(orient='records')

if __name__ == "__main__":
    if not os.path.exists("./vector_store"):
        os.makedirs("./vector_store", exist_ok=True)
        
    rag_system = CrossDomainRAGIndex()
    print(f"\nChecking for existing index on disk at {os.path.abspath(INDEX_FILE)}...")
    if os.path.exists(INDEX_FILE) and os.path.exists(META_FILE):
        print("\nFound existing index on disk. exiting...")
    else:
        print("\nNo index found. Building from scratch...")
        
        datasets = get_all_datasets()
        
        print("\nFormatting records for unified semantic space...")
        
        unified_records = get_unified_records(datasets)
        print(f"Successfully formatted {len(unified_records)} records.")

        print("Freeing RAM: Deleting raw datasets...")
        del datasets
        gc.collect()

        print("\nInitializing Vector Index...")
        rag_system.build_index(unified_records)

        print("\nSaving index to disk...")
        rag_system.save(INDEX_FILE, META_FILE)

        print("Freeing RAM: Deleting unified records array...")
        del unified_records
        gc.collect()
        print("\nCleaning up cached dataset files from disk...")
        clean_disk()
        print("\nIndex built and saved on disk. exiting...")

