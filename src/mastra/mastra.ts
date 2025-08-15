import { Mastra } from "@mastra/core/mastra";
import { textToSqlAgent } from "./agents/text-to-sql-agent";

export const mastra: Mastra = new Mastra({
  agents: {
    "text-to-sql-agent": textToSqlAgent,
  },
});
