import os
import gc
import itertools
import pandas as pd

from dataset_downloader import get_all_datasets

from rag import CrossDomainRAGIndex
from util import generate_recommendation_prompt,batch_normalize_text
from preprocess import unify_and_format_domain

INDEX_FILE = "./data_cache/faiss_index.bin"
META_FILE = "./data_cache/metadata.json"

def get_unified_records(datasets: dict) -> list:
    
    # 1. Call the function in preprocess.py for each dataset
    steam_clean = unify_and_format_domain(datasets['steam'], "steam")
    tmdb_clean  = unify_and_format_domain(datasets['tmdb'], "tmdb")
    rawg_clean  = unify_and_format_domain(datasets['rawg'], "rawg")
    
    # 2. Combine them into one master DataFrame
    unified_df = pd.concat([steam_clean, tmdb_clean, rawg_clean], ignore_index=True)
    
    print(f"Applying text normalization to {len(unified_df)} records...")
    
    # 3. Apply normalization
    unified_df['norm_title'] = batch_normalize_text(unified_df['title'].astype(str))
    unified_df['norm_creators'] = batch_normalize_text(unified_df['creators'].astype(str))
    unified_df['norm_themes'] = batch_normalize_text(unified_df['themes'].astype(str))
    unified_df['norm_narrative'] = batch_normalize_text(unified_df['narrative'].astype(str))

    print("Building final embedding strings...")
    
    # 4. Construct the embedding text
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

# ==========================================
# prototype
# ==========================================
if __name__ == "__main__":
    rag_system = CrossDomainRAGIndex()

    if os.path.exists(INDEX_FILE) and os.path.exists(META_FILE):
        print("\nFound existing index on disk. Bypassing data generation...")
        rag_system.load(INDEX_FILE, META_FILE)
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

    active_user_profile = {
        "technical_background": "Full-time student who balances academics with a massive passion for comic books, superhero mythology, and video games.",
        "operating_system": "Windows 11",
        "core_interests": ["Action-adventure games", "Superhero lore (Marvel/DC)", "Comic book collecting", "Multiplayer gaming"],
        "gaming_vibe": "Lives for epic, story-driven games that make you feel like a hero (like Marvel's Spider-Man or the Batman: Arkham series) and enjoys jumping into co-op or competitive multiplayer matches with friends."
    }

    query = "I want a game or movie about batman"
    print(f"\nQuerying: '{query}'")

    results = rag_system.retrieve(query, top_k=5)
    
    llm_prompt = generate_recommendation_prompt(query, results, user_profile=active_user_profile)
    
    print("\n--- GENERATED LLM PROMPT ---")
    print(llm_prompt)