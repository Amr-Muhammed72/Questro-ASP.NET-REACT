import os
import gc
import itertools

from dataset_downloader import get_all_datasets
from concurrent.futures import ProcessPoolExecutor

from rag import CrossDomainRAGIndex
from preprocess import unify_and_format_record
from util import generate_recommendation_prompt


INDEX_FILE = "./data_cache/faiss_index.bin"
META_FILE = "./data_cache/metadata.json"


def get_unified_records(datasets):
   

    steam_args = zip(datasets['steam'], itertools.repeat("steam"))
    tmdb_args = zip(datasets['tmdb'], itertools.repeat("tmdb"))
    rawg_args = zip(datasets['rawg'], itertools.repeat("rawg"))

    all_args = itertools.chain(steam_args, tmdb_args, rawg_args)

    def process_wrapper(args):
        record, domain = args
        return unify_and_format_record(record, domain)

    unified_records = []

    with ProcessPoolExecutor() as executor:
        results = executor.map(process_wrapper, all_args, chunksize=1000)
        unified_records.extend(results)
    return unified_records

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
        "technical_background": "Software developer and competitive programmer with a strong interest in high-performance computing, advanced algorithms, and graph theory.",
        "operating_system": "Arch Linux",
        "core_interests": ["Data structures", "Backend architecture", "Complex logic", "Algorithm optimization"],
        "gaming_vibe": "Enjoys working on projects involving complex logic and has a preference for systems that require mechanical depth and optimization."
    }

    query = "I want a game or movie about complex interconnected systems or optimization."
    print(f"\nQuerying: '{query}'")

    results = rag_system.retrieve(query, top_k=5)
    
    llm_prompt = generate_recommendation_prompt(query, results, user_profile=active_user_profile)
    
    print("\n--- GENERATED LLM PROMPT ---")
    print(llm_prompt)