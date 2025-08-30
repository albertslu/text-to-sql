import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { parse } from "csv-parse/sync";

export const dbPath = path.join(process.cwd(), "local.db");

const sanitizeColumnName = (name: string): string => {
  let sanitized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  sanitized = sanitized.replace(/^_+|_+$/g, "");
  if (/^[0-9]/.test(sanitized)) sanitized = `_${sanitized}`;
  if (sanitized === "") sanitized = "col";
  return sanitized;
}

const initDB = (db: Database.Database) => {
  const candidates = [
    path.join(process.cwd(), "world-cities-geoname.csv"),
    path.join(process.cwd(), "World Cities Geoname.csv"),
  ];
  const csvPath = candidates.find((p) => fs.existsSync(p));
  if (!csvPath) throw new Error("No CSV file found");

  const fileContent = fs.readFileSync(csvPath, "utf8");
  const records = parse(fileContent, {
    bom: true,
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, unknown>>;

  if (records.length === 0) throw new Error("No records found in CSV file");

  const originalHeaders = Object.keys(records[0]);
  const usedNames = new Set<string>();
  const baseSanitizedNames: string[] = [];
  const columnNames = originalHeaders.map((h) => {
    const base = sanitizeColumnName(h);
    baseSanitizedNames.push(base);
    let candidate = base;
    let suffix = 1;
    while (usedNames.has(candidate)) {
      suffix += 1;
      candidate = `${candidate}_${suffix}`;
    }
    usedNames.add(candidate);
    return candidate;
  });

  const realNumeric = new Set(["latitude", "longitude", "popularity"]);
  const integerNumeric = new Set(["population"]);
  const createSql = `CREATE TABLE cities (${columnNames
    .map((c, idx) => {
      const base = baseSanitizedNames[idx];
      if (realNumeric.has(base)) return `${c} REAL`;
      if (integerNumeric.has(base)) return `${c} INTEGER`;
      return `${c} TEXT`;
    })
    .join(", ")})`;
  db.exec(createSql);

  const placeholders = originalHeaders.map(() => "?").join(", ");
  const insertSql = `INSERT INTO cities (${columnNames.join(", ")}) VALUES (${placeholders})`;
  const insertStmt = db.prepare(insertSql);

  const insertMany = db.transaction((rows: Array<Record<string, unknown>>) => {
    for (const row of rows) {
      const values = originalHeaders.map((h, idx) => {
        const raw = row[h];
        if (raw === undefined || raw === null || raw === "") return null;
        const base = baseSanitizedNames[idx];
        if (realNumeric.has(base)) {
          const num = typeof raw === "number" ? raw : parseFloat(String(raw));
          return Number.isFinite(num) ? num : null;
        }
        if (integerNumeric.has(base)) {
          const num = typeof raw === "number" ? raw : parseInt(String(raw), 10);
          return Number.isFinite(num) ? num : null;
        }
        return String(raw);
      });
      insertStmt.run(values);
    }
  });

  insertMany(records);
};

export const database = (): Database.Database => {
  const exists = fs.existsSync(dbPath);
  const db = new Database(dbPath);

  // Initialize the database if it doesn't exist OR if it's empty
  if (!exists) {
    initDB(db);
  } else {
    // Check if the database has the cities table and data
    try {
      const result = db.prepare("SELECT COUNT(*) as count FROM cities").get() as { count: number };
      if (result.count === 0) {
        initDB(db);
      }
    } catch (error) {
      // Table doesn't exist, initialize it
      initDB(db);
    }
  }

  return db;
};
