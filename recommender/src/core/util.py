import shutil
import glob
import os
from textwrap import dedent

def generate_recommendation_prompt(user_query: str, retrieved_items: list, user: dict = None, blocked_genres: list = None) -> str:
    """Constructs the prompt for the Generation Phase, incorporating user context."""

    if retrieved_items:
        context_lines = []
        for i, item in enumerate(retrieved_items, 1):
            data = item['data']
            context_lines.append(
                f"[{i}] Type: {data['type'].upper()} | Title: {data['title']} | Relevance: {item.get('score', 0):.2f}\n"
                f"    Themes: {data['themes']}\n"
                f"    Description: {data['narrative']}"
            )
        context = "\n\n".join(context_lines)
    else:
        context = "(No items were retrieved for this request.)"

    profile_context = "No profile information was provided; rely on the current request alone."
    if user:
        profile_lines = []
        for key in ["age", "gender", "profession", "country"]:
            if user.get(key):
                profile_lines.append(f"- {key.title()}: {user[key]}")
        for key in ["movie_genres_fav", "movie_genres_disliked", "game_genres_fav", "game_genres_disliked"]:
            if user.get(key):
                profile_lines.append(f"- {key.replace('_', ' ').title()}: {user[key].replace('|', ', ')}")
        if profile_lines:
            profile_context = "\n".join(profile_lines)

    blocked_context = ""
    if blocked_genres:
        blocked_context = (
            "\nHARD CONSTRAINT: The following genres/themes are blocked. Never recommend, "
            f"mention, or allude to anything related to them: {', '.join(blocked_genres)}."
        )

    prompt = dedent(f"""\
        You are an expert cross-domain entertainment concierge. You recommend across both
        video games and movies, and you excel at finding non-obvious connections between the
        two — pairing a game's mechanics or mood with a film's tone, or vice versa.

        ## User profile
        {profile_context}

        ## Current request
        "{user_query}"

        ## Candidate items (retrieved from our catalog, ordered by relevance to the request)
        {context}

        ## How to respond
        1. Recommend the 2-3 candidates above that best fit the current request. Pick fewer
           than 3 rather than padding with weak matches; if nothing genuinely fits, say so
           honestly instead of forcing a recommendation.
        2. For each pick, give a short, vivid pitch (1-3 sentences) tied to *this* user: connect
           it to their stated request and, where relevant, their tastes, profession, or background.
           Reference the user's favored genres as a plus and steer clear of their disliked ones.
        3. Recommend ONLY items from the candidate list — never invent titles or details, and
           never rely on facts not present above.
        4. Lead with your top pick. Keep the tone warm and conversational, not a bulleted data dump.
        5. Output ONLY the final message addressed directly to the user ("you"). Do not restate
           these instructions, expose your reasoning, or mention scores, retrieval, or the catalog.{blocked_context}
        """)
    return prompt

def clean_disk():
    """Cleans up temporary disk caches if needed."""
    parquet_files = glob.glob("./data_cache/*.parquet")
    for file_path in parquet_files:
        try:
            os.remove(file_path)
            print(f"Deleted local cache: {file_path}")
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")

    hf_cache_dir = "./hf_cache"
    if os.path.exists(hf_cache_dir):
        try:
            shutil.rmtree(hf_cache_dir)
            print("Deleted Hugging Face cache directory.")
        except Exception as e:
            print(f"Failed to delete {hf_cache_dir}: {e}")