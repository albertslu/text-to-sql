import { Workflow, Step } from "@mastra/core/workflow";
import { z } from "zod";

// Define the workflow input schema
const DataExplorationInput = z.object({
  query: z.string().describe("Natural language query about the data"),
  analysisDepth: z.enum(["basic", "detailed", "comprehensive"]).default("detailed"),
  includeVisualizations: z.boolean().default(true)
});

// Step 1: Generate and execute SQL
const generateSqlStep: Step = {
  id: "generate-sql",
  name: "Generate SQL Query",
  agent: "text-to-sql-agent",
  input: z.object({
    query: z.string()
  }),
  output: z.object({
    sql: z.string(),
    results: z.array(z.record(z.any())),
    explanation: z.string()
  })
};

// Step 2: Analyze the results
const analyzeResultsStep: Step = {
  id: "analyze-results", 
  name: "Analyze Query Results",
  agent: "data-analyst-agent",
  input: z.object({
    data: z.array(z.record(z.any())),
    analysisType: z.string(),
    context: z.string()
  }),
  output: z.object({
    insights: z.array(z.any()),
    recommendations: z.array(z.string()),
    statisticalSummary: z.record(z.any())
  })
};

// Step 3: Generate insights and recommendations
const generateInsightsStep: Step = {
  id: "generate-insights",
  name: "Generate Insights",
  agent: "text-to-sql-agent",
  input: z.object({
    originalQuery: z.string(),
    sqlResults: z.array(z.record(z.any())),
    analysis: z.record(z.any())
  }),
  output: z.object({
    insights: z.array(z.string()),
    followUpQuestions: z.array(z.string()),
    visualizationSuggestions: z.array(z.string())
  })
};

export const dataExplorationWorkflow = new Workflow({
  name: "data-exploration-workflow",
  description: "Comprehensive data exploration workflow that combines SQL generation, execution, and analysis",
  inputSchema: DataExplorationInput,
  steps: [
    generateSqlStep,
    analyzeResultsStep,
    generateInsightsStep
  ],
  connections: [
    {
      from: "generate-sql",
      to: "analyze-results",
      mapping: {
        data: "results",
        analysisType: "'statistical'",
        context: "explanation"
      }
    },
    {
      from: "analyze-results",
      to: "generate-insights", 
      mapping: {
        originalQuery: "$input.query",
        sqlResults: "$steps.generate-sql.results",
        analysis: "insights"
      }
    }
  ]
});
