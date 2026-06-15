import json
import os
import re

def tokenize(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    tokens = set(text.split())
    # simple stop words
    stopwords = {'a', 'an', 'the', 'in', 'on', 'at', 'with', 'and', 'or', 'but', 'is', 'to', 'for', 'about', 'that', 'this', 'of', 'during'}
    return tokens - stopwords

def evaluate_metrics():
    json_path = "../../evaluation/test_results.json"
    out_path = "../../evaluation/evaluation_report.json"
    
    if not os.path.exists(json_path):
        print(f"File not found: {json_path}")
        return
        
    with open(json_path, 'r', encoding='utf-8') as f:
        results = json.load(f)
        
    metrics = {
        "format_adherence": {"total_applicable": 0, "correct_format": 0},
        "domain_diversity": {"total_applicable": 0, "diverse_queries": 0},
        "lexical_overlap": {"total_queries": 0, "avg_jaccard": 0.0},
        "query_metrics": []
    }
    
    total_jaccard = 0.0
    
    for req in results:
        q_info = req["query_info"]
        retrieved = req["retrieved"]
        
        if not retrieved:
            continue
            
        genre_str = q_info["genre"].lower()
        
        # 1. Format Adherence
        is_format_explicit = False
        target_format = None
        if "movie" in genre_str or "drama" in genre_str:
            is_format_explicit = True
            target_format = "MOVIE"
        elif "game" in genre_str or "rpg" in genre_str or "shooter" in genre_str or "platformer" in genre_str:
            is_format_explicit = True
            target_format = "GAME"
            
        correct_format_count = 0
        if is_format_explicit:
            metrics["format_adherence"]["total_applicable"] += len(retrieved)
            for item in retrieved:
                if item["type"] == target_format:
                    correct_format_count += 1
                    metrics["format_adherence"]["correct_format"] += 1
                    
        # 2. Domain Diversity
        is_diverse = False
        if not is_format_explicit and len(retrieved) > 1:
            metrics["domain_diversity"]["total_applicable"] += 1
            types = {item["type"] for item in retrieved}
            if len(types) > 1:
                is_diverse = True
                metrics["domain_diversity"]["diverse_queries"] += 1
                
        # 3. Lexical Overlap (Jaccard similarity)
        query_tokens = tokenize(q_info["full_query"])
        item_jaccards = []
        for item in retrieved:
            item_text = item["themes"] + " " + item["narrative"]
            item_tokens = tokenize(item_text)
            
            if len(query_tokens) == 0 or len(item_tokens) == 0:
                item_jaccards.append(0.0)
                continue
                
            intersection = len(query_tokens.intersection(item_tokens))
            union = len(query_tokens.union(item_tokens))
            item_jaccards.append(intersection / union)
            
        avg_req_jaccard = sum(item_jaccards) / len(item_jaccards)
        total_jaccard += avg_req_jaccard
        metrics["lexical_overlap"]["total_queries"] += 1
        
        metrics["query_metrics"].append({
            "query": q_info["full_query"],
            "target_format": target_format,
            "format_accuracy": correct_format_count / len(retrieved) if is_format_explicit else None,
            "is_diverse": is_diverse if not is_format_explicit else None,
            "avg_jaccard": avg_req_jaccard
        })
        
    if metrics["lexical_overlap"]["total_queries"] > 0:
        metrics["lexical_overlap"]["avg_jaccard"] = total_jaccard / metrics["lexical_overlap"]["total_queries"]
        
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)
        
    print(f"Evaluation metrics computed and saved to {out_path}.")
    
if __name__ == "__main__":
    evaluate_metrics()
