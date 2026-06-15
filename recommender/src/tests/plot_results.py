import os
import json
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import warnings

# Suppress seaborn future warnings
warnings.filterwarnings("ignore", "Passing `palette` without assigning `hue`")

def plot_results():
    report_path = "../../evaluation/evaluation_report.json"
    results_path = "../../evaluation/test_results.json"
    
    if not os.path.exists(report_path) or not os.path.exists(results_path):
        print("Missing evaluation files. Run evaluate_metrics.py first.")
        return
        
    with open(report_path, 'r', encoding='utf-8') as f:
        report = json.load(f)
        
    with open(results_path, 'r', encoding='utf-8') as f:
        raw_results = json.load(f)
        
    sns.set_theme(style="whitegrid")
    
    # 1. Format Adherence (Pie Chart)
    adherence = report["format_adherence"]
    if adherence["total_applicable"] > 0:
        correct = adherence["correct_format"]
        incorrect = adherence["total_applicable"] - correct
        plt.figure(figsize=(6, 6))
        plt.pie([correct, incorrect], labels=["Correct Format", "Incorrect Format"], 
                autopct='%1.1f%%', colors=['#4CAF50', '#F44336'])
        plt.title('Format Adherence Accuracy')
        plt.savefig("../../evaluation/format_adherence.png", dpi=300)
        plt.close()
        
    # 2. Domain Diversity (Pie Chart)
    diversity = report["domain_diversity"]
    if diversity["total_applicable"] > 0:
        div = diversity["diverse_queries"]
        homo = diversity["total_applicable"] - div
        plt.figure(figsize=(6, 6))
        plt.pie([div, homo], labels=["Cross-Domain", "Single Domain"], 
                autopct='%1.1f%%', colors=['#2196F3', '#FF9800'])
        plt.title('Domain Diversity (for neutral queries)')
        plt.savefig("../../evaluation/domain_diversity.png", dpi=300)
        plt.close()
        
    # 3. Lexical Overlap Histogram
    query_metrics = report["query_metrics"]
    df = pd.DataFrame(query_metrics)
    if not df.empty and 'avg_jaccard' in df.columns:
        plt.figure(figsize=(8, 6))
        sns.histplot(df['avg_jaccard'], bins=20, kde=True, color='mediumpurple')
        plt.title('Distribution of Keyword Overlap (Jaccard Similarity)')
        plt.xlabel('Jaccard Similarity')
        plt.ylabel('Frequency')
        plt.savefig("../../evaluation/lexical_overlap.png", dpi=300)
        plt.close()
        
    # 4. Old Cosine Similarity Charts
    flattened = []
    for req in raw_results:
        for item in req["retrieved"]:
            flattened.append({
                "Rank": item["rank"],
                "Cosine Similarity": 1.0 - (item["score"] / 2.0),
                "Type": item["type"]
            })
            
    if flattened:
        df_sim = pd.DataFrame(flattened)
        
        # Average Cosine Similarity by Rank
        plt.figure(figsize=(8, 6))
        sns.barplot(data=df_sim, x='Rank', y='Cosine Similarity', errorbar='sd', palette='viridis', hue='Rank', legend=False)
        plt.title('Average Cosine Similarity by Retrieval Rank')
        plt.xlabel('Rank')
        plt.ylabel('Cosine Similarity')
        plt.ylim(0, 1.0)
        plt.savefig("../../evaluation/similarity_by_rank.png", dpi=300)
        plt.close()
        
        # Similarity by Type
        plt.figure(figsize=(8, 6))
        sns.boxplot(data=df_sim, x='Type', y='Cosine Similarity', palette='Set2', hue='Type', legend=False)
        plt.title('Distribution of Cosine Similarities: Games vs Movies')
        plt.xlabel('Media Type')
        plt.ylabel('Cosine Similarity')
        plt.savefig("../../evaluation/similarity_by_type.png", dpi=300)
        plt.close()

    print("All charts generated and saved to evaluation/ directory.")

if __name__ == "__main__":
    plot_results()
