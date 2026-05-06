import { Database } from "bun:sqlite";
import type { TableDef } from "../types.ts";

export function openDatabase(filePath: string): Database {
  return new Database(filePath, { create: true });
}

export function createTable(db: Database, table: TableDef): void {
  const cols = table.columns
    .map((c) => `  "${c.name}" ${c.type}${c.nullable ? "" : " NOT NULL"}`)
    .join(",\n");
  const sql = `CREATE TABLE IF NOT EXISTS "${table.name}" (\n${cols}\n);`;
  db.run(sql);
}

export function insertRows(
  db: Database,
  table: TableDef,
  rows: Record<string, unknown>[]
): void {
  if (rows.length === 0) return;

  const colNames = table.columns.map((c) => `"${c.name}"`).join(", ");
  const placeholders = table.columns.map(() => "?").join(", ");
  const sql = `INSERT INTO "${table.name}" (${colNames}) VALUES (${placeholders});`;
  const stmt = db.prepare(sql);

  const insert = db.transaction((batch: Record<string, unknown>[]) => {
    for (const row of batch) {
      const values = table.columns.map((c) => row[c.name] ?? null);
      stmt.run(...values);
    }
  });

  insert(rows);
}
