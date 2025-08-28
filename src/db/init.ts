import fs from "node:fs";
import { database, dbPath } from ".";

// Remove existing db if present and rebuild when --fresh is passed
const isFresh = process.argv.includes("--fresh");
if (isFresh && fs.existsSync(dbPath)) {
  fs.rmSync(dbPath);
}

// Touch the database to trigger creation and CSV import logic
const db = database();
db.close();
console.log(`SQLite database initialized at ${dbPath}`);
