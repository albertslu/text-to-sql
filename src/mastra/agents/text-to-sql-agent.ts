import { openai } from "@ai-sdk/openai";
import type { MastraLanguageModel } from "@mastra/core/agent";
import { Agent } from "@mastra/core/agent";
import { z } from "zod";
import Database from "better-sqlite3";
import fs from "node:fs";

const model: MastraLanguageModel = openai("gpt-4o-mini");

// Tool for executing SQL queries
const executeSqlTool = {
  name: "execute_sql",
  description: "Execute a SQL query against the cities database and return results",
  parameters: z.object({
    query: z.string().describe("The SQL query to execute (SELECT statements only)"),
    explanation: z.string().describe("Brief explanation of what this query does")
  }),
  execute: async ({ query, explanation }: { query: string; explanation: string }) => {
    try {
      // Safety check: only allow SELECT statements
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        return {
          error: "Only SELECT queries are allowed for security reasons",
          query,
          explanation
        };
      }

      // Direct database connection with absolute path
      const absoluteDbPath = "/Users/albertlu/Documents/GitHub/text-to-sql/local.db";
      const db = new Database(absoluteDbPath);
      const stmt = db.prepare(query);
      const results = stmt.all();
      db.close();

      return {
        success: true,
        query,
        explanation,
        results,
        rowCount: results.length
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error occurred",
        query,
        explanation
      };
    }
  }
};

export const textToSqlAgent = new Agent({
  name: "text-to-sql-agent",
  instructions: `You are a helpful text-to-SQL assistant that translates natural language questions into safe, correct SQL queries for a SQLite database containing world cities data.

DATABASE SCHEMA:
The database has one table called 'cities' with the following columns:
- popularity (REAL): Popularity score of the city
- geoname_id (TEXT): Unique identifier from GeoNames database
- name_en (TEXT): City name in English
- country_code (TEXT): 2-letter country code (e.g., 'US', 'FR', 'IT')
- population (INTEGER): City population
- latitude (REAL): Latitude coordinate
- longitude (REAL): Longitude coordinate
- country (TEXT): Full country name
- region (TEXT): Geographic region (e.g., 'Western Europe', 'Southeast Asia')
- continent (TEXT): Continent name
- code2 (TEXT): 2-letter country code (duplicate of country_code)
- code (TEXT): 3-letter country code (e.g., 'USA', 'FRA', 'ITA')
- province (TEXT): Province/state name

SAMPLE DATA:
The database contains major world cities like Rome, Paris, London, Barcelona, Bangkok, Istanbul, Berlin, Prague, Florence, Madrid, etc.

INSTRUCTIONS:
1. When a user asks a question, first understand what they want to know
2. Generate an appropriate SQL SELECT query
3. Use the execute_sql tool to run the query and get results
4. Present the results in a clear, user-friendly format
5. If the query fails, explain the issue and suggest corrections

SAFETY RULES:
- Only generate SELECT statements
- Never use INSERT, UPDATE, DELETE, DROP, or other modifying statements
- Use proper SQL syntax for SQLite
- Handle potential NULL values appropriately
- Use LIMIT when appropriate to avoid overwhelming results

EXAMPLES:
- "Show me the 5 most populous cities" → SELECT name_en, country, population FROM cities ORDER BY population DESC LIMIT 5;
- "What cities are in France?" → SELECT name_en, province FROM cities WHERE country_code = 'FR';
- "Find cities with population over 5 million" → SELECT name_en, country, population FROM cities WHERE population > 5000000;`,
  model,
  tools: { execute_sql: executeSqlTool },
});
