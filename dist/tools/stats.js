import { z } from "zod";
import { supabaseGet, supabaseRpc } from "../supabase.js";
export function registerStatsTools(server) {
    server.tool("ingestion_stats", "Get ingestion pipeline statistics: how many items were ingested per source over a given period. Useful for monitoring pipeline health.", {
        days: z
            .number()
            .optional()
            .default(30)
            .describe("Number of days to look back (default 30)"),
    }, async ({ days }) => {
        const stats = await supabaseRpc("get_ingestion_stats", {
            p_days: days,
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(stats, null, 2),
                },
            ],
        };
    });
    server.tool("investment_domains", "List the 9 investment domains that Lunar Ventures tracks. These domains are used to calculate thesis alignment scores for clusters. Returns domain names and descriptions.", {}, async () => {
        const domains = await supabaseGet("reference_embeddings", {
            select: "domain,description",
            order: "domain.asc",
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(domains, null, 2),
                },
            ],
        };
    });
}
