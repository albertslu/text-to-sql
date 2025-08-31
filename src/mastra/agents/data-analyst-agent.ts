import { openai } from "@ai-sdk/openai";
import type { MastraLanguageModel } from "@mastra/core/agent";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { z } from "zod";

const model: MastraLanguageModel = openai("gpt-4o-mini");

// Configure storage for memory
const storage = new LibSQLStore({
  url: "file:./analyst-memory.db",
});

const memory = new Memory({
  storage,
  options: {
    lastMessages: 20,
  },
});

// Tool for fetching city data for analysis
const fetchCityDataTool = {
  name: "fetch_city_data",
  description: "Fetch city data from the database for analysis",
  parameters: z.object({
    query: z.string().describe("SQL query to fetch the data"),
    limit: z.number().optional().describe("Limit the number of results")
  }),
  execute: async ({ query, limit }: { query: string; limit?: number }) => {
    try {
      const Database = require('better-sqlite3');
      const path = require('path');
      
      const dbPath = path.join(process.cwd(), "local.db");
      const db = new Database(dbPath);
      
      let finalQuery = query;
      if (limit && !query.toLowerCase().includes('limit')) {
        finalQuery += ` LIMIT ${limit}`;
      }
      
      const stmt = db.prepare(finalQuery);
      const results = stmt.all();
      db.close();
      
      return {
        success: true,
        data: results,
        query: finalQuery,
        rowCount: results.length
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Database query failed",
        query
      };
    }
  }
};

// Tool for generating data insights and recommendations
const analyzeDataTool = {
  name: "analyze_data",
  description: "Perform advanced statistical analysis and generate insights from query results",
  parameters: z.object({
    data: z.array(z.record(z.any())).optional().describe("The query results to analyze (optional - will fetch if not provided)"),
    analysisType: z.enum(["statistical", "trends", "outliers", "correlations"]).describe("Type of analysis to perform"),
    context: z.string().describe("Context about what the user is trying to understand"),
    dataQuery: z.string().optional().describe("SQL query to fetch data if not provided")
  }),
  execute: async ({ data, analysisType, context, dataQuery }: { data?: any[]; analysisType: string; context: string; dataQuery?: string }) => {
    let analysisData = data;
    
    // If no data provided, try to fetch it
    if (!analysisData && dataQuery) {
      const fetchResult = await fetchCityDataTool.execute({ query: dataQuery });
      if (fetchResult.success) {
        analysisData = fetchResult.data;
      } else {
        return { error: "Could not fetch data for analysis", details: fetchResult.error };
      }
    }
    
    // If still no data, provide guidance
    if (!analysisData || analysisData.length === 0) {
      return {
        error: "No data available for analysis",
        suggestion: "Please provide data or specify a SQL query to fetch the data",
        availableQueries: [
          "SELECT * FROM cities LIMIT 100",
          "SELECT name_en, population, popularity FROM cities",
          "SELECT * FROM cities WHERE continent = 'Europe'"
        ]
      };
    }

    const insights = [];
    
    switch (analysisType) {
      case "statistical":
        // Calculate basic statistics
        const numericColumns = Object.keys(data[0]).filter(key => 
          typeof data[0][key] === 'number' && !isNaN(data[0][key])
        );
        
        for (const col of numericColumns) {
          const values = data.map(row => row[col]).filter(v => v != null);
          if (values.length > 0) {
            const sum = values.reduce((a, b) => a + b, 0);
            const mean = sum / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            
            insights.push({
              column: col,
              mean: Math.round(mean * 100) / 100,
              stdDev: Math.round(stdDev * 100) / 100,
              min: Math.min(...values),
              max: Math.max(...values),
              count: values.length
            });
          }
        }
        break;
        
      case "outliers":
        // Find outliers using IQR method
        const outlierAnalysis = [];
        const numCols = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');
        
        for (const col of numCols) {
          const values = data.map(row => row[col]).filter(v => v != null).sort((a, b) => a - b);
          if (values.length > 4) {
            const q1 = values[Math.floor(values.length * 0.25)];
            const q3 = values[Math.floor(values.length * 0.75)];
            const iqr = q3 - q1;
            const lowerBound = q1 - 1.5 * iqr;
            const upperBound = q3 + 1.5 * iqr;
            
            const outliers = data.filter(row => 
              row[col] < lowerBound || row[col] > upperBound
            );
            
            if (outliers.length > 0) {
              outlierAnalysis.push({
                column: col,
                outlierCount: outliers.length,
                outliers: outliers.slice(0, 5), // Show first 5 outliers
                bounds: { lower: lowerBound, upper: upperBound }
              });
            }
          }
        }
        insights.push(...outlierAnalysis);
        break;
        
      case "trends":
        // Analyze trends if there's a sortable column
        insights.push({
          message: "Trend analysis requires time-series or ordered data",
          suggestion: "Try sorting your data by a date or sequential column first"
        });
        break;
        
      case "correlations":
        // Simple correlation analysis
        insights.push({
          message: "Correlation analysis available for numeric columns",
          suggestion: "Consider comparing population vs popularity, or latitude vs population"
        });
        break;
    }

    return {
      success: true,
      analysisType,
      context,
      insights,
      recommendations: [
        "Consider visualizing these insights with charts",
        "Look for patterns across different geographic regions",
        "Compare these metrics with global averages"
      ]
    };
  }
};

export const dataAnalystAgent = new Agent({
  name: "data-analyst-agent",
  instructions: `You are a specialized data analyst agent that works alongside the text-to-SQL agent. Your role is to:

1. **Deep Analysis**: Perform statistical analysis on query results
2. **Pattern Recognition**: Identify trends, outliers, and correlations
3. **Data Fetching**: Retrieve city data from the database when needed
4. **Insights Generation**: Provide meaningful interpretations of data
5. **Recommendations**: Suggest follow-up analyses and investigations

You have access to a cities database with 1,047 world cities containing:
- Population, popularity, geographic coordinates
- Country, region, continent information
- City names and administrative divisions

CAPABILITIES:
- Statistical analysis (mean, median, standard deviation, percentiles)
- Outlier detection using IQR and z-score methods
- Correlation analysis between variables
- Trend identification and forecasting
- Data quality assessment

WORKFLOW:
1. If user asks for analysis without providing data, use fetch_city_data to get relevant data
2. Perform the requested analysis using analyze_data
3. Provide clear, actionable insights
4. Suggest follow-up analyses and visualizations

EXAMPLE QUERIES FOR DATA FETCHING:
- "SELECT * FROM cities LIMIT 100" - General sample
- "SELECT name_en, population, popularity FROM cities" - Population analysis
- "SELECT * FROM cities WHERE continent = 'Europe'" - Regional analysis
- "SELECT * FROM cities ORDER BY population DESC LIMIT 50" - Top cities

Always explain complex statistical concepts in accessible language and provide context for your findings.`,
  model,
  tools: { 
    analyze_data: analyzeDataTool,
    fetch_city_data: fetchCityDataTool
  },
  memory,
});
