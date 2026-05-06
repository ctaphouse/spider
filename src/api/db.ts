import { Database } from "bun:sqlite";

let _db: Database | null = null;

export function initDb(path: string): void {
  _db = new Database(path);
  _db.run("PRAGMA journal_mode=WAL");
}

export function getDb(): Database {
  if (!_db) throw new Error("Database not initialized — call initDb() first");
  return _db;
}

export type Row = Record<string, unknown>;

export function listRows(tableName: string): Row[] {
  return getDb().query(`SELECT * FROM "${tableName}"`).all() as Row[];
}

export function getRow(tableName: string, pk: string, id: string): Row | null {
  // Use == (not ===) so "0" matches integer 0 in SQLite
  return getDb()
    .query(`SELECT * FROM "${tableName}" WHERE "${pk}" = ?`)
    .get(id) as Row | null;
}

export function insertRow(tableName: string, pk: string, data: Row): Row {
  const db = getDb();

  // Since PK columns were not declared INTEGER PRIMARY KEY, rowid != PK value.
  // Explicitly compute the next PK so we can retrieve the row by it afterward.
  const rowData = { ...data };
  if (rowData[pk] == null) {
    const { next } = db
      .query(`SELECT COALESCE(MAX("${pk}"), 0) + 1 AS next FROM "${tableName}"`)
      .get() as { next: number };
    rowData[pk] = next;
  }

  const keys = Object.keys(rowData);
  const cols  = keys.map((k) => `"${k}"`).join(", ");
  const placeholders = keys.map(() => "?").join(", ");
  const values = keys.map((k) => rowData[k] ?? null);
  db.run(`INSERT INTO "${tableName}" (${cols}) VALUES (${placeholders})`, values);
  return getRow(tableName, pk, String(rowData[pk]))!;
}

export function updateRow(
  tableName: string,
  pk: string,
  id: string,
  data: Row
): Row | null {
  const keys = Object.keys(data).filter((k) => k !== pk);
  if (keys.length === 0) return getRow(tableName, pk, id);
  const sets = keys.map((k) => `"${k}" = ?`).join(", ");
  const values = [...keys.map((k) => data[k] ?? null), id];
  getDb().run(`UPDATE "${tableName}" SET ${sets} WHERE "${pk}" = ?`, values);
  return getRow(tableName, pk, id);
}

export function deleteRow(tableName: string, pk: string, id: string): boolean {
  const result = getDb().run(
    `DELETE FROM "${tableName}" WHERE "${pk}" = ?`,
    [id]
  );
  return result.changes > 0;
}

export function getColumns(tableName: string): { name: string; type: string }[] {
  const rows = getDb()
    .query(`PRAGMA table_info("${tableName}")`)
    .all() as { name: string; type: string }[];
  return rows.map(({ name, type }) => ({ name, type }));
}
