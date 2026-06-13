import os
import re
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd

def parse_test_results(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    pattern = r'\[(\d+)\] Score: ([\d\.]+) \| Type: (\w+)'
    matches = re.findall(pattern, content)
    
    data = []
    for match in matches:
        rank = int(match[0])
        score = float(match[1])
        item_type = match[2]
        cosine_sim = 1.0 - (score / 2.0)
        
        data.append({
            'Rank': rank,
            'Distance Score': score,
            'Cosine Similarity': cosine_sim,
            'Type': item_type
        })
        
    return pd.DataFrame(data)

def generate_charts():
    filepath = './evaluation/100_realistic_tests.txt'
    if not os.path.exists(filepath):
        print(f"Cannot find {filepath}")
        return
        
    df = parse_test_results(filepath)
    if df.empty:
        print("No data parsed.")
        return
        
    print(f"Parsed {len(df)} results from test output.")
    sns.set_theme(style="whitegrid")
    
    # 1. Histogram of Top-1 Cosine Similarities
    plt.figure(figsize=(10, 6))
    top1_df = df[df['Rank'] == 1]
    sns.histplot(data=top1_df, x='Cosine Similarity', bins=15, kde=True, color='mediumpurple')
    plt.title('Distribution of Top-1 Cosine Similarities (100 Queries)')
    plt.xlabel('Cosine Similarity (1.0 = Perfect Match)')
    plt.ylabel('Frequency')
    plt.tight_layout()
    top1_hist_path = './evaluation/top1_similarity_hist.png'
    plt.savefig(top1_hist_path, dpi=300)
    plt.close()
    
    # 2. Average Cosine Similarity by Rank
    plt.figure(figsize=(8, 6))
    sns.barplot(data=df, x='Rank', y='Cosine Similarity', errorbar='sd', palette='viridis')
    plt.title('Average Cosine Similarity by Retrieval Rank')
    plt.xlabel('Rank')
    plt.ylabel('Cosine Similarity')
    plt.ylim(0, 1.0)
    plt.tight_layout()
    rank_bar_path = './evaluation/similarity_by_rank.png'
    plt.savefig(rank_bar_path, dpi=300)
    plt.close()
    
    # 3. Similarity by Item Type (Boxplot)
    plt.figure(figsize=(8, 6))
    sns.boxplot(data=df, x='Type', y='Cosine Similarity', palette='Set2')
    plt.title('Distribution of Cosine Similarities: Games vs Movies')
    plt.xlabel('Media Type')
    plt.ylabel('Cosine Similarity')
    plt.tight_layout()
    type_box_path = './evaluation/similarity_by_type.png'
    plt.savefig(type_box_path, dpi=300)
    plt.close()
    
if __name__ == '__main__':
    generate_charts()
