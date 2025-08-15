import { ensureDb } from ".";

function poke(): void {
  const db = ensureDb();
  const stmt = db.prepare("SELECT * FROM cities LIMIT 10");
  const rows = stmt.all();
  console.table(rows);
  db.close();
}

poke();
