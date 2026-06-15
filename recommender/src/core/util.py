import re
import sys
from tqdm.auto import tqdm
import spacy
import shutil
import glob
import os

nlp = spacy.load("en_core_web_sm", disable=["tok2vec", "tagger", "parser", "ner"])



def batch_normalize_text(texts_list, column_name="Text"):
    """Batch normalizes text using spaCy lemmatization."""
    cleaned_texts = []

    pipe = nlp.pipe(texts_list, batch_size=256, n_process=4)

    for doc in tqdm(pipe, total=len(texts_list), desc=f"Processing {column_name}"):
        clean_string = " ".join([token.lemma_.lower() for token in doc if not token.is_punct])
        cleaned_texts.append(clean_string)

    return cleaned_texts
        

def normalize_text(text: str) -> str:
    """Processes a single query string using spaCy lemmatization."""
    if isinstance(text, list):
        text = " ".join([str(t) for t in text])
        
    doc = nlp(str(text)) 
    clean_text = " ".join([token.lemma_.lower() for token in doc if not token.is_punct])
    return clean_text

def generate_recommendation_prompt(user_query: str, retrieved_items: list, user: dict = None, blocked_genres: list = None) -> str:
    """Constructs the prompt for the Generation Phase, incorporating user context."""
    
    context = ""
    for i, item in enumerate(retrieved_items, 1):
        data      = item['data']
        year_str  = f" ({data['year']})"              if data.get('year')  else ''
        score_str = f" | Quality: {data['score']}/10" if data.get('score') else ''
        reviews   = data.get('review_count', 0)
        rev_str   = f" ({reviews:,} reviews)"         if reviews           else ''
        context += f"\n[{i}] {data['type'].upper()} | {data['title']}{year_str}{score_str}{rev_str}\n"
        context += f"Themes: {data['themes']}\n"
        context += f"Description: {data['narrative']}\n"

    profile_context = ""
    if user:
        profile_context = "User Background & Preferences:\n"
        for key in ["age", "gender", "profession", "country"]:
            if key in user and user[key]:
                profile_context += f"- {key.title()}: {user[key]}\n"
        
        for key in ["movie_genres_fav", "movie_genres_disliked", "game_genres_fav", "game_genres_disliked"]:
            if key in user and user[key]:
                profile_context += f"- {key.replace('_', ' ').title()}: {user[key].replace('|', ', ')}\n"

    blocked_context = ""
    if blocked_genres:
        blocked_context = f"CRITICAL RULE: Do NOT mention or recommend anything related to these blocked genres/themes: {', '.join(blocked_genres)}."

    prompt = f"""You are an expert cross-domain entertainment recommendation engine. 
    The user is looking for recommendations across both video games and movies.

    {profile_context}

    Current Request: "{user_query}"

    Here are the most semantically relevant items retrieved from our database (ranked by personalized score):
    {context}

    INSTRUCTIONS:
    1. Recommend 2-3 items from the provided database context that best match the current request.
    2. Personalize your pitch based on the User Background provided above. Explain why these specific items will appeal to their specific tastes, technical background, or interests.
    3. Only recommend items from the provided context list.
    {blocked_context}
    """
    return prompt

def clean_disk():
    """Cleans up temporary disk caches if needed."""
    parquet_files = glob.glob("../../data_cache/*.parquet")
    for file_path in parquet_files:
        try:
            os.remove(file_path)
            print(f"Deleted local cache: {file_path}")
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")

    hf_cache_dir = "../../hf_cache"
    if os.path.exists(hf_cache_dir):
        try:
            shutil.rmtree(hf_cache_dir)
            print("Deleted Hugging Face cache directory.")
        except Exception as e:
            print(f"Failed to delete {hf_cache_dir}: {e}")