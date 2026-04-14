import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerSearchTools } from "./tools/search.js";
import { registerClusterTools } from "./tools/clusters.js";
import { registerBrowseTools } from "./tools/browse.js";
import { registerStatsTools } from "./tools/stats.js";

const server = new McpServer({
  name: "ambient-sourcing",
  version: "1.0.0",
});

// Validate required env vars
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run setup.sh or configure 1Password credentials. See README.md."
  );
  process.exit(1);
}

registerSearchTools(server);
registerClusterTools(server);
registerBrowseTools(server);
registerStatsTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
