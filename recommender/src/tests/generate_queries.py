import random
import json
import os

def generate_queries(seed=42, num_queries=100):
    genres = [
        "A sci-fi movie", "A horror game", "A romantic comedy", "A puzzle game", 
        "An action RPG", "A historical drama", "A multiplayer shooter", 
        "A platformer", "A survival game", "A fantasy epic"
    ]
    settings = [
        "set in a post-apocalyptic wasteland", "in outer space", "during World War 2", 
        "in a neon cyberpunk city", "in a medieval kingdom", "in a modern metropolis", 
        "in a spooky haunted mansion", "underwater", "in a magical academy", "in a vast desert"
    ]
    details = [
        "with a great story", "featuring intense combat", "that is relaxing and cozy", 
        "with a mind-bending twist", "about exploring the unknown", "with puzzle solving",
        "focusing on survival", "with beautiful art", "that is very emotional", "with co-op multiplayer"
    ]
    
    queries = []
    for g in genres:
        for s in settings:
            # We also track the components to make evaluation easier later
            queries.append({
                "genre": g,
                "setting": s,
                "base_query": f"{g} {s}"
            })
            
    random.seed(seed)
    random.shuffle(queries)
    
    final_queries = []
    for i in range(num_queries):
        detail = random.choice(details)
        q = queries[i % len(queries)].copy()
        q["detail"] = detail
        q["full_query"] = f"{q['base_query']} {detail}."
        final_queries.append(q)
        
    return final_queries

if __name__ == "__main__":
    queries = generate_queries()
    print(json.dumps(queries[:3], indent=2))
