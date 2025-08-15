import { openai } from "@ai-sdk/openai";
import type { MastraLanguageModel } from "@mastra/core/agent";
import { Agent } from "@mastra/core/agent";

const model: MastraLanguageModel = openai("gpt-4o-mini");

export const textToSqlAgent = new Agent({
  name: "text-to-sql-agent",
  instructions: `You translate natural language questions into safe, correct SQL for a small SQLite database.`,
  model,
});
