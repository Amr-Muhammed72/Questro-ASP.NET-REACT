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
        
        df['creators'] = df['developers'].astype(str).str.replace(r'[\[\]\']', '', regex=True).fillna('')
        
        clean_tags = df['tags'].astype(str).str.replace(r'[\[\]\']', '', regex=True).fillna('')
        clean_genres = df['genres'].astype(str).str.replace(r'[\[\]\']', '', regex=True).fillna('')
        df['themes'] = clean_tags + ", " + clean_genres
        
        df['narrative'] = df['short_description'].fillna('')
        
    elif domain == "tmdb":
        safe_titles = df['Title'].astype(str).str.replace(' ', '_').str.lower()
        df['id'] = 'tmdb_' + safe_titles
        df['type'] = 'movie'
        df['title'] = df['Title'].fillna('')
        df['creators'] = "" 
        df['themes'] = df['Genre'].fillna('')
        df['narrative'] = df['Overview'].fillna('')
        
    elif domain == "rawg":
        df['id'] = 'rawg_' + df['id'].astype(str)
        df['type'] = 'game'
        df['title'] = df['name'].fillna('')
        
        df['creators'] = df['developers'].astype(str).str.replace(r'[\[\]\']', '', regex=True).fillna('')
        df['themes'] = df['genres'].astype(str).fillna('') + ", " + df['tags'].astype(str).fillna('')
        
        if 'description_raw' in df.columns:
             df['narrative'] = df['description_raw'].fillna(df.get('description', ''))
        else:
             df['narrative'] = df['description'].fillna('')
             
    return df[['id', 'type', 'title', 'creators', 'themes', 'narrative', 'domain']]