import { database } from ".";

const poke = () => {
  const db = database();
  const stmt = db.prepare("SELECT * FROM cities LIMIT 10");
  const rows = stmt.all();
  console.table(rows);
  db.close();
}

poke();
