import { resolve } from "path";
import {
  openDatabase as openAccess,
  getTableNames,
  readTableDef,
  readTableRows,
} from "./reader/access.ts";
import {
  openDatabase as openSQLite,
  createTable,
  insertRows,
} from "./writer/sqlite.ts";
import type { ConvertOptions } from "./types.ts";

async function convert(opts: ConvertOptions): Promise<void> {
  const { inputPath, outputPath, password, tables, verbose } = opts;
  const log = (msg: string) => { if (verbose) console.log(msg); };

  console.log(`Reading Access database: ${inputPath}`);
  const accessDb = await openAccess(inputPath, password);

  const tableNames = tables ?? getTableNames(accessDb);
  console.log(`Tables to convert: ${tableNames.join(", ")}`);

  const sqliteDb = openSQLite(outputPath);

  for (const tableName of tableNames) {
    log(`\nProcessing: ${tableName}`);
    const tableDef = readTableDef(accessDb, tableName);
    createTable(sqliteDb, tableDef);

    const rows = readTableRows(accessDb, tableName, tableDef);
    insertRows(sqliteDb, tableDef, rows);
    log(`  ${rows.length} rows inserted`);
  }

  sqliteDb.close();
  console.log(`\nDone. SQLite written to: ${outputPath}`);
}

// --- CLI ---
const args = Bun.argv.slice(2);
const inputFile  = args[0];
const outputFile = args[1];

if (!inputFile || !outputFile) {
  console.error("Usage: bun start <input.accdb> <output.sqlite> [--verbose] [--password <pw>]");
  process.exit(1);
}

const pwIdx    = args.indexOf("--password");
const password = pwIdx !== -1 ? args[pwIdx + 1] : undefined;

await convert({
  inputPath:  resolve(inputFile),
  outputPath: resolve(outputFile),
  password,
  verbose: args.includes("--verbose"),
});
