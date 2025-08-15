import fs from "node:fs";

import { dbPath, ensureDb } from ".";

// Remove existing db if present and rebuild when --fresh is passed
const isFresh = process.argv.includes("--fresh");
if (isFresh && fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
}

// Touch the database to trigger creation and CSV import logic
const db = ensureDb();
db.close();
console.log(`SQLite database initialized at ${dbPath}`);
