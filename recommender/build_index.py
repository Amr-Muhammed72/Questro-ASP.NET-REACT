import os
import gc
import itertools
import pandas as pd

from dataset_downloader import get_all_datasets

from rag import CrossDomainRAGIndex
from util import generate_recommendation_prompt,batch_normalize_text, clean_disk
from preprocess import unify_and_format_domain

INDEX_FILE = "./data_cache/faiss_index.bin"
META_FILE = "./data_cache/metadata.json"

def get_unified_records(datasets: dict) -> list:
    
    steam_clean = unify_and_format_domain(datasets['steam'], "steam")
    tmdb_clean  = unify_and_format_domain(datasets['tmdb'], "tmdb")
    rawg_clean  = unify_and_format_domain(datasets['rawg'], "rawg")
    
    unified_df = pd.concat([steam_clean, tmdb_clean, rawg_clean], ignore_index=True)
    
    print(f"Applying text normalization to {len(unified_df)} records...")
    
    unified_df['norm_title'] = batch_normalize_text(unified_df['title'].astype(str))
    unified_df['norm_creators'] = batch_normalize_text(unified_df['creators'].astype(str))
    unified_df['norm_themes'] = batch_normalize_text(unified_df['themes'].astype(str))
    unified_df['norm_narrative'] = batch_normalize_text(unified_df['narrative'].astype(str))

    print("Building final embedding strings...")
    
    unified_df['embedding_text'] = (
        "Type: " + unified_df['type'] + ". " +
        "Title: " + unified_df['norm_title'] + ". " +
        "Creators: " + unified_df['norm_creators'] + ". " +
        "Themes: " + unified_df['norm_themes'] + ". " +
        "Narrative: " + unified_df['norm_narrative'] + "."
    )
    
    columns_to_keep = ['id', 'type', 'title', 'creators', 'themes', 'narrative', 'domain', 'embedding_text']
    final_df = unified_df[columns_to_keep]
    
    print(f"Successfully unified {len(final_df)} records.")
    
    return final_df.to_dict(orient='records')

if __name__ == "__main__":
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

