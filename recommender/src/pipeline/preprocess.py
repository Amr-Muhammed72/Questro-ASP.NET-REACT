import pandas as pd

def unify_and_format_domain(df: pd.DataFrame, domain: str) -> pd.DataFrame:
    """
    Vectorized mapping of domain-specific schemas to a unified structure.
    Processes entire DataFrames at once for maximum speed.
    """
    df = df.copy()
    df['domain'] = domain
    
    if domain == "steam":
        df['id'] = 'steam_' + df['appID'].astype(str)
        df['type'] = 'game'
        df['title'] = df['name'].fillna('')
        
        df['creators'] = df['developers'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        
        clean_tags = df['tags'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        clean_genres = df['genres'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        df['themes'] = clean_tags + ", " + clean_genres
        
        df['narrative'] = df['short_description'].fillna('')
        
        adult_tags = df['tags'].astype(str).str.contains('NSFW|Nudity|Sexual Content|Hentai|Adult', case=False, na=False)
        req_age = pd.to_numeric(df.get('required_age', pd.Series(0, index=df.index)), errors='coerce').fillna(0)
        df['is_adult'] = (req_age >= 18) | adult_tags
        
    elif domain == "tmdb":
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
        df['is_adult'] = df.get('adult', False).fillna(False).astype(bool)
        
    elif domain == "rawg":
        df['id'] = 'rawg_' + df['id'].astype(str)
        df['type'] = 'game'
        df['title'] = df['name'].fillna('')
        
        df['creators'] = df['developers'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        df['themes'] = df['genres'].astype(str).fillna('') + ", " + df['tags'].astype(str).fillna('')
        
        if 'description_raw' in df.columns:
             df['narrative'] = df['description_raw'].fillna(df.get('description', ''))
        else:
             df['narrative'] = df['description'].fillna('')
             
        adult_tags = df['tags'].astype(str).str.contains('NSFW|Nudity|Sexual Content|Adult', case=False, na=False)
        mature_esrb = df.get('esrb_rating', pd.Series('', index=df.index)).astype(str).str.contains('Adults Only|Mature', case=False, na=False)
        df['is_adult'] = mature_esrb | adult_tags
             
    return df[['id', 'type', 'title', 'creators', 'themes', 'narrative', 'domain', 'is_adult']]