# Spider

MS Access (.accdb/.mdb) to SQLite converter with a CRUD web UI for managing the resulting database.

## Stack

- **Runtime:** Bun
- **Backend:** Hono (serves API + static files)
- **Frontend:** React 19, Tailwind CSS v4 (built with `bun build`, no Vite/Webpack)
- **Database:** SQLite via `bun:sqlite`
- **Access reader:** 32-bit PowerShell script (`scripts/read-access.ps1`) using ADODB/ACE drivers

## Project structure

```
src/
  index.ts          # CLI: convert .accdb → .sqlite
  server.ts         # Web server entry point (builds UI, mounts API + static)
  types.ts          # Shared types (TableDef, ColumnDef, ConvertOptions)
  reader/access.ts  # Reads Access DB via PowerShell subprocess
  writer/sqlite.ts  # Writes SQLite tables from TableDef + rows
  transform/types.ts# ADODB type → SQLite affinity mapping
  api/
    db.ts           # SQLite singleton, generic CRUD helpers
    tableConfig.ts  # Per-table config: PK, FKs, sensitive fields, labels
    routes/index.ts # Hono route registration (CRUD + backup + shutdown)
    middleware/      # Field masking for sensitive data
  ui/
    App.tsx         # Root component, hash-based table navigation
    labels.ts       # Display name overrides for nav and columns
    components/     # Sidebar, TablePage, DataGrid, RecordModal, FieldInput, MaskedField
scripts/
  read-access.ps1   # 32-bit PS script that dumps Access tables as JSON
data/
  input/            # Source .accdb/.mdb files (gitignored)
  output/           # Generated .sqlite files (gitignored)
  backups/          # Server-created backups (gitignored)
```

## Commands

```sh
# Convert Access → SQLite
bun start <input.accdb> <output.sqlite> [--verbose] [--password <pw>]

# Run the web UI server (default port 3000, auto-builds UI)
bun run server              # or: bun run src/server.ts [path/to/db.sqlite]
bun run server:dev          # with --watch for hot reload

# Build UI separately
bun run build               # CSS + JS + HTML → dist/

# Tests
bun test
```

## Key conventions

- **Database path:** defaults to `data/output/spider.sqlite`; override via CLI arg or `PORT` env var for the port
- **Table config is central:** `src/api/tableConfig.ts` defines every table's PK, FK relationships, sensitive fields, and label columns. Add new tables here first.
- **All PKs are named `Id`** (integer, not auto-increment — app computes `MAX(Id)+1`)
- **Referential integrity** is enforced in application code (delete checks reverse FK map), not via SQLite foreign key constraints
- **Sensitive fields** (passwords, recovery codes) are masked in API responses by default; pass `?masked=false` to get raw values
- **No ORM** — raw SQL via `bun:sqlite` with parameterized queries
- **Frontend builds are embedded** — `server.ts` runs Tailwind CLI and `Bun.build()` on startup if `dist/` is missing or in dev mode
