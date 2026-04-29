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