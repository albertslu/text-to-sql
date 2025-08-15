## text to SQL with Mastra

Build a minimal text‑to‑SQL agent using Mastra and run it with the Mastra dev tool. There is no frontend; the dev tool provides the UI.

### What’s provided
- Minimal Mastra project with one agent (`text-to-sql-agent`)
- A tiny SQLite dataset seeded on first run
    - It will be seeded with data from `world-cities-geoname.csv` that display popularity and info on some cities.
- Look into `db/poke.ts` to see how to fetch data from the sqlite database

### Your task
- Implement text-to-SQL functionality using Mastra.
- SQL generated should be able to be run against the database.

### Run locally
1. Install dependencies
```bash
cd text-to-sql
npm install
```
2. Update the `.env.example` file with your OpenAI key (we will provide one)
```bash
OPENAI_API_KEY=KEY
```
3. Start the Mastra dev tool
```bash
npm run dev
```
4. In the dev UI, select `text-to-sql-agent` and interact with it.
