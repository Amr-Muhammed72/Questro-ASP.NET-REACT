"""
analyze.py
----------
Reads evaluation/results.json (and optionally results_baseline.json) produced
by evaluate.py and saves:
  evaluation/analysis_report.png  — 8-panel chart dashboard
  evaluation/summary_table.csv    — per-category metrics table
  evaluation/repeat_items.csv     — titles that appear too often (index noise)
  evaluation/gt_misses.txt        — ground-truth queries that failed to hit

Pass --baseline to load results_baseline.json (the FAISS-only run) and add a
reranking-delta panel comparing profile vs no-profile results.

Usage:
    cd recommender
    python -m src.tests.analyze
    python -m src.tests.analyze --baseline
    python -m src.tests.analyze --input evaluation/results.json
"""

import argparse
import csv
import json
import os
from collections import Counter, defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np


OUT_DIR = "evaluation"

CATEGORY_LABELS = {
    "profile_coherent": "Profile Coherent",
    "cross_domain":     "Cross-Domain",
    "title_based":      "Title-Based",
    "ground_truth":     "Ground Truth",
    "no_profile":       "No Profile",
    "edge_case":        "Edge Case",
}

COLORS = {
    "movie":  "#4C9BE8",
    "game":   "#E87B4C",
    "mixed":  "#6DBF67",
    "error":  "#D9534F",
    "bar":    "#5B8DB8",
    "accent": "#D4A017",
}


# ── helpers ───────────────────────────────────────────────────────────────────

def load(path: str) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def compute_metrics(results: list) -> dict:
    ok     = [r for r in results if r["status"] == "ok"]
    errors = [r for r in results if r["status"] == "error"]

    all_items = [item for r in ok for item in r.get("results", [])]
    by_cat    = defaultdict(list)
    for r in ok:
        by_cat[r["category"]].append(r)

    type_counter = Counter(i.get("type", "unknown") for i in all_items)
    total_typed  = sum(type_counter.values()) or 1

    reviews        = [i["review_count"] for i in all_items if i.get("review_count")]
    quality_scores = [i["quality_score"] for i in all_items if i.get("quality_score")]
    scores         = [i["score"] for i in all_items]
    mixed          = [r for r in ok if r.get("is_mixed")]
    profiled       = [r for r in ok if r.get("profile_used")]

    gt_results = [r for r in ok if r.get("ground_truth_hit") is not None]
    gt_hits    = [r for r in gt_results if r["ground_truth_hit"]]
    gt_misses  = [r for r in gt_results if not r["ground_truth_hit"]]

    title_counts = Counter(i["title"] for i in all_items if i.get("title"))
    repeaters    = sorted(
        [(t, c) for t, c in title_counts.items() if c >= 3],
        key=lambda x: -x[1]
    )

    cat_stats = {}
    for cat, items in by_cat.items():
        cat_items   = [i for r in items for i in r.get("results", [])]
        cat_reviews = [i["review_count"] for i in cat_items if i.get("review_count")]
        cat_latency = [r["latency_s"] for r in items]
        cat_stats[cat] = {
            "label":        CATEGORY_LABELS.get(cat, cat),
            "count":        len(items),
            "mixed_pct":    round(sum(1 for r in items if r.get("is_mixed")) / len(items) * 100, 1),
            "avg_latency":  round(sum(cat_latency) / len(cat_latency), 2) if cat_latency else 0,
            "avg_reviews":  round(sum(cat_reviews) / len(cat_reviews), 0) if cat_reviews else 0,
            "with_profile": sum(1 for r in items if r.get("profile_used")),
            "error_count":  sum(1 for r in results if r.get("category") == cat and r["status"] == "error"),
        }

    return {
        "ok":             ok,
        "errors":         errors,
        "all_items":      all_items,
        "by_cat":         by_cat,
        "type_counter":   type_counter,
        "total_typed":    total_typed,
        "reviews":        reviews,
        "quality_scores": quality_scores,
        "scores":         scores,
        "mixed":          mixed,
        "profiled":       profiled,
        "gt_results":     gt_results,
        "gt_hits":        gt_hits,
        "gt_misses":      gt_misses,
        "repeaters":      repeaters,
        "cat_stats":      cat_stats,
    }


def _ax_style(ax, title: str):
    ax.set_facecolor("#FFFFFF")
    for spine in ax.spines.values():
        spine.set_edgecolor("#CCCCCC")
    ax.tick_params(colors="#444455", labelsize=8)
    ax.set_title(title, color="#1A1A2E", fontweight="bold", fontsize=9)
    ax.xaxis.label.set_color("#555566")
    ax.yaxis.label.set_color("#555566")


# ── dashboard ─────────────────────────────────────────────────────────────────

def make_dashboard(m: dict, out_path: str, baseline: dict = None):
    has_baseline = baseline is not None
    rows = 3
    cols = 3 if not has_baseline else 3
    n_panels = 8 if has_baseline else 7

    fig = plt.figure(figsize=(18, 14 if not has_baseline else 18))
    fig.patch.set_facecolor("#F0F0F5")
    fig.suptitle("Recommender Evaluation Dashboard", fontsize=18,
                 fontweight="bold", color="#1A1A2E", y=0.99)

    GRID = (3, 3) if not has_baseline else (3, 3)

    ax_domain  = plt.subplot2grid(GRID, (0, 0))
    ax_mixed   = plt.subplot2grid(GRID, (0, 1))
    ax_latency = plt.subplot2grid(GRID, (0, 2))
    ax_scores  = plt.subplot2grid(GRID, (1, 0), colspan=2)
    ax_quality = plt.subplot2grid(GRID, (1, 2))
    ax_repeats = plt.subplot2grid(GRID, (2, 0), colspan=2)
    ax_gt      = plt.subplot2grid(GRID, (2, 2))

    all_axes = [ax_domain, ax_mixed, ax_latency, ax_scores,
                ax_quality, ax_repeats, ax_gt]
    for ax in all_axes:
        _ax_style(ax, "")

    # ── panel 1: domain distribution pie ──
    tc   = m["type_counter"]
    dlbl = [k for k in tc if tc[k] > 0]
    dval = [tc[k] for k in dlbl]
    pal  = [COLORS.get(k, "#999999") for k in dlbl]
    wedges, _, autotexts = ax_domain.pie(
        dval, labels=None, autopct="%1.1f%%", colors=pal, startangle=90,
        wedgeprops=dict(edgecolor="#FFFFFF", linewidth=1.5),
        textprops=dict(color="white", fontsize=8)
    )
    ax_domain.legend(
        wedges, [f"{l} ({v})" for l, v in zip(dlbl, dval)],
        loc="lower center", fontsize=7, framealpha=0,
        labelcolor="#333344", bbox_to_anchor=(0.5, -0.14)
    )
    _ax_style(ax_domain, "Domain Distribution")

    # ── panel 2: mixed-domain % per category ──
    cats    = [c for c in CATEGORY_LABELS if c in m["cat_stats"]]
    labels  = [m["cat_stats"][c]["label"] for c in cats]
    mixed_p = [m["cat_stats"][c]["mixed_pct"] for c in cats]
    bars = ax_mixed.barh(labels, mixed_p, color=COLORS["mixed"], edgecolor="#FFFFFF")
    for bar, val in zip(bars, mixed_p):
        ax_mixed.text(min(val + 1.5, 96), bar.get_y() + bar.get_height() / 2,
                      f"{val}%", va="center", ha="left", color="#222233", fontsize=7)
    ax_mixed.set_xlim(0, 110)
    ax_mixed.set_xlabel("% queries returning both games + movies")
    ax_mixed.axvline(x=30, color="#FF6B6B", linewidth=1, linestyle="--", alpha=0.7)
    ax_mixed.text(31, len(labels) - 0.5, "30% target", color="#FF6B6B", fontsize=6)
    _ax_style(ax_mixed, "Cross-Domain Mix Rate by Category")

    # ── panel 3: avg latency per category ──
    latencies  = [m["cat_stats"][c]["avg_latency"] for c in cats]
    bar_colors = ["#E87B4C" if l > 5 else COLORS["bar"] for l in latencies]
    bars = ax_latency.barh(labels, latencies, color=bar_colors, edgecolor="#FFFFFF")
    for bar, val in zip(bars, latencies):
        ax_latency.text(val + 0.1, bar.get_y() + bar.get_height() / 2,
                        f"{val}s", va="center", ha="left", color="#222233", fontsize=7)
    ax_latency.set_xlabel("Average latency (seconds)")
    ax_latency.axvline(x=5, color="#FF6B6B", linewidth=1, linestyle="--", alpha=0.7)
    ax_latency.text(5.1, len(labels) - 0.5, "5s", color="#FF6B6B", fontsize=6)
    _ax_style(ax_latency, "Avg Latency by Category")

    # ── panel 4: similarity score distribution ──
    scores = m["scores"]
    if scores:
        ax_scores.hist(scores, bins=40, color=COLORS["bar"], edgecolor="#FFFFFF",
                       alpha=0.85, label="L2 distance")
        ax_scores.axvline(x=float(np.mean(scores)), color=COLORS["accent"], linewidth=1.5,
                          linestyle="--", label=f"mean={np.mean(scores):.3f}")
        ax_scores.axvline(x=1.2, color="#FF6B6B", linewidth=1.5,
                          linestyle="--", label="dist>1.2 (poor match)")
        high = sum(1 for s in scores if s > 1.2)
        ax_scores.text(0.98, 0.93, f"Poor matches: {high} ({100*high//max(len(scores),1)}%)",
                       transform=ax_scores.transAxes, ha="right", va="top",
                       color="#FF6B6B", fontsize=8)
    ax_scores.legend(fontsize=7, framealpha=0, labelcolor="#333344")
    ax_scores.set_xlabel("L2 distance  (lower = more similar to query)")
    ax_scores.set_ylabel("Item count")
    _ax_style(ax_scores, "Retrieval Similarity Score Distribution")

    # ── panel 5: quality score distribution ──
    qs = m["quality_scores"]
    if qs:
        ax_quality.hist(qs, bins=20, color="#9B59B6", edgecolor="#FFFFFF", alpha=0.85)
        ax_quality.axvline(x=float(np.mean(qs)), color=COLORS["accent"], linewidth=1.5, linestyle="--")
        ax_quality.text(0.97, 0.93, f"avg={np.mean(qs):.1f}/10",
                        transform=ax_quality.transAxes, ha="right", va="top",
                        color=COLORS["accent"], fontsize=8)
    ax_quality.set_xlabel("Item quality score (/10)")
    ax_quality.set_ylabel("Count")
    _ax_style(ax_quality, "Item Quality Score Distribution")

    # ── panel 6: top repeat items ──
    reps = m["repeaters"][:15]
    if reps:
        rep_titles = [t[:30] + "…" if len(t) > 30 else t for t, _ in reps]
        rep_counts = [c for _, c in reps]
        rep_colors = ["#E87B4C" if c >= 8 else "#E8C44C" if c >= 5 else COLORS["bar"]
                      for c in rep_counts]
        bars = ax_repeats.barh(rep_titles[::-1], rep_counts[::-1],
                               color=rep_colors[::-1], edgecolor="#FFFFFF")
        for bar, val in zip(bars, rep_counts[::-1]):
            ax_repeats.text(val + 0.1, bar.get_y() + bar.get_height() / 2,
                            str(val), va="center", ha="left", color="#222233", fontsize=7)
        ax_repeats.set_xlabel("Appearances across all queries")
        orange = mpatches.Patch(color="#E87B4C", label="≥8 high noise")
        yellow = mpatches.Patch(color="#E8C44C", label="5–7 moderate")
        blue   = mpatches.Patch(color=COLORS["bar"], label="3–4 watch")
        ax_repeats.legend(handles=[orange, yellow, blue], fontsize=7,
                          framealpha=0, labelcolor="#333344", loc="lower right")
        _ax_style(ax_repeats, "Most Repeated Items (≥3) — Index Noise Indicators")
    else:
        ax_repeats.text(0.5, 0.5, "No repeat items (≥3 appearances)\nGood diversity!",
                        ha="center", va="center", color="#6DBF67", fontsize=11,
                        transform=ax_repeats.transAxes)
        _ax_style(ax_repeats, "Repeat Items")

    # ── panel 7: ground-truth + reranking profile bar ──
    gt = m["gt_results"]
    if gt:
        hit_n  = len(m["gt_hits"])
        miss_n = len(m["gt_misses"])
        ax_gt.bar(["Hit", "Miss"], [hit_n, miss_n],
                  color=[COLORS["mixed"], COLORS["error"]],
                  edgecolor="#FFFFFF", width=0.4)
        ax_gt.text(0, hit_n + 0.1,  str(hit_n),  ha="center", color="#222233", fontsize=11)
        ax_gt.text(1, miss_n + 0.1, str(miss_n), ha="center", color="#222233", fontsize=11)
        pct = round(hit_n / len(gt) * 100, 1)
        ax_gt.text(0.5, 0.93, f"{pct}% hit rate",
                   transform=ax_gt.transAxes, ha="center", va="top",
                   color=COLORS["accent"], fontsize=10, fontweight="bold")
        n_prof = sum(1 for r in gt if r.get("profile_used"))
        ax_gt.text(0.5, 0.04, f"{n_prof}/{len(gt)} with ML rerank",
                   transform=ax_gt.transAxes, ha="center", va="bottom",
                   color="#666677", fontsize=7)
        ax_gt.set_ylabel("Queries")
    else:
        ax_gt.text(0.5, 0.5, "No ground-truth\nqueries in dataset",
                   ha="center", va="center", color="#666677", fontsize=10,
                   transform=ax_gt.transAxes)
    _ax_style(ax_gt, "Ground-Truth Hit Rate")

    # ── optional baseline comparison (appended as extra figure) ──
    if has_baseline:
        bm = compute_metrics(baseline["results"])
        fig2, (ax_cmp_mixed, ax_cmp_gt) = plt.subplots(1, 2, figsize=(14, 5))
        fig2.patch.set_facecolor("#F0F0F5")
        fig2.suptitle("ML Reranking vs FAISS-Only Baseline", fontsize=14,
                      fontweight="bold", color="#1A1A2E")

        for ax in [ax_cmp_mixed, ax_cmp_gt]:
            _ax_style(ax, "")

        # cross-domain mix: personalized vs baseline per category
        shared_cats = [c for c in CATEGORY_LABELS
                       if c in m["cat_stats"] and c in bm["cat_stats"]]
        s_labels   = [CATEGORY_LABELS.get(c, c) for c in shared_cats]
        s_pers     = [m["cat_stats"][c]["mixed_pct"] for c in shared_cats]
        s_base     = [bm["cat_stats"][c]["mixed_pct"] for c in shared_cats]
        x = np.arange(len(s_labels))
        w = 0.35
        ax_cmp_mixed.bar(x - w/2, s_pers, w, label="With profile (ML rerank)",
                         color=COLORS["mixed"], edgecolor="#FFFFFF")
        ax_cmp_mixed.bar(x + w/2, s_base, w, label="No profile (FAISS only)",
                         color=COLORS["bar"], edgecolor="#FFFFFF")
        ax_cmp_mixed.set_xticks(x)
        ax_cmp_mixed.set_xticklabels(s_labels, rotation=20, ha="right", fontsize=8)
        ax_cmp_mixed.set_ylabel("% mixed-domain results")
        ax_cmp_mixed.legend(fontsize=8, framealpha=0, labelcolor="#333344")
        _ax_style(ax_cmp_mixed, "Cross-Domain Mix: Personalized vs Baseline")

        # ground truth comparison
        gt_pers  = len(m["gt_hits"])   / max(len(m["gt_results"]), 1) * 100
        gt_base  = len(bm["gt_hits"])  / max(len(bm["gt_results"]), 1) * 100
        bars = ax_cmp_gt.bar(["With Profile\n(ML rerank)", "No Profile\n(FAISS only)"],
                              [gt_pers, gt_base],
                              color=[COLORS["mixed"], COLORS["bar"]],
                              edgecolor="#FFFFFF", width=0.4)
        for bar, val in zip(bars, [gt_pers, gt_base]):
            ax_cmp_gt.text(bar.get_x() + bar.get_width()/2, val + 1,
                           f"{val:.1f}%", ha="center", color="#222233", fontsize=10)
        ax_cmp_gt.set_ylim(0, 110)
        ax_cmp_gt.set_ylabel("Ground-truth hit rate (%)")
        _ax_style(ax_cmp_gt, "Ground-Truth Hit Rate: Personalized vs Baseline")

        cmp_path = os.path.join(OUT_DIR, "reranking_comparison.png")
        plt.tight_layout()
        plt.savefig(cmp_path, dpi=130, bbox_inches="tight",
                    facecolor=fig2.get_facecolor())
        plt.close(fig2)
        print(f"Saved: {cmp_path}")

    plt.tight_layout(rect=[0, 0, 1, 0.97])
    plt.savefig(out_path, dpi=130, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    plt.close(fig)
    print(f"Saved: {out_path}")


# ── CSV exports ───────────────────────────────────────────────────────────────

def save_summary_csv(m: dict, out_path: str):
    ok      = m["ok"]
    scores  = m["scores"]
    qs      = m["quality_scores"]
    reviews = m["reviews"]

    rows = []
    for cat in CATEGORY_LABELS:
        if cat not in m["cat_stats"]:
            continue
        s = m["cat_stats"][cat]
        rows.append({
            "category":            s["label"],
            "query_count":         s["count"],
            "mixed_pct":           s["mixed_pct"],
            "avg_latency_s":       s["avg_latency"],
            "avg_review_count":    s["avg_reviews"],
            "queries_with_profile":s["with_profile"],
            "errors":              s["error_count"],
        })

    rows.append({})
    rows.append({
        "category":            "TOTAL",
        "query_count":         len(ok),
        "mixed_pct":           round(len(m["mixed"]) / max(len(ok), 1) * 100, 1),
        "avg_latency_s":       round(sum(r["latency_s"] for r in ok) / max(len(ok), 1), 2),
        "avg_review_count":    round(sum(reviews) / max(len(reviews), 1), 0),
        "queries_with_profile":len(m["profiled"]),
        "errors":              len(m["errors"]),
    })
    rows.append({"category": "avg_similarity_dist",
                 "query_count": round(sum(scores)/max(len(scores),1), 4) if scores else "N/A"})
    rows.append({"category": "avg_quality_score",
                 "query_count": round(sum(qs)/max(len(qs),1), 2) if qs else "N/A"})
    gt = m["gt_results"]
    rows.append({"category": "ground_truth_hit_rate",
                 "query_count": f"{round(len(m['gt_hits'])/max(len(gt),1)*100,1)}%" if gt else "N/A"})
    rows.append({"category": "repeat_items_count",
                 "query_count": len(m["repeaters"])})

    fieldnames = ["category", "query_count", "mixed_pct", "avg_latency_s",
                  "avg_review_count", "queries_with_profile", "errors"]
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    print(f"Saved: {out_path}")


def save_repeat_items_csv(m: dict, out_path: str):
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["appearances", "title"])
        writer.writeheader()
        for title, count in m["repeaters"]:
            writer.writerow({"appearances": count, "title": title})
    print(f"Saved: {out_path}")


def save_gt_misses(m: dict, out_path: str):
    lines = ["GROUND-TRUTH MISSES\n" + "=" * 60 + "\n"]
    for r in m["gt_misses"]:
        returned = [i["title"] for i in r.get("results", [])]
        user_tag = f"[user={r.get('user_key','none')}]" if r.get("user_key") else "[no-profile]"
        lines.append(f"[{r['id']}] {user_tag}  {r['query']}")
        lines.append(f"  Returned: {', '.join(returned)}")
        lines.append("")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Saved: {out_path}")


# ── text report ───────────────────────────────────────────────────────────────

def print_report(m: dict, baseline: dict = None):
    ok      = m["ok"]
    errors  = m["errors"]
    mixed   = m["mixed"]
    scores  = m["scores"]
    reviews = m["reviews"]
    qs      = m["quality_scores"]
    gt      = m["gt_results"]
    reps    = m["repeaters"]
    profiled = m["profiled"]

    sep = "=" * 70
    print(sep)
    print("RECOMMENDER EVALUATION REPORT")
    print(sep)

    print(f"\n  Queries:         {len(ok)+len(errors)} total  |  {len(ok)} ok  |  {len(errors)} errors")
    print(f"  With ML rerank:  {len(profiled)} / {len(ok)} queries had a user profile")
    if ok:
        avg_lat = sum(r["latency_s"] for r in ok) / len(ok)
        lats    = sorted(r["latency_s"] for r in ok)
        p95     = lats[int(len(lats)*0.95)]
        print(f"  Avg latency:     {avg_lat:.2f}s  (p95: {p95:.2f}s)")
        print(f"  Mixed-domain:    {len(mixed)}/{len(ok)} = {round(len(mixed)/len(ok)*100,1)}%")

    tc    = m["type_counter"]
    total = sum(tc.values()) or 1
    print(f"\n  Domain split:    movies={round(tc.get('movie',0)/total*100,1)}%  "
          f"games={round(tc.get('game',0)/total*100,1)}%")

    if gt:
        pct = round(len(m["gt_hits"]) / len(gt) * 100, 1)
        print(f"  Ground-truth:    {len(m['gt_hits'])}/{len(gt)} = {pct}%")

    if scores:
        high = sum(1 for s in scores if s > 1.2)
        print(f"\n  Similarity dist: avg={np.mean(scores):.4f}  "
              f"min={min(scores):.4f}  max={max(scores):.4f}")
        print(f"  Poor matches:    {high}/{len(scores)} = {round(high/len(scores)*100,1)}%  (dist > 1.2)")

    if reviews:
        low = sum(1 for r in reviews if r < 10)
        print(f"\n  Avg reviews:     {round(sum(reviews)/len(reviews)):,}")
        print(f"  < 10 reviews:    {low}/{len(m['all_items'])} = "
              f"{round(low/len(m['all_items'])*100,1)}%  (noise indicator)")

    if qs:
        print(f"  Avg quality:     {round(sum(qs)/len(qs),2)}/10")

    if reps:
        print(f"\n  Repeat items:    {len(reps)} title(s) appear ≥3 times")
        for title, cnt in reps[:10]:
            flag = "  ← HIGH NOISE" if cnt >= 8 else ""
            print(f"    {cnt:3d}x  {title}{flag}")

    print(f"\n── Per-Category ─────────────────────────────────────────────────")
    for cat in CATEGORY_LABELS:
        if cat not in m["cat_stats"]:
            continue
        s = m["cat_stats"][cat]
        rerank_note = f" | {s['with_profile']}/{s['count']} reranked" if s["with_profile"] > 0 else " | FAISS-only"
        print(f"  {s['label']:<22}  {s['count']:>3} queries | "
              f"{s['mixed_pct']:>5.1f}% mixed | {s['avg_latency']}s avg{rerank_note}")

    if baseline:
        bm = compute_metrics(baseline["results"])
        print(f"\n── Reranking Delta (personalized vs no-profile baseline) ────────")
        m_mixed = round(len(m["mixed"]) / max(len(ok), 1) * 100, 1)
        b_mixed = round(len(bm["mixed"]) / max(len(bm["ok"]), 1) * 100, 1)
        m_gt    = round(len(m["gt_hits"]) / max(len(m["gt_results"]), 1) * 100, 1) if m["gt_results"] else None
        b_gt    = round(len(bm["gt_hits"]) / max(len(bm["gt_results"]), 1) * 100, 1) if bm["gt_results"] else None
        delta_mixed = round(m_mixed - b_mixed, 1)
        print(f"  Mixed-domain:    {m_mixed}% (personalized)  vs  {b_mixed}% (baseline)  "
              f"Δ={delta_mixed:+.1f}%")
        if m_gt and b_gt:
            delta_gt = round(m_gt - b_gt, 1)
            print(f"  Ground-truth:    {m_gt}% (personalized)  vs  {b_gt}% (baseline)  "
                  f"Δ={delta_gt:+.1f}%")

    issues = []
    if scores and sum(1 for s in scores if s > 1.2) / len(scores) > 0.20:
        issues.append("Poor-match rate >20% — consider rebuilding the index or switching model")
    if m["all_items"] and sum(1 for i in m["all_items"] if i.get("review_count",0)<10) / len(m["all_items"]) > 0.15:
        issues.append("Too many low-review items — tighten quality filters and rebuild index")
    if reps and reps[0][1] >= 8:
        issues.append(f"'{reps[0][0]}' appears {reps[0][1]}x — corrupted or garbage index entry")
    if ok and len(mixed) / len(ok) < 0.20:
        issues.append(f"Cross-domain mix only {round(len(mixed)/len(ok)*100,1)}% — retrieval is siloed")
    if gt and len(m["gt_hits"]) / len(gt) < 0.50:
        issues.append(f"Ground-truth hit rate {round(len(m['gt_hits'])/len(gt)*100,1)}% — index needs rebuild")

    if issues:
        print(f"\n── Action Items ─────────────────────────────────────────────────")
        for i, msg in enumerate(issues, 1):
            print(f"  {i}. {msg}")
    else:
        print(f"\n  No critical issues detected.")
    print(sep)


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input",    default=f"{OUT_DIR}/results.json")
    parser.add_argument("--baseline", action="store_true",
                        help="Also load results_baseline.json and add comparison charts")
    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"File not found: {args.input}")
        print("Run `python -m src.tests.evaluate` first.")
        return

    data     = load(args.input)
    m        = compute_metrics(data["results"])
    baseline = None

    if args.baseline:
        bpath = os.path.join(OUT_DIR, "results_baseline.json")
        if os.path.exists(bpath):
            baseline = load(bpath)
            print(f"Loaded baseline from {bpath}")
        else:
            print(f"Baseline file not found ({bpath}). "
                  "Run `python -m src.tests.evaluate --no-profile` first.")

    os.makedirs(OUT_DIR, exist_ok=True)

    print_report(m, baseline=baseline)
    make_dashboard(m, os.path.join(OUT_DIR, "analysis_report.png"), baseline=baseline)
    save_summary_csv(m, os.path.join(OUT_DIR, "summary_table.csv"))
    if m["repeaters"]:
        save_repeat_items_csv(m, os.path.join(OUT_DIR, "repeat_items.csv"))
    if m["gt_misses"]:
        save_gt_misses(m, os.path.join(OUT_DIR, "gt_misses.txt"))


if __name__ == "__main__":
    main()