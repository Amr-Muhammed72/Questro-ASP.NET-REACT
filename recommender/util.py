import re
import spacy


nlp = spacy.load("en_core_web_sm")

def normalize_text(text: str) -> str:
    """Cleans, tokenizes, and lemmatizes text."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = " ".join(text.split())
    
    doc = nlp(text)
    tokens = [token.lemma_ for token in doc if token.is_alpha and not token.is_stop]
    return " ".join(tokens)

def generate_recommendation_prompt(user_query: str, retrieved_items: list) -> str:
    """Constructs the prompt for the Generation Phase."""
    
    context = ""
    for i, item in enumerate(retrieved_items, 1):
        data = item['data']
        context += f"\n[{i}] Type: {data['type'].upper()} | Title: {data['title']}\n"
        context += f"Themes: {data['themes']}\n"
        context += f"Description: {data['narrative']}\n"

    prompt = f"""You are an expert cross-domain entertainment recommendation engine. 
The user is looking for recommendations across both video games and movies.

User Query: "{user_query}"

Here are the most semantically relevant items retrieved from our database:
{context}

Based ONlY on the context provided above, recommend 2-3 items that best match the user's query. 
Explain exactly why these specific games and movies share thematic overlap and why the user would enjoy them based on their prompt.
"""
    return prompt

