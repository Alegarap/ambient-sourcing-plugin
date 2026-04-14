# Ambient Sourcing — Claude Code Plugin

Query Lunar Ventures' ambient sourcing database directly from Claude Code. Search themes, deals, clusters, and hotness scores across 6+ data sources.

## What you get

**13 MCP tools** your Claude agent can use:

| Tool | What it does |
|------|-------------|
| `get_hot_clusters` | Top investment themes by hotness score |
| `semantic_search_clusters` | Find clusters by meaning (e.g., "robotics") |
| `semantic_search` | Find items by meaning, filter by type |
| `search_themes` | Keyword search across themes |
| `search_deals` | Keyword search across deals |
| `get_cluster_items` | Items in a specific cluster |
| `cluster_overview` | Landscape summary: totals, distribution, top 5 |
| `recent_items` | Browse recent items by source/type |
| `item_details` | Full details on a specific item |
| `list_sources` | Active data pipelines and counts |
| `source_distribution` | Breakdown by source and type |
| `ingestion_stats` | Pipeline health metrics |
| `investment_domains` | Lunar's 9 investment domains |

## Prerequisites

- **Node.js** 18+ (`brew install node`)
- **1Password CLI** (`brew install 1password-cli`)
- Access to the **lunar-secrets** vault in 1Password

## Setup

```bash
# 1. Clone the plugin
git clone git@github.com:lunar-ventures/ambient-sourcing-plugin.git ~/.claude/plugins/ambient-sourcing

# 2. Run setup (checks 1Password, tests connectivity, adds shell function)
~/.claude/plugins/ambient-sourcing/setup.sh
```

The setup script will:
1. Install npm dependencies and build the TypeScript server
2. Verify your 1Password CLI is installed and signed in
3. Check you have access to the `lunar-secrets` vault
4. Test Supabase connectivity
5. Offer to add a `claude-sourcing` shell function to your profile

### Launching Claude with credentials

After setup, use the shell function to launch Claude with secrets injected:

```bash
claude-sourcing
```

This resolves `op://` references from 1Password at runtime — no secrets are written to disk.

### Credentials

All credentials are in the **Supabase Ambient Sourcing** item in the **lunar-secrets** 1Password vault:

| Credential | 1Password field | Required for |
|-----------|----------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | `service role key` | All tools |
| `OPENROUTER_API_KEY` | `OpenRouter Ambient Sourcing CC Plugin` | Semantic search only |

The `.env.1password` file contains `op://` references that are resolved at runtime. It's safe to commit — it contains no actual secrets.

## Usage

Once Claude is running with credentials, just ask questions naturally:

- *"What's hot in robotics?"*
- *"Find me deals related to quantum computing"*
- *"What themes came in from Hacker News this week?"*
- *"Show me the hottest clusters right now"*
- *"Search for anything about drug discovery"*

Claude will use the MCP tools automatically to query the database and present results.

## How the data works

- **~10,000+ items** across 9 sources (Linear, HN, arXiv, conferences, RSS, GitHub, funding, Tigerclaw, SBIR)
- Items are either **themes** (investment topics) or **deals** (companies/startups)
- Similar items are grouped into **clusters** using embedding similarity
- Each cluster gets a **hotness score** (0–1) based on source convergence, recency, thesis alignment, size, and novelty
- **0.5+** is considered hot

## Troubleshooting

**"SUPABASE_SERVICE_ROLE_KEY not set"** — You launched Claude without credentials. Use `claude-sourcing` instead of `claude`.

**"OPENROUTER_API_KEY not set"** — Semantic search won't work, but keyword search and all other tools will. Check the OpenRouter field in 1Password.

**"Cannot access lunar-secrets vault"** — Ask Alejandro to share the vault, or run `op signin` to refresh your session.

**Setup script fails on npm install** — Make sure Node.js 18+ is installed: `node --version`.
