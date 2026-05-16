import re
from tqdm.auto import tqdm
import spacy


# Load spaCy once
nlp = spacy.load("en_core_web_sm", disable=["parser", "ner"]) # Disable what you don't need!
def batch_normalize_text(texts_list, column_name="Text"):
    cleaned_texts = []
    
    pipe = nlp.pipe(texts_list, batch_size=128, n_process=4)
    
    for doc in tqdm(pipe, total=len(texts_list), desc=f"Processing {column_name}"): 
        clean_string = " ".join([token.lemma_.lower() for token in doc if not token.is_punct])
        cleaned_texts.append(clean_string)
        
    return cleaned_texts
        
def normalize_text(text_list):
    """Processes a large list of texts using spaCy's optimized pipe."""
    cleaned_texts = []
    
    # nlp.pipe processes text in massive chunks automatically
    for doc in nlp.pipe(text_list, batch_size=1000, n_process=2): 
        # Example: Lemmatize and make lowercase
        clean_text = " ".join([token.lemma_.lower() for token in doc if not token.is_punct])
        cleaned_texts.append(clean_text)
        
    return cleaned_texts

def generate_recommendation_prompt(user_query: str, retrieved_items: list, user_profile: dict = None) -> str:
    """Constructs the prompt for the Generation Phase, incorporating user context."""
    
    context = ""
    for i, item in enumerate(retrieved_items, 1):
        data = item['data']
        context += f"\n[{i}] Type: {data['type'].upper()} | Title: {data['title']}\n"
        context += f"Themes: {data['themes']}\n"
        context += f"Description: {data['narrative']}\n"

    # Format the user profile if one is provided
    profile_context = ""
    if user_profile:
        profile_context = "User Background & Preferences:\n"
        for key, value in user_profile.items():
            if isinstance(value, list):
                value = ", ".join(value)
            profile_context += f"- {key.replace('_', ' ').title()}: {value}\n"

    prompt = f"""You are an expert cross-domain entertainment recommendation engine. 
    The user is looking for recommendations across both video games and movies.

    {profile_context}

    Current Request: "{user_query}"

    Here are the most semantically relevant items retrieved from our database:
    {context}

    INSTRUCTIONS:
    1. Recommend 2-3 items from the provided database context that best match the current request.
    2. Personalize your pitch based on the User Background provided above. Explain why these specific items will appeal to their specific tastes, technical background, or interests.
    3. Only recommend items from the provided context list.
    """
    return prompt