import type { Hono } from "hono";
import { resolve, dirname } from "path";
import { mkdir, readdir, unlink } from "fs/promises";
import { TABLE_CONFIGS } from "../tableConfig.ts";
import { listRows, getRow, insertRow, updateRow, deleteRow, getColumns, getDb, getDbPath } from "../db.ts";
import { maskRow, maskRows } from "../middleware/maskFields.ts";

// Reverse-FK map: apiRoute → tables that reference it
// e.g. "categories" → [{ tableName: "tblAccount", column: "CategoryID", label: "Account" }]
interface RevRef { tableName: string; column: string; label: string }
const REVERSE_FK: Record<string, RevRef[]> = {};
for (const cfg of Object.values(TABLE_CONFIGS)) {
  for (const fk of cfg.fks) {
    (REVERSE_FK[fk.refTable] ??= []).push({
      tableName: cfg.tableName,
      column:    fk.column,
      label:     cfg.tableName,
    });
  }
}

const BACKUP_DIR = resolve("data/backups");
const MAX_BACKUPS = 10;

async function ensureBackupDir() {
  await mkdir(BACKUP_DIR, { recursive: true });
}

async function pruneBackups() {
  const files = (await readdir(BACKUP_DIR))
    .filter((f) => f.startsWith("spider-") && f.endsWith(".sqlite"))
    .sort();
  while (files.length > MAX_BACKUPS) {
    const old = files.shift()!;
    await unlink(resolve(BACKUP_DIR, old));
  }
}

export function mountRoutes(app: Hono): void {
  // --- Backup routes (must be before table CRUD routes) ---

  // Create a backup
  app.post("/api/backup", async (c) => {
    try {
      await ensureBackupDir();
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const filename = `spider-${ts}.sqlite`;
      const dest = resolve(BACKUP_DIR, filename).replace(/\\/g, "/");
      getDb().run(`VACUUM INTO '${dest}'`);
      await pruneBackups();
      const files = (await readdir(BACKUP_DIR))
        .filter((f) => f.startsWith("spider-") && f.endsWith(".sqlite"))
        .sort();
      return c.json({ ok: true, filename, count: files.length, backups: files });
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : "Backup failed" }, 500);
    }
  });

  // Download a snapshot
  app.get("/api/backup/download", async (c) => {
    try {
      await ensureBackupDir();
      const tmpName = `.download-${Date.now()}.sqlite`;
      const tmpPath = resolve(BACKUP_DIR, tmpName).replace(/\\/g, "/");
      getDb().run(`VACUUM INTO '${tmpPath}'`);
      const bytes = await Bun.file(tmpPath).arrayBuffer();
      await unlink(resolve(BACKUP_DIR, tmpName));
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      c.header("Content-Disposition", `attachment; filename="spider-${ts}.sqlite"`);
      c.header("Content-Type", "application/x-sqlite3");
      c.header("Content-Length", String(bytes.byteLength));
      return c.body(bytes);
    } catch (e) {
      return c.json({ error: e instanceof Error ? e.message : "Download failed" }, 500);
    }
  });

  // --- Table CRUD routes ---
  for (const config of Object.values(TABLE_CONFIGS)) {
    const base = `/api/${config.apiRoute}`;

    // Schema — columns + config metadata for the UI
    app.get(`${base}/schema`, (c) => {
      const columns = getColumns(config.tableName);
      return c.json({ ...config, columns });
    });

    // List rows
    app.get(base, (c) => {
      const doMask = c.req.query("masked") !== "false";
      const rows = listRows(config.tableName);
      return c.json({
        data: doMask ? maskRows(rows, config.sensitiveFields) : rows,
        total: rows.length,
      });
    });

    // Get single row
    app.get(`${base}/:id`, (c) => {
      const doMask = c.req.query("masked") !== "false";
      const row = getRow(config.tableName, config.pk, c.req.param("id"));
      if (!row) return c.json({ error: "Not found" }, 404);
      return c.json(doMask ? maskRow(row, config.sensitiveFields) : row);
    });

    // Create
    app.post(base, async (c) => {
      const body = await c.req.json<Record<string, unknown>>();
      const newRow = insertRow(config.tableName, config.pk, body);
      return c.json(newRow, 201);
    });

    // Update (full replace)
    app.put(`${base}/:id`, async (c) => {
      const body = await c.req.json<Record<string, unknown>>();
      const updated = updateRow(config.tableName, config.pk, c.req.param("id"), body);
      if (!updated) return c.json({ error: "Not found" }, 404);
      return c.json(updated);
    });

    // Delete — with referential integrity check
    app.delete(`${base}/:id`, (c) => {
      const id   = c.req.param("id");
      const refs = REVERSE_FK[config.apiRoute] ?? [];

      for (const ref of refs) {
        const { n } = getDb()
          .query(`SELECT COUNT(*) AS n FROM "${ref.tableName}" WHERE "${ref.column}" = ?`)
          .get(id) as { n: number };
        if (n > 0) {
          return c.json(
            { error: `Cannot delete: ${n} ${ref.label} record${n === 1 ? "" : "s"} reference this entry.` },
            409,
          );
        }
      }

      const deleted = deleteRow(config.tableName, config.pk, id);
      if (!deleted) return c.json({ error: "Not found" }, 404);
      return c.json({ ok: true });
    });
  }
}
