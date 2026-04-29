from util import normalize_text

def unify_and_format_record(record: dict, domain: str) -> dict:
    """Maps domain-specific schemas to a unified structure and formats for embedding."""
    
    unified = {}
    
    if domain == "steam":
        unified['id'] = f"steam_{record.get('appid')}"
        unified['type'] = "game"
        unified['title'] = record.get('name', '')
        unified['creators'] = record.get('developer', '')
        
        tags = record.get('tags')
        genres = record.get('genres')
        
        tags_list = tags.tolist() if hasattr(tags, 'tolist') else list(tags) if isinstance(tags, (list, tuple)) else []
        genres_list = genres.tolist() if hasattr(genres, 'tolist') else list(genres) if isinstance(genres, (list, tuple)) else []
        
        themes = tags_list + genres_list
        unified['themes'] = ", ".join([str(t) for t in themes])
        
        unified['narrative'] = str(record.get('short_description', ''))
        
    elif domain == "tmdb":
        safe_title = str(record.get('Title', '')).replace(' ', '_').lower()
        unified['id'] = f"tmdb_{safe_title}"
        unified['type'] = "movie"
        unified['title'] = str(record.get('Title', ''))
        unified['creators'] = "" 
        unified['themes'] = str(record.get('Genre', ''))
        unified['narrative'] = str(record.get('Overview', ''))
        
    elif domain == "rawg":
        unified['id'] = f"rawg_{record.get('id')}"
        unified['type'] = "game"
        unified['title'] = str(record.get('name', ''))
        
        devs = record.get('developers', '')
        unified['creators'] = ", ".join(devs) if isinstance(devs, list) else str(devs)
        
        genres = str(record.get('genres', ''))
        tags = str(record.get('tags', ''))
        unified['themes'] = f"{genres}, {tags}".strip(", ")
        
        unified['narrative'] = str(record.get('description_raw', '')) or str(record.get('description', ''))

    normalized_title = normalize_text(unified['title'])
    normalized_creators = normalize_text(unified['creators'])
    normalized_themes = normalize_text(unified['themes'])
    normalized_narrative = normalize_text(unified['narrative'])

    embedding_string = (
        f"Type: {unified['type']}. "
        f"Title: {normalized_title}. "
        f"Creators: {normalized_creators}. "
        f"Themes: {normalized_themes}. "
        f"Narrative: {normalized_narrative}."
    )
    
    unified['embedding_text'] = embedding_string
    return unified