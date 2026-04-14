---
name: sourcing-data
description: Understand and query Lunar Ventures' ambient sourcing database — investment themes, deals, clusters, and hotness scores from 6+ data sources. Use when the user mentions themes, deals, sourcing, clusters, hotness, investment research, or wants to discover what's relevant in the database.
---

# Ambient Sourcing Data

This plugin connects you to Lunar Ventures' ambient sourcing database — a continuously updated store of investment themes and deals, clustered by similarity and scored for relevance.

## What's in the database

**~10,000+ items** from 9 data sources, continuously growing:

| Source | What it captures |
|--------|-----------------|
| **Linear** | Themes and deals from the investment team's daily workflow |
| **Hacker News** | Trending tech themes spotted on HN |
| **arXiv** | Academic papers on frontier technology |
| **Conferences** | Themes from tech/investment conferences |
| **RSS** | Curated tech blog feeds |
| **GitHub** | Trending repositories |
| **Funding** | Recent funding round signals |
| **Tigerclaw** | Deal flow from the CRM |
| **SBIR** | Government grant programs (historical) |

Each item is either a **theme** (investment topic, e.g. "ML-Driven Synthetic Biology") or a **deal** (specific company/startup).

## How items are organized

### Clusters
Similar items are automatically grouped into **clusters** using embedding similarity (cosine distance < 0.35 on text-embedding-3-small). A cluster like "Autonomous AI Agent Development & Security" might contain themes from Linear, papers from arXiv, and HN discussions — all about the same topic.

### Hotness Score (0–1)
Each cluster gets a **hotness score** — a composite signal of how "hot" the topic is right now:

| Signal | Weight | What it measures |
|--------|--------|-----------------|
| Source convergence | 30% | Multiple independent sources flagging the same topic (1 source=0.2, 4+=1.0) |
| Recency velocity | 25% | Acceleration of new items in last 7 days vs. prior 30 days |
| Thesis alignment | 20% | How close the cluster is to Lunar's 9 investment domains |
| Size density | 15% | Total items in the cluster (more evidence = hotter) |
| Novelty | 10% | How recently the cluster first appeared |

**Scores 0.5+ are considered hot.** The maximum is 1.0.

### Investment Domains
Lunar Ventures tracks 9 core investment domains. Thesis alignment is scored by comparing cluster embeddings to these domain reference vectors:

1. AI/ML Infrastructure
2. Privacy & Cryptography
3. Developer Infrastructure
4. Autonomous Systems
5. Science & Bio Computation
6. Frontier Computing
7. Gaming & Realtime Infrastructure
8. Vertical AI Applications
9. Emerging Deep Tech

## Available MCP Tools

### Discovery (start here)
- **`get_hot_clusters`** — What's hot right now? Top clusters by hotness score.
- **`semantic_search_clusters`** — Find clusters related to a topic by meaning (e.g., "quantum computing hardware").
- **`cluster_overview`** — Big picture: total clusters, hotness distribution, top 5.

### Drill down
- **`get_cluster_items`** — See all items in a cluster (after finding one you're interested in).
- **`item_details`** — Full details on a specific item (metadata, scores, description).

### Search
- **`search_themes`** — Keyword search across theme titles and summaries.
- **`search_deals`** — Keyword search across deal titles and summaries.
- **`semantic_search`** — Find items by meaning, not just keywords. Supports filtering by type (theme/deal).

### Browse
- **`recent_items`** — What was ingested recently? Filter by source and type.
- **`list_sources`** — Which data pipelines are active and how much each contributes.
- **`source_distribution`** — Breakdown by source and type (themes vs deals).

### Reference
- **`ingestion_stats`** — Pipeline health: how many items per source over a period.
- **`investment_domains`** — The 9 investment domains with descriptions.

## Common Workflows

### "What's hot right now?"
1. Call `get_hot_clusters` → see top clusters by hotness
2. Pick interesting ones → call `get_cluster_items` for each
3. Read item summaries to understand the trend

### "Is there anything about [topic]?"
1. Call `semantic_search_clusters` with your topic → find related clusters
2. Or call `semantic_search` for individual items matching your topic
3. Drill into interesting results with `get_cluster_items` or `item_details`

### "What's new this week?"
1. Call `recent_items` with `days: 7` → see latest ingestion
2. Optionally filter by `source` (e.g., "hackernews") or `type` (e.g., "deal")

### "Show me deals in [area]"
1. Call `semantic_search` with `type: "deal"` and your area description
2. Or call `search_deals` with a keyword

## Interpreting Results

- **hotness_score**: 0.5+ is hot, 0.7+ is very hot. Below 0.3 is cold/stale.
- **source_diversity**: How many independent sources flagged this cluster. 3+ sources = strong cross-signal.
- **similarity** (in semantic search results): 0.6+ is a strong match, 0.4-0.6 is moderate, below 0.4 is weak.
- **stage** (for items): raw → triage → curated → scored → setup → live → disqualified. Most items are in triage.
- **action** (for items): What the team decided — find_founders, reach_out, watch, pass.
