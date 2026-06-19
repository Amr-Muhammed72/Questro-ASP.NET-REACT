import pandas as pd

def unify_and_format_domain(df: pd.DataFrame, domain: str) -> pd.DataFrame:
    """
    Vectorized mapping of domain-specific schemas to a unified structure.
    Processes entire DataFrames at once for maximum speed.
    
    Data Cleansing & Filtering:
    - Removes items with fewer than 5 reviews/ratings.
    - Removes rawg items published on 'itch.io'.
    - Implements dual-layer `is_adult` check: combines native dataset flags 
      with a regex scan for explicit themes/narratives (e.g., nsfw, sex, hentai).
    """
    df = df.copy()
    df['domain'] = domain

    if domain == "tmdb":
        df['id'] = 'tmdb_' + df['id'].astype(str)
        df['type'] = 'movie'
        df['title'] = df['title'].fillna('')
        # New dataset has no `director` col; use production companies instead
        df['creators'] = df['production_companies'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        # Combine genres and keywords for richer theme signal
        clean_genres   = df['genres'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        clean_keywords = df['keywords'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        df['themes'] = clean_genres + ", " + clean_keywords
        df['narrative'] = df['overview'].fillna('')
        adult_themes = df['themes'].astype(str).str.contains(r'\b(NSFW|Nudity|Sexual Content|Adult|sex)\b', case=False, na=False)
        df['is_adult'] = df.get('adult', pd.Series(False, index=df.index)).fillna(False).astype(bool) | adult_themes

        if 'vote_count' in df.columns:
            df = df[pd.to_numeric(df['vote_count'], errors='coerce').fillna(0) >= 5]
        
    elif domain == "rawg":
        if 'stores' in df.columns:
            df = df[~df['stores'].astype(str).str.contains('itch.io', case=False, na=False)]
            
        df['id'] = 'rawg_' + df['id'].astype(str)
        df['type'] = 'game'
        df['title'] = df['name'].fillna('')
        
        df['creators'] = df['developers'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        df['themes'] = df['genres'].astype(str).fillna('') + ", " + df['tags'].astype(str).fillna('')
        
        if 'description_raw' in df.columns:
             df['narrative'] = df['description_raw'].fillna(df.get('description', ''))
        else:
             df['narrative'] = df['description'].fillna('')
             
        adult_tags = df['tags'].astype(str).str.contains(r'\b(NSFW|Nudity|Sexual Content|Adult|sex)\b', case=False, na=False)
        mature_esrb = df.get('esrb_rating', pd.Series('', index=df.index)).astype(str).str.contains(r'\b(Adults Only|Mature)\b', case=False, na=False)
        df['is_adult'] = mature_esrb | adult_tags

        if 'ratings_count' in df.columns:
            df = df[pd.to_numeric(df['ratings_count'], errors='coerce').fillna(0) >= 5]
        elif 'reviews_count' in df.columns:
            df = df[pd.to_numeric(df['reviews_count'], errors='coerce').fillna(0) >= 5]
    df = df[['id', 'type', 'title', 'creators', 'themes', 'narrative', 'domain', 'is_adult']]
    
    for col in ['title', 'narrative']:
        df = df[df[col].astype(str).str.strip().replace('nan', '') != '']
        
    invalid_themes = ["", ",", ", ", "nan, nan", "nan, ", ", nan"]
    df = df[~df['themes'].astype(str).str.strip().isin(invalid_themes)]
    
    return df