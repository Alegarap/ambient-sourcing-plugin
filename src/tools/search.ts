import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { supabaseGet, supabaseRpc } from "../supabase.js";
import { generateEmbedding } from "../embeddings.js";

export function registerSearchTools(server: McpServer) {
  server.tool(
    "search_themes",
    "Search investment themes by keyword in title or summary. Returns matching themes with their source, cluster, and dates.",
    {
      query: z.string().describe("Keyword or phrase to search for"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Max results (default 20)"),
    },
    async ({ query, limit }) => {
      const items = await supabaseGet<unknown[]>("items", {
        select:
          "id,title,summary,source,type,source_url,source_date,cluster_id,linear_identifier,sector_labels",
        type: "eq.theme",
        or: `(title.ilike.*${query}*,summary.ilike.*${query}*)`,
        order: "created_at.desc",
        limit: String(limit),
      });
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
    "search_deals",
    "Search deals (companies/startups) by keyword in title or summary. Returns matching deals with their source and metadata.",
    {
      query: z.string().describe("Keyword or phrase to search for"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Max results (default 20)"),
    },
    async ({ query, limit }) => {
      const items = await supabaseGet<unknown[]>("items", {
        select:
          "id,title,summary,source,type,source_url,source_date,cluster_id,linear_identifier,sector_labels,stage,action",
        type: "eq.deal",
        or: `(title.ilike.*${query}*,summary.ilike.*${query}*)`,
        order: "created_at.desc",
        limit: String(limit),
      });
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
    "semantic_search",
    "Search items by meaning using vector embeddings. Finds themes/deals semantically similar to your query, even without keyword matches. Requires OpenRouter API key.",
    {
      query: z
        .string()
        .describe(
          "Natural language description of what you're looking for (e.g. 'autonomous drone delivery systems')"
        ),
      type: z
        .enum(["theme", "deal", "all"])
        .optional()
        .default("all")
        .describe("Filter by item type (default: all)"),
      limit: z
        .number()
        .optional()
        .default(20)
        .describe("Max results (default 20)"),
      days: z
        .number()
        .optional()
        .default(30)
        .describe("Look back this many days (default 30)"),
    },
    async ({ query, type, limit, days }) => {
      const embedding = await generateEmbedding(query);
      const since = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      );

      let results = await supabaseRpc<any[]>("search_items_by_embedding", {
        query_emb: embedding,
        similarity_threshold: 0.25,
        lim: limit * 3, // over-fetch to filter by type and date
      });

      // Client-side date filter (RPC doesn't support since param)
      results = results.filter(
        (r) => new Date(r.created_at ?? r.source_date) >= since
      );

      if (type !== "all") {
        results = results.filter(
          (r: any) => r.type === type
        );
      }
      results = results.slice(0, limit);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );

  server.tool(
    "semantic_search_clusters",
    "Search clusters by meaning using vector embeddings. Finds thematic clusters similar to your query. Great for discovering investment areas. Requires OpenRouter API key.",
    {
      query: z
        .string()
        .describe(
          "Natural language description (e.g. 'AI infrastructure for model training')"
        ),
      limit: z
        .number()
        .optional()
        .default(10)
        .describe("Max results (default 10)"),
    },
    async ({ query, limit }) => {
      const embedding = await generateEmbedding(query);

      const results = await supabaseRpc<unknown[]>(
        "search_clusters_by_embedding",
        {
          query_emb: embedding,
          lim: limit,
        }
      );

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }
  );
}
