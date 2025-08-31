import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { textToSqlAgent } from "./agents/text-to-sql-agent";
import { dataAnalystAgent } from "./agents/data-analyst-agent";

// Configure storage for memory
const storage = new LibSQLStore({
  url: "file:./mastra.db", // Path to database file for memory storage
});

export const mastra: Mastra = new Mastra({
  agents: {
    "text-to-sql-agent": textToSqlAgent,
    "data-analyst-agent": dataAnalystAgent,
  },
  storage,
  telemetry: {
    enabled: false, // Disable telemetry for take-home
  },
});
