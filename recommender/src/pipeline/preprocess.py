import pandas as pd
import numpy as np

# ---- helpers ----------------------------------------------------------------

def _safe_col(df, col, default=0):
    """Return df[col] if it exists, else a Series of `default` values."""
    if col in df.columns:
        return df[col]
    return pd.Series(default, index=df.index)

def _safe_numeric(df, col, default=0):
    if col in df.columns:
        return pd.to_numeric(df[col], errors='coerce').fillna(default)
    return pd.Series(float(default), index=df.index)

def _extract_year(date_series):
    """Extract 4-digit year from a date string Series. Returns 0 if not found."""
    return (
        date_series.astype(str)
        .str.extract(r'(\d{4})')[0]
        .fillna(0)
        .astype(int)
    )

def _join_themes(a: pd.Series, b: pd.Series) -> pd.Series:
    """Vectorized comma-join that skips empty parts — fixes leading/trailing comma bug."""
    a_clean = a.str.strip()
    b_clean = b.str.strip()
    return pd.Series(np.where(
        (a_clean.str.len() > 0) & (b_clean.str.len() > 0),
        a_clean + ', ' + b_clean,
        np.where(a_clean.str.len() > 0, a_clean, b_clean)
    ), index=a.index)

# ---- filter thresholds ------------------------------------------------------

STEAM_MIN_REVIEWS   = 10
STEAM_MIN_POS_RATIO = 0.4
STEAM_MIN_DESC_LEN  = 50

TMDB_MIN_VOTES      = 50
TMDB_MIN_SCORE      = 3.0
TMDB_MIN_DESC_LEN   = 80

RAWG_MIN_RATINGS    = 10
RAWG_MIN_RATING     = 2.0
RAWG_MIN_DESC_LEN   = 50

OUTPUT_COLS = ['id', 'type', 'title', 'creators', 'themes', 'narrative',
               'domain', 'is_adult', 'year', 'score', 'review_count']

# ---- main -------------------------------------------------------------------

def unify_and_format_domain(df: pd.DataFrame, domain: str) -> pd.DataFrame:
    """
    Vectorized mapping of domain-specific schemas to a unified structure.
<<<<<<< HEAD
    Applies hard quality filters before processing to drop low-signal items.
    Enriches metadata with year, score, and review_count for LLM context.
=======
    Processes entire DataFrames at once for maximum speed.
    
    Data Cleansing & Filtering:
    - Removes items with fewer than 5 reviews/ratings.
    - Removes rawg items published on 'itch.io'.
    - Implements dual-layer `is_adult` check: combines native dataset flags 
      with a regex scan for explicit themes/narratives (e.g., nsfw, sex, hentai).
>>>>>>> 4682080d2974c31bd23c08aa87f6c2a14f3c35c3
    """
    df = df.copy()
    df['domain'] = domain

    if domain == "steam":
        # Quality filter — skip gracefully if review columns are absent
        desc_len = df['short_description'].fillna('').str.len()
        has_review_cols = 'positive' in df.columns and 'negative' in df.columns
        if has_review_cols:
            positive  = _safe_numeric(df, 'positive')
            negative  = _safe_numeric(df, 'negative')
            total     = positive + negative
            pos_ratio = (positive / total.replace(0, np.nan)).fillna(0)
            quality_mask = (
                (total     >= STEAM_MIN_REVIEWS) &
                (pos_ratio >= STEAM_MIN_POS_RATIO) &
                (desc_len  >= STEAM_MIN_DESC_LEN)
            )
        else:
            quality_mask = desc_len >= STEAM_MIN_DESC_LEN
            positive  = pd.Series(0.0, index=df.index)
            total     = pd.Series(0.0, index=df.index)

        before = len(df)
        df       = df[quality_mask].copy()
        positive = positive[quality_mask]
        total    = total[quality_mask]
        print(f"  [steam] quality filter: {before} → {len(df)} items kept")

        df['id']       = 'steam_' + df['appID'].astype(str)
        df['type']     = 'game'
        df['title']    = df['name'].fillna('')
        df['creators'] = df['developers'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')

        clean_tags   = df['tags'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        clean_genres = df['genres'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        df['themes']    = _join_themes(clean_tags, clean_genres)
        df['narrative'] = df['short_description'].fillna('')
<<<<<<< HEAD

        df['score']        = (positive / total.replace(0, np.nan) * 10).fillna(0).round(1)
        df['review_count'] = total.astype(int)
        df['year']         = _extract_year(_safe_col(df, 'release_date', ''))

        adult_tags   = df['tags'].astype(str).str.contains('NSFW|Nudity|Sexual Content|Hentai|Adult', case=False, na=False)
        req_age      = _safe_numeric(df, 'required_age')
        df['is_adult'] = (req_age >= 18) | adult_tags

=======
        
        adult_tags = df['tags'].astype(str).str.contains(r'\b(NSFW|Nudity|Sexual Content|Hentai|Adult|sex)\b', case=False, na=False)
        req_age = pd.to_numeric(df.get('required_age', pd.Series(0, index=df.index)), errors='coerce').fillna(0)
        df['is_adult'] = (req_age >= 18) | adult_tags

        if 'positive' in df.columns and 'negative' in df.columns:
            total_reviews = pd.to_numeric(df['positive'], errors='coerce').fillna(0) + pd.to_numeric(df['negative'], errors='coerce').fillna(0)
            df = df[total_reviews >= 5]
        elif 'recommendations' in df.columns:
            df = df[pd.to_numeric(df['recommendations'], errors='coerce').fillna(0) >= 5]
        
>>>>>>> 4682080d2974c31bd23c08aa87f6c2a14f3c35c3
    elif domain == "tmdb":
        vote_count = _safe_numeric(df, 'vote_count')
        vote_avg   = _safe_numeric(df, 'vote_average')
        desc_len   = df['overview'].fillna('').str.len()

        quality_mask = (
            (vote_count >= TMDB_MIN_VOTES) &
            (vote_avg   >= TMDB_MIN_SCORE) &
            (desc_len   >= TMDB_MIN_DESC_LEN)
        )
        before = len(df)
        df         = df[quality_mask].copy()
        vote_count = vote_count[quality_mask]
        vote_avg   = vote_avg[quality_mask]
        print(f"  [tmdb]  quality filter: {before} → {len(df)} items kept")

        df['id']       = 'tmdb_' + df['id'].astype(str)
        df['type']     = 'movie'
        df['title']    = df['title'].fillna('')
        df['creators'] = df['production_companies'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')

        clean_genres   = df['genres'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        clean_keywords = df['keywords'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')
        df['themes']    = _join_themes(clean_genres, clean_keywords)
        df['narrative'] = df['overview'].fillna('')
<<<<<<< HEAD

        df['score']        = vote_avg.round(1)
        df['review_count'] = vote_count.astype(int)
        df['year']         = _extract_year(_safe_col(df, 'release_date', ''))
        df['is_adult']     = _safe_col(df, 'adult', False).fillna(False).astype(bool)

    elif domain == "rawg":
        rating        = _safe_numeric(df, 'rating')
        ratings_count = _safe_numeric(df, 'ratings_count')

        narrative_col = df['description_raw'] if 'description_raw' in df.columns else _safe_col(df, 'description', '')
        desc_len = narrative_col.fillna('').str.len()

        quality_mask = (
            (ratings_count >= RAWG_MIN_RATINGS) &
            (rating        >= RAWG_MIN_RATING) &
            (desc_len      >= RAWG_MIN_DESC_LEN)
        )
        before        = len(df)
        df            = df[quality_mask].copy()
        rating        = rating[quality_mask]
        ratings_count = ratings_count[quality_mask]
        print(f"  [rawg]  quality filter: {before} → {len(df)} items kept")

        df['id']       = 'rawg_' + df['id'].astype(str)
        df['type']     = 'game'
        df['title']    = df['name'].fillna('')
=======
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
        
>>>>>>> 4682080d2974c31bd23c08aa87f6c2a14f3c35c3
        df['creators'] = df['developers'].astype(str).str.replace(r"[\[\]']", '', regex=True).fillna('')

        clean_genres = df['genres'].astype(str).fillna('')
        clean_tags   = df['tags'].astype(str).fillna('')
        df['themes']  = _join_themes(clean_genres, clean_tags)

        if 'description_raw' in df.columns:
            df['narrative'] = df['description_raw'].fillna(_safe_col(df, 'description', ''))
        else:
<<<<<<< HEAD
            df['narrative'] = df['description'].fillna('')

        df['score']        = (rating * 2).round(1)  # 0-5 → 0-10
        df['review_count'] = ratings_count.astype(int)
        df['year']         = _extract_year(_safe_col(df, 'released', ''))

        adult_tags   = df['tags'].astype(str).str.contains('NSFW|Nudity|Sexual Content|Adult', case=False, na=False)
        mature_esrb  = _safe_col(df, 'esrb_rating', '').astype(str).str.contains('Adults Only|Mature', case=False, na=False)
        df['is_adult'] = mature_esrb | adult_tags

    return df[OUTPUT_COLS]
=======
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
>>>>>>> 4682080d2974c31bd23c08aa87f6c2a14f3c35c3
