import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabaseGet, supabaseCount } from "../supabase.js";

async function paginatedGet<T>(
  table: string,
  params: Record<string, string>
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const page = await supabaseGet<T[]>(table, {
      ...params,
      offset: String(offset),
      limit: String(pageSize),
    });
    results.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
  }
  return results;
}

export function registerBrowseTools(server: McpServer) {
  server.tool(
    "recent_items",
    "Browse recent items ingested into the sourcing database. Filter by source (linear, hackernews, arxiv, conference, rss, github, funding) and/or type (theme, deal).",
    {
      source: z
        .string()
        .optional()
        .describe(
          "Filter by source: linear, hackernews, arxiv, conference, rss, github, funding"
        ),
      type: z
        .enum(["theme", "deal"])
        .optional()
        .describe("Filter by type: theme or deal"),
      days: z
        .number()
        .optional()
        .default(7)
        .describe("Look back this many days (default 7)"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Max results (default 20)"),
    },
    async ({ source, type, days, limit }) => {
      const since = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();
      const params: Record<string, string> = {
        select:
          "id,title,summary,source,type,source_url,source_date,created_at,cluster_id,linear_identifier,sector_labels",
        created_at: `gte.${since}`,
        order: "created_at.desc",
        limit: String(limit),
      };
      if (source) params.source = `eq.${source}`;
      if (type) params.type = `eq.${type}`;

      const items = await supabaseGet<unknown[]>("items", params);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(items, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "item_details",
    "Get full details for a specific item by ID, including metadata, scores, description, and cluster membership.",
    {
      item_id: z.string().uuid().describe("UUID of the item"),
    },
    async ({ item_id }) => {
      const items = await supabaseGet<unknown[]>("items", {
        select: "*",
        id: `eq.${item_id}`,
      });
      if (!items.length) {
        return {
          content: [
            { type: "text" as const, text: `Item ${item_id} not found.` },
          ],
        };
      }
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(items[0], null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "list_sources",
    "List all data sources with their item counts. Shows which pipelines are active and how much data each contributes.",
    {},
    async () => {
      const items = await paginatedGet<{ source: string }>("items", {
        select: "source",
      });

      const counts: Record<string, number> = {};
      for (const item of items) {
        counts[item.source] = (counts[item.source] ?? 0) + 1;
      }

      const sorted = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([source, count]) => ({ source, count }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { total_items: items.length, sources: sorted },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  server.tool(
    "source_distribution",
    "Detailed breakdown of items by source and type (theme vs deal). Shows the composition of the database.",
    {},
    async () => {
      const items = await paginatedGet<{ source: string; type: string }>(
        "items",
        { select: "source,type" }
      );

      const dist: Record<string, { themes: number; deals: number }> = {};
      for (const item of items) {
        if (!dist[item.source])
          dist[item.source] = { themes: 0, deals: 0 };
        if (item.type === "theme") dist[item.source].themes++;
        else if (item.type === "deal") dist[item.source].deals++;
      }

      const sorted = Object.entries(dist)
        .sort(
          ([, a], [, b]) =>
            b.themes + b.deals - (a.themes + a.deals)
        )
        .map(([source, counts]) => ({
          source,
          themes: counts.themes,
          deals: counts.deals,
          total: counts.themes + counts.deals,
        }));

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              { total_items: items.length, breakdown: sorted },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
