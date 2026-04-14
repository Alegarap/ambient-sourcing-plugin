import { z } from "zod";
import { supabaseGet, supabaseRpc } from "../supabase.js";
export function registerClusterTools(server) {
    server.tool("get_hot_clusters", "Get the hottest investment theme clusters, ranked by a composite score (source convergence, recency, thesis alignment, size, novelty). Scores range 0-1; 0.5+ is considered hot.", {
        min_score: z
            .number()
            .optional()
            .default(0.5)
            .describe("Minimum hotness score (default 0.5, max 1.0)"),
        limit: z
            .number()
            .optional()
            .default(10)
            .describe("Max results (default 10)"),
    }, async ({ min_score, limit }) => {
        const clusters = await supabaseRpc("get_hot_clusters", {
            min_score,
            lim: limit,
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(clusters, null, 2),
                },
            ],
        };
    });
    server.tool("get_cluster_items", "Get all items (themes and deals) belonging to a specific cluster. Use after finding a cluster via get_hot_clusters or semantic_search_clusters.", {
        cluster_id: z.string().uuid().describe("UUID of the cluster"),
    }, async ({ cluster_id }) => {
        const items = await supabaseGet("items", {
            select: "id,title,summary,source,type,source_url,source_date,linear_identifier,sector_labels,stage,action",
            cluster_id: `eq.${cluster_id}`,
            order: "source_date.desc",
        });
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(items, null, 2),
                },
            ],
        };
    });
    server.tool("cluster_overview", "Get a high-level overview of the cluster landscape: total count, hotness distribution, source diversity stats, and the top 5 hottest clusters.", {}, async () => {
        const [allClusters, hotClusters] = await Promise.all([
            supabaseGet("clusters", {
                select: "id,label,item_count,source_diversity,hotness_score",
                item_count: "gt.0",
                order: "hotness_score.desc",
                limit: "1000",
            }),
            supabaseRpc("get_hot_clusters", {
                min_score: 0.5,
                lim: 5,
            }),
        ]);
        const total = allClusters.length;
        const scores = allClusters.map((c) => c.hotness_score ?? 0);
        const avgScore = total > 0 ? scores.reduce((a, b) => a + b, 0) / total : 0;
        const hotCount = scores.filter((s) => s >= 0.5).length;
        const diversityDist = {};
        for (const c of allClusters) {
            const d = c.source_diversity ?? 1;
            diversityDist[d] = (diversityDist[d] ?? 0) + 1;
        }
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        total_clusters: total,
                        hot_clusters: hotCount,
                        average_hotness: Math.round(avgScore * 1000) / 1000,
                        source_diversity_distribution: diversityDist,
                        top_5_hottest: hotClusters,
                    }, null, 2),
                },
            ],
        };
    });
}
