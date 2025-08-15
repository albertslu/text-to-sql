### Take‑home: text to SQL with Mastra (1 day)

Build or improve a minimal text‑to‑SQL agent using Mastra and run it with the Mastra dev tool. There is no frontend; the dev tool provides the UI.

What’s provided
- Minimal Mastra project with one agent (`text-to-sql-agent`)
- A tiny SQLite dataset seeded on first run

### Your task
- Implement the text-to-SQL functionality.
- Keep scope to roughly to a couple of hours.

### Run locally

1. Install dependencies
```bash
cd text-to-sql
npm install
```
2. Provide an LLM key (OpenAI by default)
```bash
OPENAI_API_KEY=KEY
```
3. Start the Mastra dev tool
```bash
npm run dev
```
4. In the dev UI, select `text-to-sql-agent` and interact with it.
