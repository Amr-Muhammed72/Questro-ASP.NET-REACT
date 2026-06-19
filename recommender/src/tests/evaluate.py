"""
evaluate.py
-----------
Full-pipeline evaluation for:
  FAISS retrieval → ML reranking (user history) → Gemini LLM response

Every query includes a realistic user profile so the ML reranking step is
actually exercised. The `no_profile` category omits user data to establish
a FAISS-only baseline you can diff against the personalized results.

Pipeline (from README + ML API docs):
  1. POST /api/recommend with {query, user, k, blocked_genres, allow_adult}
  2. RAG retrieves retrieve_k=max(k*4, 20) FAISS candidates
  3. RAG hot-adds unknown candidates to ML catalog via POST /catalog/add
  4. ML API (POST /recommend/rerank) re-ranks candidates by user history
  5. Top k re-ranked items + Gemini LLM response returned

item_id format (ML API):
  Games  → "game_{steam_app_id}"    e.g. "game_292030"  (The Witcher 3)
  Movies → "movie_{tmdb_id}"        e.g. "movie_27205"  (Inception)

Usage:
    cd recommender
    python -m src.tests.evaluate [--url http://localhost:5000] [--k 5]
    python -m src.tests.evaluate --category ground_truth
    python -m src.tests.evaluate --no-profile   # baseline: disable ML reranking
"""

import argparse
import json
import os
import time
import requests

API_URL     = "https://bluocaroot-questro-rag.hf.space/"
DEFAULT_K   = 5


# ── User Personas ─────────────────────────────────────────────────────────────
# Six distinct taste profiles. Each query references one by key.
# Ratings use the ML API format: game_{steam_app_id} / movie_{tmdb_id}.
# Stars 1–5 | source "wishlist" = would play | source "ignore" = blocked.

USERS = {

    # Dark-RPG / Soulslike gamer. Rarely watches films.
    "alex": {
        "age": 26, "gender": "Male", "profession": "Software Engineer", "country": "Germany",
        "game_genres_fav": "RPG|Action|Adventure|Dark Fantasy|Atmospheric",
        "game_genres_disliked": "Sports|Racing|Educational|Card Game",
        "movie_genres_fav": "Action|Adventure|Fantasy|Thriller",
        "movie_genres_disliked": "Romance|Animation|Comedy",
        "ratings": [
            {"item_id": "game_374320", "title": "Dark Souls III",           "stars": 5.0},
            {"item_id": "game_292030", "title": "The Witcher 3: Wild Hunt", "stars": 5.0},
            {"item_id": "game_367520", "title": "Hollow Knight",            "stars": 4.5},
            {"item_id": "game_1145360","title": "Hades",                    "stars": 4.5},
            {"item_id": "game_632470", "title": "Disco Elysium",            "stars": 5.0},
            {"item_id": "game_17410",  "title": "Mirror's Edge",            "stars": 4.0},
            {"item_id": "movie_197",   "title": "Braveheart",               "stars": 4.5},
            {"item_id": "movie_28",    "title": "Apocalypse Now",           "stars": 4.5},
            {"item_id": "game_1091500","title": "Cyberpunk 2077",           "source": "wishlist"},
        ],
    },

    # Cinephile, casual gamer. Loves sci-fi and psychological thrillers.
    "maria": {
        "age": 31, "gender": "Female", "profession": "Journalist", "country": "France",
        "movie_genres_fav": "Science Fiction|Thriller|Mystery|Drama",
        "movie_genres_disliked": "Horror|Comedy|Animation",
        "game_genres_fav": "RPG|Adventure|Story Rich|Atmospheric",
        "game_genres_disliked": "Sports|Racing|Massively Multiplayer",
        "ratings": [
            {"item_id": "movie_27205",  "title": "Inception",           "stars": 5.0},
            {"item_id": "movie_335984", "title": "Blade Runner 2049",   "stars": 5.0},
            {"item_id": "movie_157336", "title": "Interstellar",         "stars": 4.5},
            {"item_id": "movie_6977",   "title": "No Country for Old Men","stars": 4.5},
            {"item_id": "movie_496243", "title": "Parasite",             "stars": 5.0},
            {"item_id": "movie_438631", "title": "Dune: Part One",       "stars": 4.5},
            {"item_id": "game_1091500", "title": "Cyberpunk 2077",       "stars": 4.0},
            {"item_id": "game_632470",  "title": "Disco Elysium",        "stars": 5.0},
            {"item_id": "movie_155",    "title": "The Dark Knight",      "stars": 4.0},
        ],
    },

    # Blockbuster action fan — superhero games and MCU films.
    "sam": {
        "age": 19, "gender": "Male", "profession": "Student", "country": "Egypt",
        "game_genres_fav": "Action|Adventure|Open World|Shooter",
        "game_genres_disliked": "Strategy|Simulation|Card Game|Educational",
        "movie_genres_fav": "Action|Adventure|Science Fiction|Fantasy",
        "movie_genres_disliked": "Documentary|Horror|Drama",
        "ratings": [
            {"item_id": "game_271590",  "title": "Grand Theft Auto V",     "stars": 5.0},
            {"item_id": "game_208650",  "title": "Batman: Arkham Knight",  "stars": 5.0},
            {"item_id": "game_45920",   "title": "Batman: Arkham City",    "stars": 4.5},
            {"item_id": "movie_155",    "title": "The Dark Knight",        "stars": 5.0},
            {"item_id": "movie_299534", "title": "Avengers: Endgame",      "stars": 4.5},
            {"item_id": "movie_603",    "title": "The Matrix",             "stars": 4.5},
            {"item_id": "game_1091500", "title": "Cyberpunk 2077",         "stars": 4.0},
            {"item_id": "movie_438631", "title": "Dune: Part One",         "source": "wishlist"},
        ],
    },

    # Academic historian. Strategy games and serious war cinema.
    "dr_chen": {
        "age": 44, "gender": "Female", "profession": "Professor", "country": "Taiwan",
        "game_genres_fav": "Strategy|Simulation|Tactical|Historical|Turn-Based",
        "game_genres_disliked": "Horror|Sports|Massively Multiplayer",
        "movie_genres_fav": "Drama|History|War|Documentary",
        "movie_genres_disliked": "Comedy|Animation|Romance|Fantasy",
        "ratings": [
            {"item_id": "game_294860", "title": "Valkyria Chronicles",  "stars": 5.0},
            {"item_id": "game_686810", "title": "Hell Let Loose",       "stars": 4.5},
            {"item_id": "movie_424",   "title": "Schindler's List",     "stars": 5.0},
            {"item_id": "movie_374720","title": "Dunkirk",              "stars": 5.0},
            {"item_id": "movie_197",   "title": "Braveheart",           "stars": 4.5},
            {"item_id": "movie_637",   "title": "Life is Beautiful",    "stars": 5.0},
            {"item_id": "game_42910",  "title": "Magicka",              "stars": 3.0},
            {"item_id": "game_374320", "title": "Dark Souls III",       "source": "ignore"},
        ],
    },

    # Horror and survival enthusiast. Atmospheric isolation-focused.
    "jamie": {
        "age": 23, "gender": "Non-binary", "profession": "Graphic Designer", "country": "Canada",
        "game_genres_fav": "Horror|Survival|Atmospheric|Action|Indie",
        "game_genres_disliked": "Sports|Educational|Card Game|Racing",
        "movie_genres_fav": "Horror|Thriller|Mystery|Science Fiction",
        "movie_genres_disliked": "Romance|Comedy|Animation",
        "ratings": [
            {"item_id": "game_17470",  "title": "Dead Space",            "stars": 5.0},
            {"item_id": "game_264710", "title": "Subnautica",            "stars": 4.5},
            {"item_id": "movie_694",   "title": "The Shining",           "stars": 5.0},
            {"item_id": "movie_1091",  "title": "The Thing",             "stars": 5.0},
            {"item_id": "game_437680", "title": "Slain: Back from Hell", "stars": 4.0},
            {"item_id": "movie_679",   "title": "Aliens",               "stars": 4.5},
            {"item_id": "movie_348",   "title": "Alien",                "stars": 5.0},
            {"item_id": "game_292030", "title": "The Witcher 3",        "source": "ignore"},
        ],
    },

    # Indie and arthouse taste. Narrative-first, hates multiplayer grind.
    "taylor": {
        "age": 28, "gender": "Female", "profession": "Illustrator", "country": "UK",
        "game_genres_fav": "Indie|Adventure|Story Rich|Puzzle|Atmospheric|Exploration",
        "game_genres_disliked": "Sports|Racing|Massively Multiplayer|Card Game",
        "movie_genres_fav": "Drama|Fantasy|Mystery|Animation",
        "movie_genres_disliked": "Action|War|Horror",
        "ratings": [
            {"item_id": "game_753640", "title": "Outer Wilds",       "stars": 5.0},
            {"item_id": "game_367520", "title": "Hollow Knight",     "stars": 5.0},
            {"item_id": "game_1145360","title": "Hades",             "stars": 4.5},
            {"item_id": "game_632470", "title": "Disco Elysium",     "stars": 5.0},
            {"item_id": "game_35700",  "title": "Trine",             "stars": 4.0},
            {"item_id": "movie_438631","title": "Dune: Part One",    "stars": 4.5},
            {"item_id": "movie_128",   "title": "Princess Mononoke", "stars": 5.0},
            {"item_id": "game_271590", "title": "GTA V",             "source": "ignore"},
        ],
    },
}


# ── Test Suite ────────────────────────────────────────────────────────────────
# 6 categories × ~17 queries = ~100 total
# user_key: key into USERS dict, or None for no-profile (FAISS-only baseline)

QUERIES = [

    # ── CATEGORY 1: Profile-coherent — user history matches the query ──────
    # Full pipeline: FAISS + ML reranking both fire and should agree.

    {"id": "PC-01", "category": "profile_coherent", "user_key": "alex",
     "query": "Dark fantasy action RPG with punishing difficulty and deep mysterious lore",
     "expect_domain": "game"},

    {"id": "PC-02", "category": "profile_coherent", "user_key": "alex",
     "query": "Medieval tactical RPG with moral choices and political intrigue between warring kingdoms",
     "expect_domain": "game"},

    {"id": "PC-03", "category": "profile_coherent", "user_key": "alex",
     "query": "A film with the same oppressive Gothic atmosphere and cryptic storytelling as FromSoftware games",
     "expect_domain": "movie"},

    {"id": "PC-04", "category": "profile_coherent", "user_key": "alex",
     "query": "Philosophical RPG with an unreliable narrator, heavy dialogue, and a decaying city",
     "expect_domain": "game"},

    {"id": "PC-05", "category": "profile_coherent", "user_key": "alex",
     "query": "Movement-based first-person game in a dystopian authoritarian city — fast and fluid",
     "expect_domain": "game"},

    {"id": "PC-06", "category": "profile_coherent", "user_key": "maria",
     "query": "Mind-bending sci-fi that questions the nature of reality — dream logic, layers within layers",
     "expect_domain": "any"},

    {"id": "PC-07", "category": "profile_coherent", "user_key": "maria",
     "query": "Neo-noir cyberpunk detective story in a rain-soaked city with existential questions",
     "expect_domain": "any"},

    {"id": "PC-08", "category": "profile_coherent", "user_key": "maria",
     "query": "Slow-burn thriller about inevitable doom — no hero, no escape, morally grey throughout",
     "expect_domain": "any"},

    {"id": "PC-09", "category": "profile_coherent", "user_key": "maria",
     "query": "Epic sci-fi about humanity's place in the cosmos — emotional, vast, and visually stunning",
     "expect_domain": "any"},

    {"id": "PC-10", "category": "profile_coherent", "user_key": "maria",
     "query": "A game that feels like watching a prestige sci-fi film — rich dialogue, no combat emphasis",
     "expect_domain": "game"},

    {"id": "PC-11", "category": "profile_coherent", "user_key": "sam",
     "query": "Open world crime game set in a massive living city with chaotic freedom",
     "expect_domain": "game"},

    {"id": "PC-12", "category": "profile_coherent", "user_key": "sam",
     "query": "Superhero game with gritty street-level crime fighting and detective work",
     "expect_domain": "game"},

    {"id": "PC-13", "category": "profile_coherent", "user_key": "sam",
     "query": "High-stakes action blockbuster film with incredible set pieces and a charismatic villain",
     "expect_domain": "movie"},

    {"id": "PC-14", "category": "profile_coherent", "user_key": "sam",
     "query": "Futuristic open world RPG with hacking, body augmentation, and neon-lit megacity streets",
     "expect_domain": "game"},

    {"id": "PC-15", "category": "profile_coherent", "user_key": "sam",
     "query": "Action movie where one protagonist fights through dozens of enemies — fast, brutal, stylish",
     "expect_domain": "movie"},

    {"id": "PC-16", "category": "profile_coherent", "user_key": "dr_chen",
     "query": "Realistic WW2 tactical multiplayer game with squad coordination and historical accuracy",
     "expect_domain": "game"},

    {"id": "PC-17", "category": "profile_coherent", "user_key": "dr_chen",
     "query": "Turn-based strategy RPG with hand-drawn art and a serious wartime narrative",
     "expect_domain": "game"},

    {"id": "PC-18", "category": "profile_coherent", "user_key": "dr_chen",
     "query": "War film that portrays the human cost without glorification — intimate, not heroic",
     "expect_domain": "movie"},

    {"id": "PC-19", "category": "profile_coherent", "user_key": "dr_chen",
     "query": "Historical drama about civilians surviving occupation and keeping their humanity",
     "expect_domain": "movie"},

    {"id": "PC-20", "category": "profile_coherent", "user_key": "dr_chen",
     "query": "Grand strategy game where political decisions cascade into decades-long consequences",
     "expect_domain": "game"},

    {"id": "PC-21", "category": "profile_coherent", "user_key": "jamie",
     "query": "Psychological horror game that builds dread through atmosphere, not jump scares",
     "expect_domain": "game"},

    {"id": "PC-22", "category": "profile_coherent", "user_key": "jamie",
     "query": "Survival game in an alien underwater world — isolated, mysterious, deeply unsettling",
     "expect_domain": "game"},

    {"id": "PC-23", "category": "profile_coherent", "user_key": "jamie",
     "query": "Sci-fi horror film — creature hunts crew on a spaceship, tension through isolation",
     "expect_domain": "movie"},

    {"id": "PC-24", "category": "profile_coherent", "user_key": "jamie",
     "query": "Horror set in an isolated snowy location — paranoia, shapeshifting threat, nowhere to run",
     "expect_domain": "movie"},

    {"id": "PC-25", "category": "profile_coherent", "user_key": "taylor",
     "query": "Indie exploration game where unravelling an ancient mystery IS the gameplay — no combat",
     "expect_domain": "game"},

    {"id": "PC-26", "category": "profile_coherent", "user_key": "taylor",
     "query": "Atmospheric 2D platformer with a melancholy world and wordless storytelling",
     "expect_domain": "game"},

    {"id": "PC-27", "category": "profile_coherent", "user_key": "taylor",
     "query": "Fantasy film where nature and humanity are in conflict — beautiful, mythic, hand-crafted art",
     "expect_domain": "movie"},

    {"id": "PC-28", "category": "profile_coherent", "user_key": "taylor",
     "query": "Physics-based puzzle platformer in a magical world — co-op friendly and whimsical",
     "expect_domain": "game"},

    {"id": "PC-29", "category": "profile_coherent", "user_key": "taylor",
     "query": "Story-rich RPG where exploration and dialogue matter more than combat stats",
     "expect_domain": "game"},

    {"id": "PC-30", "category": "profile_coherent", "user_key": "alex",
     "query": "A brutal hack-and-slash platformer with metal soundtrack and gothic art — very difficult",
     "expect_domain": "game"},


    # ── CATEGORY 2: Cross-domain — explicit ask for both games AND movies ──

    {"id": "XD-01", "category": "cross_domain", "user_key": "maria",
     "query": "Recommend me something — game or movie — about artificial intelligence becoming self-aware",
     "expect_domain": "mixed"},

    {"id": "XD-02", "category": "cross_domain", "user_key": "sam",
     "query": "Best content mixing games and movies set in ancient Rome — battles, politics, empire",
     "expect_domain": "mixed"},

    {"id": "XD-03", "category": "cross_domain", "user_key": "alex",
     "query": "Anything about surviving a brutal zombie apocalypse with a focus on human relationships",
     "expect_domain": "mixed"},

    {"id": "XD-04", "category": "cross_domain", "user_key": "sam",
     "query": "Games and movies about elaborate heists and cons — the smarter the plan, the better",
     "expect_domain": "mixed"},

    {"id": "XD-05", "category": "cross_domain", "user_key": "dr_chen",
     "query": "Cross-domain recommendations: samurai, bushido, and feudal Japan — games or films",
     "expect_domain": "mixed"},

    {"id": "XD-06", "category": "cross_domain", "user_key": "alex",
     "query": "Anything about a lone wanderer crossing a vast dangerous open world alone",
     "expect_domain": "mixed"},

    {"id": "XD-07", "category": "cross_domain", "user_key": "taylor",
     "query": "Games and movies that deal honestly with grief and the process of letting go",
     "expect_domain": "mixed"},

    {"id": "XD-08", "category": "cross_domain", "user_key": "dr_chen",
     "query": "Both a game and a movie set during World War 2 — from a personal human perspective, not heroic",
     "expect_domain": "mixed"},

    {"id": "XD-09", "category": "cross_domain", "user_key": "jamie",
     "query": "Horror set in isolated locations — cabin, space station, Antarctic research base — game or film",
     "expect_domain": "mixed"},

    {"id": "XD-10", "category": "cross_domain", "user_key": "maria",
     "query": "Games and movies where time manipulation is the core mechanic or central plot device",
     "expect_domain": "mixed"},

    {"id": "XD-11", "category": "cross_domain", "user_key": "sam",
     "query": "Give me a movie and a game about escaping a dystopian authoritarian regime",
     "expect_domain": "mixed"},

    {"id": "XD-12", "category": "cross_domain", "user_key": "taylor",
     "query": "Anything set in a dying, decaying city — game or movie — dark, melancholy, and atmospheric",
     "expect_domain": "mixed"},

    {"id": "XD-13", "category": "cross_domain", "user_key": "dr_chen",
     "query": "Cross-domain: brutal Norse Viking content — mythology, warfare, and honor — games and films",
     "expect_domain": "mixed"},

    {"id": "XD-14", "category": "cross_domain", "user_key": "maria",
     "query": "Memory loss or identity crisis as the central mystery — game or movie, psychological",
     "expect_domain": "mixed"},

    {"id": "XD-15", "category": "cross_domain", "user_key": "alex",
     "query": "Games or movies where the protagonist uncovers a vast hidden conspiracy step by step",
     "expect_domain": "mixed"},

    {"id": "XD-16", "category": "cross_domain", "user_key": "jamie",
     "query": "A small crew surviving together against impossible odds in space — game or film",
     "expect_domain": "mixed"},

    {"id": "XD-17", "category": "cross_domain", "user_key": "taylor",
     "query": "Cross-domain: anything involving the moral cost of revenge — game or movie",
     "expect_domain": "mixed"},

    {"id": "XD-18", "category": "cross_domain", "user_key": "sam",
     "query": "Recommend across domains: political intrigue, betrayal, and power struggles in a royal court",
     "expect_domain": "mixed"},

    {"id": "XD-19", "category": "cross_domain", "user_key": "maria",
     "query": "Games and movies about hackers and underground tech subculture — gritty and realistic",
     "expect_domain": "mixed"},

    {"id": "XD-20", "category": "cross_domain", "user_key": "alex",
     "query": "Dark mythology retelling — gods, monsters, fate — game or movie with epic scope",
     "expect_domain": "mixed"},


    # ── CATEGORY 3: Title-based — user has already rated the source title ──
    # The ML reranker should boost items similar to the user's liked title.

    {"id": "TB-01", "category": "title_based", "user_key": "maria",
     "query": "I loved Inception (watched it twice) — what game captures the same layered mind-bending feel?",
     "expect_domain": "game"},

    {"id": "TB-02", "category": "title_based", "user_key": "alex",
     "query": "I finished The Witcher 3 and want a film with the same dark political depth and moral ambiguity",
     "expect_domain": "movie"},

    {"id": "TB-03", "category": "title_based", "user_key": "maria",
     "query": "Loved Blade Runner 2049 — give me a game with that same lonely cyberpunk atmosphere",
     "expect_domain": "game"},

    {"id": "TB-04", "category": "title_based", "user_key": "alex",
     "query": "Dark Souls III is my favourite game — what film has that same oppressive inevitability?",
     "expect_domain": "movie"},

    {"id": "TB-05", "category": "title_based", "user_key": "sam",
     "query": "I've played every Batman Arkham game — what movie gives me that same street-level vigilante feeling?",
     "expect_domain": "movie"},

    {"id": "TB-06", "category": "title_based", "user_key": "dr_chen",
     "query": "Hell Let Loose is my favourite WW2 game — recommend a film with that same boots-on-the-ground intimacy",
     "expect_domain": "movie"},

    {"id": "TB-07", "category": "title_based", "user_key": "maria",
     "query": "Parasite was a masterpiece — is there a game with that same social class tension and thriller escalation?",
     "expect_domain": "game"},

    {"id": "TB-08", "category": "title_based", "user_key": "alex",
     "query": "Disco Elysium changed how I think about games — what film has the same philosophical detective energy?",
     "expect_domain": "movie"},

    {"id": "TB-09", "category": "title_based", "user_key": "maria",
     "query": "Interstellar is my favourite film — what game captures that same cosmic loneliness and human emotion?",
     "expect_domain": "game"},

    {"id": "TB-10", "category": "title_based", "user_key": "jamie",
     "query": "The Thing is the perfect horror film — recommend a game that recreates that same paranoia and isolation",
     "expect_domain": "game"},

    {"id": "TB-11", "category": "title_based", "user_key": "taylor",
     "query": "Outer Wilds gave me the most emotional experience in gaming — what film has that same sense of discovery?",
     "expect_domain": "movie"},

    {"id": "TB-12", "category": "title_based", "user_key": "dr_chen",
     "query": "Valkyria Chronicles is perfection — what other game gives me that same tactical RPG emotional storytelling?",
     "expect_domain": "game"},

    {"id": "TB-13", "category": "title_based", "user_key": "jamie",
     "query": "Subnautica terrified me and I loved it — what horror film captures that same alien ocean dread?",
     "expect_domain": "movie"},

    {"id": "TB-14", "category": "title_based", "user_key": "taylor",
     "query": "Hollow Knight's atmosphere is unlike anything — what film has that same melancholic dying world beauty?",
     "expect_domain": "movie"},

    {"id": "TB-15", "category": "title_based", "user_key": "sam",
     "query": "GTA V was incredible — what movie matches that same crime-drama energy and satirical edge?",
     "expect_domain": "movie"},


    # ── CATEGORY 4: Ground truth — query should surface a specific known title ──
    # User profile is chosen to boost the expected result where possible.

    {"id": "GT-01", "category": "ground_truth", "user_key": "sam",
     "query": "Cyberpunk open world RPG in a dystopian megacity with hacking, gangs, and body augmentation",
     "expect_titles": ["Cyberpunk 2077"]},

    {"id": "GT-02", "category": "ground_truth", "user_key": "taylor",
     "query": "Wizard school open world RPG set in the Harry Potter universe — exploration and magic",
     "expect_titles": ["Hogwarts Legacy"]},

    {"id": "GT-03", "category": "ground_truth", "user_key": "maria",
     "query": "Desert planet spice prophecy chosen one epic sci-fi — feudal houses and political warfare",
     "expect_titles": ["Dune"]},

    {"id": "GT-04", "category": "ground_truth", "user_key": "dr_chen",
     "query": "Realistic WW2 multiplayer shooter with squad roles — infantry, tank crew, artillery coordination",
     "expect_titles": ["Hell Let Loose", "Post Scriptum", "Squad 44"]},

    {"id": "GT-05", "category": "ground_truth", "user_key": "dr_chen",
     "query": "Scottish warrior rallies clans against English occupiers — medieval epic about freedom",
     "expect_titles": ["Braveheart"]},

    {"id": "GT-06", "category": "ground_truth", "user_key": "sam",
     "query": "Open world Batman game — Gotham City, Batmobile, superhero crime fighting, Arkham",
     "expect_titles": ["Batman: Arkham Knight", "Batman: Arkham City"]},

    {"id": "GT-07", "category": "ground_truth", "user_key": "dr_chen",
     "query": "Evacuation of British soldiers from French beach in WW2 — told in real time, no hero",
     "expect_titles": ["Dunkirk"]},

    {"id": "GT-08", "category": "ground_truth", "user_key": "alex",
     "query": "First-person parkour runner in a totalitarian white city — female protagonist, fluid movement",
     "expect_titles": ["Mirror's Edge"]},

    {"id": "GT-09", "category": "ground_truth", "user_key": "dr_chen",
     "query": "Anime-style turn-based WW2 strategy in a fictional European nation with a small squad",
     "expect_titles": ["Valkyria Chronicles"]},

    {"id": "GT-10", "category": "ground_truth", "user_key": "jamie",
     "query": "Dark noir city with no sun, aliens that rewrite human memory, detective wakes with no past",
     "expect_titles": ["Dark City"]},

    {"id": "GT-11", "category": "ground_truth", "user_key": "alex",
     "query": "Top-down co-op magic game — Scandinavian mythology, friendly fire spells, chaotic fun",
     "expect_titles": ["Magicka"]},

    {"id": "GT-12", "category": "ground_truth", "user_key": "alex",
     "query": "Dark fantasy Arthurian RPG — you are Mordred, King Arthur died, the island of Avalon, undead",
     "expect_titles": ["King Arthur: Knight's Tale"]},

    {"id": "GT-13", "category": "ground_truth", "user_key": "jamie",
     "query": "Neo-noir crime anthology film — black and white, comic book style, multiple brutal stories in one city",
     "expect_titles": ["Sin City"]},

    {"id": "GT-14", "category": "ground_truth", "user_key": "taylor",
     "query": "Physics-based 2D puzzle platformer — wizard, knight, thief, magical forest, local co-op",
     "expect_titles": ["Trine", "Trine Enchanted Edition"]},

    {"id": "GT-15", "category": "ground_truth", "user_key": "maria",
     "query": "Atmospheric first-person mystery in ancient Rome — time loop, murder, one city, many lives",
     "expect_titles": ["The Forgotten City"]},

    {"id": "GT-16", "category": "ground_truth", "user_key": "jamie",
     "query": "Gothic 2D metroidvania hack-and-slash — metal music, pixel art, hellish enemies, very hard",
     "expect_titles": ["Slain: Back from Hell"]},

    {"id": "GT-17", "category": "ground_truth", "user_key": "alex",
     "query": "Rogue-based action dungeon crawler — Greek mythology, son of Hades escaping the Underworld",
     "expect_titles": ["Hades"]},

    {"id": "GT-18", "category": "ground_truth", "user_key": "taylor",
     "query": "Exploration mystery game with a solar system, time loop, ancient civilization, and no combat",
     "expect_titles": ["Outer Wilds"]},

    {"id": "GT-19", "category": "ground_truth", "user_key": "alex",
     "query": "Insect kingdom metroidvania — hollow world, dead civilization, knight with a nail weapon",
     "expect_titles": ["Hollow Knight"]},

    {"id": "GT-20", "category": "ground_truth", "user_key": "dr_chen",
     "query": "Strategic turn-based WW2 game — Estonia, small nation, soldiers fighting both Soviet and Nazi forces",
     "expect_titles": ["1944"]},


    # ── CATEGORY 5: No profile — FAISS-only baseline (user=None) ──────────
    # These run WITHOUT a user profile so ML reranking is skipped.
    # Run the same queries that appear in profile_coherent to allow comparison.

    {"id": "NP-01", "category": "no_profile", "user_key": None,
     "query": "Dark fantasy action RPG with punishing difficulty and deep mysterious lore",
     "expect_domain": "game"},

    {"id": "NP-02", "category": "no_profile", "user_key": None,
     "query": "Mind-bending sci-fi that questions the nature of reality — dream logic, layers within layers",
     "expect_domain": "any"},

    {"id": "NP-03", "category": "no_profile", "user_key": None,
     "query": "War film that portrays the human cost without glorification — intimate, not heroic",
     "expect_domain": "movie"},

    {"id": "NP-04", "category": "no_profile", "user_key": None,
     "query": "Psychological horror game that builds dread through atmosphere, not jump scares",
     "expect_domain": "game"},

    {"id": "NP-05", "category": "no_profile", "user_key": None,
     "query": "Indie exploration game where unravelling an ancient mystery IS the gameplay — no combat",
     "expect_domain": "game"},

    {"id": "NP-06", "category": "no_profile", "user_key": None,
     "query": "Neo-noir cyberpunk detective story in a rain-soaked city with existential questions",
     "expect_domain": "any"},

    {"id": "NP-07", "category": "no_profile", "user_key": None,
     "query": "Realistic WW2 tactical multiplayer game with squad coordination and historical accuracy",
     "expect_domain": "game"},

    {"id": "NP-08", "category": "no_profile", "user_key": None,
     "query": "Superhero game with gritty street-level crime fighting and detective work",
     "expect_domain": "game"},

    {"id": "NP-09", "category": "no_profile", "user_key": None,
     "query": "Survival game in an alien underwater world — isolated, mysterious, deeply unsettling",
     "expect_domain": "game"},

    {"id": "NP-10", "category": "no_profile", "user_key": None,
     "query": "Philosophical RPG with an unreliable narrator, heavy dialogue, and a decaying city",
     "expect_domain": "game"},

    {"id": "NP-11", "category": "no_profile", "user_key": None,
     "query": "Cyberpunk open world RPG in a dystopian megacity with hacking, gangs, and body augmentation",
     "expect_titles": ["Cyberpunk 2077"]},

    {"id": "NP-12", "category": "no_profile", "user_key": None,
     "query": "Desert planet spice prophecy chosen one epic sci-fi — feudal houses and political warfare",
     "expect_titles": ["Dune"]},

    {"id": "NP-13", "category": "no_profile", "user_key": None,
     "query": "Dark noir city with no sun, aliens that rewrite human memory, detective wakes with no past",
     "expect_titles": ["Dark City"]},

    {"id": "NP-14", "category": "no_profile", "user_key": None,
     "query": "Scottish warrior rallies clans against English occupiers — medieval epic about freedom",
     "expect_titles": ["Braveheart"]},

    {"id": "NP-15", "category": "no_profile", "user_key": None,
     "query": "Horror set in an isolated snowy location — paranoia, shapeshifting threat, nowhere to run",
     "expect_domain": "movie"},


    # ── CATEGORY 6: Edge cases — stress tests, odd profiles, bad inputs ────

    {"id": "EC-01", "category": "edge_case", "user_key": "sam",
     "query": "horror",
     "expect_domain": "any"},

    {"id": "EC-02", "category": "edge_case", "user_key": "dr_chen",
     "query": "game",
     "expect_domain": "game"},

    {"id": "EC-03", "category": "edge_case", "user_key": None,
     "query": "aaaaaa",
     "expect_domain": "any"},

    {"id": "EC-04", "category": "edge_case", "user_key": "taylor",
     "query": "Something cozy and relaxing I can play before bed — gentle, no stress, no combat",
     "expect_domain": "game"},

    {"id": "EC-05", "category": "edge_case", "user_key": "maria",
     "query": "Recommend me something completely unique I have never seen before",
     "expect_domain": "any"},

    {"id": "EC-06", "category": "edge_case", "user_key": "sam",
     "query": "Fast-paced competitive FPS with hero abilities and ranked matchmaking",
     "expect_domain": "game"},

    {"id": "EC-07", "category": "edge_case", "user_key": "taylor",
     "query": "Co-op puzzle game that couples can play together on the same couch",
     "expect_domain": "game"},

    {"id": "EC-08", "category": "edge_case", "user_key": "dr_chen",
     "query": "Silent film era — must-see classic from the 1920s",
     "expect_domain": "movie"},

    {"id": "EC-09", "category": "edge_case", "user_key": None,
     "query": "1",
     "expect_domain": "any"},

    {"id": "EC-10", "category": "edge_case", "user_key": "jamie",
     "query": "JRPG with turn-based combat, anime art, school setting, and dark supernatural horror twist",
     "expect_domain": "game"},

    {"id": "EC-11", "category": "edge_case", "user_key": "sam",
     "query": "A game exactly like Minecraft but completely different",
     "expect_domain": "game"},

    {"id": "EC-12", "category": "edge_case", "user_key": "alex",
     "query": "Pirate ship naval combat open world RPG with exploration and ship upgrades",
     "expect_domain": "any"},

    {"id": "EC-13", "category": "edge_case", "user_key": None,
     "query": "The best game ever made with perfect story gameplay graphics music and characters",
     "expect_domain": "game"},

    {"id": "EC-14", "category": "edge_case", "user_key": "taylor",
     "query": "Farming simulation — peaceful, no combat, countryside life with relationship building",
     "expect_domain": "game"},

    {"id": "EC-15", "category": "edge_case", "user_key": "dr_chen",
     "query": "A documentary that feels like a thriller because the real events are so unbelievable",
     "expect_domain": "movie"},
]


# ── Runner ────────────────────────────────────────────────────────────────────

def run_query(query_obj: dict, api_url: str, k: int, force_no_profile: bool = False) -> dict:
    user_key  = query_obj.get("user_key")
    user_data = USERS.get(user_key) if (user_key and not force_no_profile) else None

    payload = {
        "query":        query_obj["query"],
        "k":            k,
        "allow_adult":  False,
        "user":         user_data,
    }

    t0 = time.time()
    try:
        r = requests.post(f"{api_url}/api/recommend", json=payload, timeout=120)
        latency = round(time.time() - t0, 2)
        r.raise_for_status()
        data = r.json()

        items   = data.get("retrieved_items", [])
        domains = [i["data"].get("type", "unknown") for i in items]
        n_movie = domains.count("movie")
        n_game  = domains.count("game")

        if "expect_titles" in query_obj:
            expected = [t.lower() for t in query_obj["expect_titles"]]
            returned = [i["data"].get("title", "").lower() for i in items]
            hit = any(any(e in r for e in expected) for r in returned)
        else:
            hit = None

        return {
            "id":               query_obj["id"],
            "category":         query_obj["category"],
            "query":            query_obj["query"],
            "user_key":         user_key if not force_no_profile else None,
            "profile_used":     user_data is not None,
            "status":           "ok",
            "latency_s":        latency,
            "n_results":        len(items),
            "n_movie":          n_movie,
            "n_game":           n_game,
            "is_mixed":         n_movie > 0 and n_game > 0,
            "ground_truth_hit": hit,
            "llm_response":     data.get("llm_response", ""),
            "results": [
                {
                    "rank":          idx + 1,
                    "score":         round(item["score"], 4),
                    "type":          item["data"].get("type"),
                    "title":         item["data"].get("title"),
                    "year":          item["data"].get("year", 0),
                    "quality_score": item["data"].get("score", 0),
                    "review_count":  item["data"].get("review_count", 0),
                    "themes":        item["data"].get("themes", "")[:120],
                }
                for idx, item in enumerate(items)
            ],
        }

    except Exception as e:
        return {
            "id":          query_obj["id"],
            "category":    query_obj["category"],
            "query":       query_obj["query"],
            "user_key":    user_key if not force_no_profile else None,
            "profile_used": user_data is not None,
            "status":      "error",
            "error":       str(e),
            "latency_s":   round(time.time() - t0, 2),
        }


def format_txt(results: list) -> str:
    lines = []
    for r in results:
        lines.append("=" * 80)
        profile_tag = f" [{r.get('user_key', 'no-profile')}]" if r.get("user_key") else " [no-profile]"
        lines.append(f"[{r['id']}] {r['category'].upper()}{profile_tag}")
        lines.append(f"QUERY: {r['query']}")
        lines.append("=" * 80)

        if r["status"] == "error":
            lines.append(f"  ERROR: {r.get('error', '')}")
            lines.append("")
            continue

        rerank = "ML rerank: ON" if r.get("profile_used") else "ML rerank: OFF (baseline)"
        lines.append(f"  Latency: {r['latency_s']}s | Results: {r['n_results']} "
                     f"(movies: {r['n_movie']}, games: {r['n_game']}, mixed: {r['is_mixed']}) | {rerank}")

        if r.get("ground_truth_hit") is not None:
            lines.append(f"  Ground-truth hit: {'YES ✓' if r['ground_truth_hit'] else 'NO ✗'}")

        for item in r.get("results", []):
            year  = f" ({item['year']})"              if item.get("year")         else ""
            score = f" q={item['quality_score']:.1f}" if item.get("quality_score") else ""
            rev   = f" [{item['review_count']:,}rev]"  if item.get("review_count")  else ""
            dist  = item["score"]
            lines.append(f"  [{item['rank']}] dist={dist:.4f} | {item['type'].upper()}{year}{score}{rev}")
            lines.append(f"       {item['title']}")
            lines.append(f"       {item['themes']}")

        if r.get("llm_response"):
            lines.append("")
            lines.append("  LLM RESPONSE:")
            for ln in r["llm_response"].strip().split("\n"):
                lines.append(f"    {ln}")

        lines.append("")
    return "\n".join(lines)


def compute_summary(results: list) -> dict:
    ok     = [r for r in results if r["status"] == "ok"]
    errors = [r for r in results if r["status"] == "error"]

    by_cat = {}
    for r in ok:
        by_cat.setdefault(r["category"], []).append(r)

    gt_results = [r for r in ok if r.get("ground_truth_hit") is not None]
    gt_hits    = [r for r in gt_results if r["ground_truth_hit"]]
    mixed      = [r for r in ok if r.get("is_mixed")]

    avg_latency = round(sum(r["latency_s"] for r in ok) / len(ok), 2) if ok else 0

    cat_summary = {}
    for cat, items in by_cat.items():
        cat_summary[cat] = {
            "count":       len(items),
            "mixed_pct":   round(sum(1 for i in items if i.get("is_mixed")) / len(items) * 100, 1),
            "with_profile": sum(1 for i in items if i.get("profile_used")),
            "error_count": sum(1 for r in results if r.get("category") == cat and r["status"] == "error"),
        }

    return {
        "total_queries":    len(results),
        "ok":               len(ok),
        "errors":           len(errors),
        "avg_latency_s":    avg_latency,
        "mixed_domain_pct": round(len(mixed) / len(ok) * 100, 1) if ok else 0,
        "ground_truth_hit_rate": round(len(gt_hits) / len(gt_results) * 100, 1) if gt_results else None,
        "queries_with_profile":  sum(1 for r in ok if r.get("profile_used")),
        "per_category":    cat_summary,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url",        default=API_URL)
    parser.add_argument("--k",          type=int, default=DEFAULT_K)
    parser.add_argument("--category",   default=None,
                        help="Run only this category: profile_coherent | cross_domain | "
                             "title_based | ground_truth | no_profile | edge_case")
    parser.add_argument("--no-profile", action="store_true",
                        help="Force user=None on all queries (pure FAISS baseline)")
    args = parser.parse_args()

    queries = QUERIES
    if args.category:
        queries = [q for q in QUERIES if q["category"] == args.category]
        print(f"Running {len(queries)} queries in category '{args.category}'")
    else:
        print(f"Running {len(queries)} queries against {args.url}")

    if args.no_profile:
        print("  Mode: FAISS-only baseline (no ML reranking)")

    results = []
    for i, q in enumerate(queries, 1):
        user_label = q.get("user_key") or "no-profile"
        if args.no_profile:
            user_label = "no-profile (forced)"
        print(f"  [{i:>3}/{len(queries)}] {q['id']} [{user_label}] — {q['query'][:55]}...")
        result = run_query(q, args.url, args.k, force_no_profile=args.no_profile)
        results.append(result)
        if result["status"] == "ok":
            mixed_flag = " MIXED" if result.get("is_mixed") else ""
            gt_flag    = " GT-HIT" if result.get("ground_truth_hit") else (" GT-MISS" if result.get("ground_truth_hit") is False else "")
            print(f"           ok ({result['latency_s']}s) {result['n_results']} results{mixed_flag}{gt_flag}")
        else:
            print(f"           ERROR: {result.get('error','')[:60]}")

    summary = compute_summary(results)

    os.makedirs("evaluation", exist_ok=True)
    suffix = "_baseline" if args.no_profile else ""
    json_path = f"evaluation/results{suffix}.json"
    txt_path  = f"evaluation/results{suffix}.txt"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "results": results}, f, indent=2, ensure_ascii=False)
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(format_txt(results))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Total:           {summary['total_queries']} queries")
    print(f"  Errors:          {summary['errors']}")
    print(f"  Avg latency:     {summary['avg_latency_s']}s")
    print(f"  With ML rerank:  {summary['queries_with_profile']} / {summary['ok']} queries")
    print(f"  Mixed domain:    {summary['mixed_domain_pct']}%")
    if summary["ground_truth_hit_rate"] is not None:
        print(f"  Ground-truth:    {summary['ground_truth_hit_rate']}% hit rate")
    print("\n  Per category:")
    for cat, s in summary["per_category"].items():
        print(f"    {cat:<20} {s['count']:>3} queries | {s['mixed_pct']:>5.1f}% mixed | "
              f"{s['with_profile']:>3} with profile | {s['error_count']} errors")
    print(f"\nSaved: {json_path}  {txt_path}")


if __name__ == "__main__":
    main()