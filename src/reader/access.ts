import { join } from "path";
import type { TableDef, ColumnDef } from "../types.ts";
import { toSQLiteType, normaliseValue } from "../transform/types.ts";

// Shape of a single table as emitted by read-access.ps1
interface RawColumn {
  name: string;
  adoType: number;
}

interface RawTable {
  name: string;
  columns: RawColumn[];
  rows: Record<string, unknown>[];
}

const SCRIPT = join(import.meta.dir, "../../scripts/read-access.ps1");

async function runPowerShell(dbPath: string, password?: string): Promise<RawTable[]> {
  const args = [
    "-NoProfile",
    "-NonInteractive",
    "-ExecutionPolicy", "Bypass",
    "-File", SCRIPT,
    "-DbPath", dbPath,
  ];
  if (password) args.push("-Password", password);

  // Use 32-bit PowerShell — required when Office/ACE is 32-bit (typical Click-to-Run install)
  const ps = "C:\\Windows\\SysWOW64\\WindowsPowerShell\\v1.0\\powershell.exe";
  const proc = Bun.spawn([ps, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(`PowerShell exited with code ${exitCode}:\n${stderr.trim()}`);
  }

  return JSON.parse(stdout) as RawTable[];
}

export interface AccessDatabase {
  tables: RawTable[];
}

export async function openDatabase(
  dbPath: string,
  password?: string
): Promise<AccessDatabase> {
  const tables = await runPowerShell(dbPath, password);
  return { tables };
}

export function getTableNames(db: AccessDatabase): string[] {
  return db.tables.map((t) => t.name);
}

export function readTableDef(db: AccessDatabase, tableName: string): TableDef {
  const raw = db.tables.find((t) => t.name === tableName);
  if (!raw) throw new Error(`Table not found: ${tableName}`);

  const columns: ColumnDef[] = raw.columns.map((c) => ({
    name: c.name,
    type: toSQLiteType(c.adoType),
    nullable: true,
    adoType: c.adoType,
  }));

  return { name: tableName, columns };
}

export function readTableRows(
  db: AccessDatabase,
  tableName: string,
  tableDef: TableDef
): Record<string, unknown>[] {
  const raw = db.tables.find((t) => t.name === tableName);
  if (!raw) throw new Error(`Table not found: ${tableName}`);

  // Normalise values (e.g. Access Boolean -1 → SQLite 1)
  return raw.rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of tableDef.columns) {
      const adoType = (col as ColumnDef & { adoType: number }).adoType;
      out[col.name] = normaliseValue(adoType, row[col.name]);
    }
    return out;
  });
}
