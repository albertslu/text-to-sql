import { openai } from "@ai-sdk/openai";
import type { MastraLanguageModel } from "@mastra/core/agent";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";
import Database from "better-sqlite3";
import fs from "node:fs";

const model: MastraLanguageModel = openai("gpt-4o-mini");

// Configure storage for memory
const storage = new LibSQLStore({
  url: "file:./memory.db", // Separate database for agent memory
});

// Configure memory with proper storage
const memory = new Memory({
  storage,
  options: {
    lastMessages: 15, // Keep track of recent conversation
  },
});

// Tool for enriching city data with external information
const enrichCityDataTool = {
  name: "enrich_city_data",
  description: "Enrich city data with additional information like weather, timezone, or economic data",
  parameters: z.object({
    cityName: z.string().describe("Name of the city to enrich"),
    countryCode: z.string().describe("Country code of the city"),
    enrichmentType: z.enum(["timezone", "weather", "demographics", "economics"]).describe("Type of enrichment to add")
  }),
  execute: async ({ cityName, countryCode, enrichmentType }: { cityName: string; countryCode: string; enrichmentType: string }) => {
    // Simulate external API calls with mock data
    const enrichmentData: Record<string, any> = {
      timezone: {
        timezone: "UTC+1",
        currentTime: new Date().toISOString(),
        isDaylight: true
      },
      weather: {
        temperature: Math.floor(Math.random() * 30) + 5,
        condition: ["Sunny", "Cloudy", "Rainy", "Snowy"][Math.floor(Math.random() * 4)],
        humidity: Math.floor(Math.random() * 100)
      },
      demographics: {
        medianAge: Math.floor(Math.random() * 20) + 30,
        literacyRate: Math.floor(Math.random() * 20) + 80,
        urbanizationRate: Math.floor(Math.random() * 30) + 70
      },
      economics: {
        gdpPerCapita: Math.floor(Math.random() * 50000) + 10000,
        unemploymentRate: Math.floor(Math.random() * 15) + 2,
        costOfLivingIndex: Math.floor(Math.random() * 100) + 50
      }
    };

    return {
      success: true,
      city: cityName,
      country: countryCode,
      enrichmentType,
      data: enrichmentData[enrichmentType],
      source: "Mock API (in production, would use real APIs like OpenWeather, World Bank, etc.)",
      timestamp: new Date().toISOString()
    };
  }
};

// Tool for explaining SQL queries in plain English
const explainQueryTool = {
  name: "explain_query",
  description: "Explain what a SQL query does in plain English with educational details",
  parameters: z.object({
    query: z.string().describe("The SQL query to explain"),
    level: z.enum(["beginner", "intermediate", "advanced"]).optional().describe("Explanation complexity level")
  }),
  execute: async ({ query, level = "intermediate" }: { query: string; level?: string }) => {
    const queryLower = query.toLowerCase().trim();
    
    const explanation = {
      summary: "",
      breakdown: [] as string[],
      concepts: [] as string[],
      performance: [] as string[],
      alternatives: [] as string[]
    };

    // Analyze different parts of the query
    if (queryLower.includes("select")) {
      if (queryLower.includes("select *")) {
        explanation.breakdown.push("📋 **SELECT ***: Retrieves all columns from the table");
        explanation.concepts.push("Using SELECT * can be inefficient for large tables");
      } else {
        explanation.breakdown.push("📋 **SELECT clause**: Specifies which columns to retrieve");
      }
    }

    if (queryLower.includes("from cities")) {
      explanation.breakdown.push("🏙️ **FROM cities**: Data source is the cities table (1,047 world cities)");
    }

    if (queryLower.includes("where")) {
      explanation.breakdown.push("🔍 **WHERE clause**: Filters data based on specified conditions");
      explanation.concepts.push("WHERE clauses help narrow down results and improve performance");
    }

    if (queryLower.includes("order by")) {
      if (queryLower.includes("desc")) {
        explanation.breakdown.push("📊 **ORDER BY ... DESC**: Sorts results in descending order (highest to lowest)");
      } else {
        explanation.breakdown.push("📊 **ORDER BY**: Sorts results in ascending order (lowest to highest)");
      }
    }

    if (queryLower.includes("limit")) {
      const limitMatch = queryLower.match(/limit\s+(\d+)/);
      const limitNum = limitMatch ? limitMatch[1] : "N";
      explanation.breakdown.push(`🔢 **LIMIT ${limitNum}**: Restricts results to only ${limitNum} rows`);
      explanation.performance.push("LIMIT is great for performance - only processes the needed rows");
    }

    if (queryLower.includes("group by")) {
      explanation.breakdown.push("📊 **GROUP BY**: Groups rows with similar values for aggregation");
      explanation.concepts.push("GROUP BY is essential for statistical analysis and summaries");
    }

    if (queryLower.includes("avg(") || queryLower.includes("count(") || queryLower.includes("sum(")) {
      explanation.breakdown.push("🧮 **Aggregate functions**: Performs calculations across multiple rows");
      explanation.concepts.push("Aggregates like AVG, COUNT, SUM provide statistical insights");
    }

    if (queryLower.includes("latitude") || queryLower.includes("longitude")) {
      explanation.breakdown.push("🌍 **Geographic data**: Uses coordinate data for location-based analysis");
      explanation.concepts.push("Latitude/longitude enable geographic filtering and analysis");
    }

    // Generate summary
    if (queryLower.includes("select") && queryLower.includes("order by") && queryLower.includes("limit")) {
      explanation.summary = "This query retrieves specific data, sorts it, and limits the results - a common pattern for 'top N' analysis.";
    } else if (queryLower.includes("group by")) {
      explanation.summary = "This is an analytical query that groups data for statistical analysis.";
    } else if (queryLower.includes("where")) {
      explanation.summary = "This query filters the data to find specific records matching certain criteria.";
    } else {
      explanation.summary = "This query retrieves data from the cities database.";
    }

    // Add alternatives based on query type
    if (queryLower.includes("order by population desc")) {
      explanation.alternatives.push("Could add WHERE continent = 'Asia' to focus on specific regions");
      explanation.alternatives.push("Could use LIMIT 10 instead of 5 for more comprehensive results");
    }

    return {
      success: true,
      query,
      explanation,
      educationalTip: level === "beginner" ? 
        "💡 SQL queries read like instructions: SELECT what you want, FROM where it's stored, WHERE conditions apply, ORDER BY how to sort it." :
        "💡 Well-structured queries use indexes, appropriate LIMITS, and specific column selection for optimal performance."
    };
  }
};

// Tool for generating data insights and query suggestions
const generateInsightsTool = {
  name: "generate_insights",
  description: "Generate interesting insights about the cities database and suggest follow-up queries",
  parameters: z.object({
    context: z.string().describe("Context about what the user has been exploring"),
    lastQuery: z.string().optional().describe("The last SQL query that was executed"),
    resultCount: z.number().optional().describe("Number of results from the last query")
  }),
  execute: async ({ context, lastQuery, resultCount }: { context: string; lastQuery?: string; resultCount?: number }) => {
    // Generate insights based on the database structure and context
    const insights = [
      "💡 **Geographic Distribution**: Our database covers cities across all continents, with varying representation.",
      "📊 **Population Range**: Cities range from small towns to megacities with 14M+ inhabitants.",
      "🌍 **Regional Insights**: European cities tend to have higher popularity scores relative to population.",
      "🏙️ **Megacities**: Only a few cities exceed 10 million population - these are worth exploring!",
      "📍 **Coordinate Data**: Latitude/longitude data enables geographic analysis and distance calculations."
    ];

    const suggestions = [
      "What's the most populous city in each continent?",
      "Show me cities in the Southern Hemisphere",
      "Which countries have the most cities in our database?",
      "Find cities with similar population to [specific city]",
      "What's the average population by region?",
      "Show me the northernmost and southernmost cities",
      "Which cities have the highest popularity scores?",
      "Compare European vs Asian city populations"
    ];

    return {
      insights: insights.slice(0, 3), // Return 3 random insights
      suggestions: suggestions.slice(0, 4), // Return 4 suggestions
      context: `Based on: ${context}`,
      tip: "💡 Try asking about geographic patterns, population comparisons, or regional analysis!"
    };
  }
};

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
  instructions: `You are an advanced text-to-SQL assistant with memory and analytical capabilities. You help users explore world cities data through natural language queries, remember conversation context, and provide intelligent insights.

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

ENHANCED CAPABILITIES:
1. **Memory & Context**: Remember previous queries and build on conversation history
2. **Advanced Analytics**: Support aggregations (COUNT, AVG, SUM, MIN, MAX), grouping, and statistical analysis
3. **Geographic Intelligence**: Handle coordinate-based queries, distance calculations, hemisphere analysis
4. **Smart Insights**: Provide interesting observations about the data
5. **Query Suggestions**: Offer related queries based on current results
6. **Educational Explanations**: Explain SQL queries in plain English with learning tips

CONVERSATION FLOW:
1. Understand the user's question and any context from previous interactions
2. Generate appropriate SQL (simple queries, aggregations, or complex analysis)
3. Execute the query and analyze results
4. Present findings in a clear, engaging format
5. Suggest related queries or interesting follow-ups
6. Remember key details for future interactions

ADVANCED QUERY EXAMPLES:
- Basic: "Show me the 5 most populous cities"
- Aggregation: "What's the average population by continent?"
- Geographic: "Find cities in the Southern Hemisphere" (latitude < 0)
- Complex: "Which European countries have the most cities in our database?"
- Analytical: "Compare population density between Asian and European cities"
- Statistical: "Show me cities with population within 2 standard deviations of the mean"
- Ranking: "Rank continents by total population of their cities"
- Correlation: "Is there a correlation between popularity and population?"
- Geospatial: "Find cities within 1000km of Paris" (using coordinate calculations)

SAFETY & QUALITY:
- Only SELECT statements allowed
- Use LIMIT appropriately (default 10-20 for large results)
- Handle NULL values gracefully
- Provide context and explanations with results
- Suggest interesting follow-up questions`,
  model,
  tools: { 
    execute_sql: executeSqlTool,
    generate_insights: generateInsightsTool,
    enrich_city_data: enrichCityDataTool,
    explain_query: explainQueryTool
  },
  memory,
});
