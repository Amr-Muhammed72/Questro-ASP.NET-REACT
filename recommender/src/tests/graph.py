import json
import os
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd


def parse_test_results(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        results = json.load(f)

    rows = []
    latencies = []

    for entry in results:
        latencies.append(entry['latency_sec'])
        for item in entry['retrieved']:
            cosine_sim = 1.0 - (item['score'] / 2.0)
            rows.append({
                'Rank': item['rank'],
                'Distance Score': item['score'],
                'Cosine Similarity': cosine_sim,
                'Type': item['type'],
            })

    return pd.DataFrame(rows), pd.DataFrame({'Latency (s)': latencies})


def generate_charts():
    filepath = '../../evaluation/test_results.json'
    if not os.path.exists(filepath):
        print(f"Cannot find {filepath}")
        return

    df, latency_df = parse_test_results(filepath)
    if df.empty:
        print("No data parsed.")
        return

    print(f"Parsed {len(df)} retrieved items across {len(latency_df)} queries.")
    sns.set_theme(style="whitegrid")

    # 1. Histogram of Top-1 Cosine Similarities
    plt.figure(figsize=(10, 6))
    top1_df = df[df['Rank'] == 1]
    sns.histplot(data=top1_df, x='Cosine Similarity', bins=15, kde=True, color='mediumpurple')
    plt.title('Distribution of Top-1 Cosine Similarities (100 Queries)')
    plt.xlabel('Cosine Similarity (1.0 = Perfect Match)')
    plt.ylabel('Frequency')
    plt.tight_layout()
    plt.savefig('../../evaluation/top1_similarity_hist.png', dpi=300)
    plt.close()

    # 2. Average Cosine Similarity by Rank
    plt.figure(figsize=(8, 6))
    sns.barplot(data=df, x='Rank', y='Cosine Similarity', errorbar='sd', palette='viridis')
    plt.title('Average Cosine Similarity by Retrieval Rank')
    plt.xlabel('Rank')
    plt.ylabel('Cosine Similarity')
    plt.ylim(0, 1.0)
    plt.tight_layout()
    plt.savefig('../../evaluation/similarity_by_rank.png', dpi=300)
    plt.close()

    # 3. Similarity by Item Type (Boxplot)
    plt.figure(figsize=(8, 6))
    sns.boxplot(data=df, x='Type', y='Cosine Similarity', palette='Set2')
    plt.title('Distribution of Cosine Similarities: Games vs Movies')
    plt.xlabel('Media Type')
    plt.ylabel('Cosine Similarity')
    plt.tight_layout()
    plt.savefig('../../evaluation/similarity_by_type.png', dpi=300)
    plt.close()

    # 4. Query Latency Distribution
    plt.figure(figsize=(10, 6))
    sns.histplot(data=latency_df, x='Latency (s)', bins=20, kde=True, color='steelblue')
    plt.title('Query Latency Distribution (100 Queries)')
    plt.xlabel('Latency (seconds)')
    plt.ylabel('Frequency')
    plt.tight_layout()
    plt.savefig('../../evaluation/latency_distribution.png', dpi=300)
    plt.close()

    print("Charts saved to ../../evaluation/")


if __name__ == '__main__':
    generate_charts()