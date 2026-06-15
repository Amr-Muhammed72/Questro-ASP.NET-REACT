import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

import gc
import pandas as pd

from src.pipeline.dataset_downloader import get_all_datasets
from src.core.rag import CrossDomainRAGIndex
from src.core.util import generate_recommendation_prompt, clean_disk
from src.pipeline.preprocess import unify_and_format_domain

INDEX_FILE = "../../vector_store/faiss_index.bin"
META_FILE = "../../vector_store/metadata.db"

def get_unified_records(datasets: dict) -> list:
    
    steam_clean = unify_and_format_domain(datasets['steam'], "steam")
    tmdb_clean  = unify_and_format_domain(datasets['tmdb'], "tmdb")
    rawg_clean  = unify_and_format_domain(datasets['rawg'], "rawg")
    
    unified_df = pd.concat([steam_clean, tmdb_clean, rawg_clean], ignore_index=True)
    
    print("Building final embedding strings...")

    # Natural prose format — sentence transformers encode natural text better than labelled fields
    unified_df['embedding_text'] = (
        unified_df['title'].astype(str) + " is a " + unified_df['type'].astype(str) + ". " +
        unified_df['narrative'].astype(str) + " Themes and tags: " + unified_df['themes'].astype(str) + "."
    )
    
    columns_to_keep = ['id', 'type', 'title', 'creators', 'themes', 'narrative', 'domain', 'embedding_text', 'is_adult']
    final_df = unified_df[columns_to_keep]
    
    print(f"Successfully unified {len(final_df)} records.")
    
    return final_df.to_dict(orient='records')

if __name__ == "__main__":
    if not os.path.exists("./vector_store"):
        os.makedirs("./vector_store", exist_ok=True)
        
    rag_system = CrossDomainRAGIndex()

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

