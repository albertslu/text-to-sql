import { z } from "zod";
import Database from "better-sqlite3";

// Advanced query planning and optimization tool
export const queryPlannerTool = {
  name: "plan_query",
  description: "Analyze and optimize SQL queries for better performance and insights",
  parameters: z.object({
    naturalLanguageQuery: z.string().describe("The user's natural language question"),
    suggestedSQL: z.string().describe("The initially suggested SQL query"),
    optimizationGoal: z.enum(["performance", "insights", "completeness"]).describe("What to optimize for")
  }),
  execute: async ({ naturalLanguageQuery, suggestedSQL, optimizationGoal }: { 
    naturalLanguageQuery: string; 
    suggestedSQL: string; 
    optimizationGoal: string 
  }) => {
    const analysis = {
      originalQuery: suggestedSQL,
      naturalLanguage: naturalLanguageQuery,
      optimizationGoal,
      suggestions: [] as string[],
      alternativeQueries: [] as string[],
      performanceNotes: [] as string[],
      insightOpportunities: [] as string[]
    };

    // Analyze the query structure
    const queryLower = suggestedSQL.toLowerCase();
    
    // Performance optimizations
    if (optimizationGoal === "performance") {
      if (!queryLower.includes("limit")) {
        analysis.suggestions.push("Consider adding LIMIT clause to prevent large result sets");
        analysis.alternativeQueries.push(suggestedSQL + " LIMIT 100");
      }
      
      if (queryLower.includes("order by") && !queryLower.includes("limit")) {
        analysis.performanceNotes.push("ORDER BY without LIMIT can be expensive on large datasets");
      }
      
      if (queryLower.includes("group by")) {
        analysis.performanceNotes.push("GROUP BY operations benefit from appropriate indexing");
      }
    }

    // Insight enhancement suggestions
    if (optimizationGoal === "insights") {
      if (queryLower.includes("select *")) {
        analysis.suggestions.push("Consider selecting specific columns for clearer insights");
      }
      
      if (queryLower.includes("population") && !queryLower.includes("avg") && !queryLower.includes("sum")) {
        analysis.insightOpportunities.push("Consider adding statistical functions like AVG() or SUM() for population analysis");
        analysis.alternativeQueries.push(
          suggestedSQL.replace("SELECT", "SELECT AVG(population) as avg_population,") + " GROUP BY continent"
        );
      }
      
      if (queryLower.includes("where") && queryLower.includes("country")) {
        analysis.insightOpportunities.push("Consider comparing with other countries or regions");
      }
    }

    // Completeness suggestions
    if (optimizationGoal === "completeness") {
      if (!queryLower.includes("where") && queryLower.includes("cities")) {
        analysis.suggestions.push("Consider adding filters to focus on specific criteria");
      }
      
      if (queryLower.includes("population") && !queryLower.includes("popularity")) {
        analysis.insightOpportunities.push("Consider also looking at popularity scores for context");
      }
    }

    // Generate alternative query suggestions based on the natural language
    const nlLower = naturalLanguageQuery.toLowerCase();
    
    if (nlLower.includes("compare") || nlLower.includes("vs")) {
      analysis.alternativeQueries.push(
        "SELECT continent, AVG(population) as avg_pop, COUNT(*) as city_count FROM cities GROUP BY continent ORDER BY avg_pop DESC"
      );
    }
    
    if (nlLower.includes("trend") || nlLower.includes("pattern")) {
      analysis.alternativeQueries.push(
        "SELECT region, AVG(popularity) as avg_popularity, AVG(population) as avg_population FROM cities GROUP BY region"
      );
    }
    
    if (nlLower.includes("largest") || nlLower.includes("biggest")) {
      analysis.alternativeQueries.push(
        "SELECT name_en, country, population, popularity FROM cities ORDER BY population DESC LIMIT 10"
      );
    }

    return {
      success: true,
      analysis,
      recommendations: [
        "Consider the trade-offs between query complexity and insight value",
        "Test query performance with EXPLAIN QUERY PLAN",
        "Think about what story the data is telling"
      ],
      nextSteps: [
        "Execute the optimized query",
        "Analyze the results for patterns",
        "Consider follow-up questions based on findings"
      ]
    };
  }
};
