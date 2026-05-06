import type { Hono } from "hono";
import { TABLE_CONFIGS } from "../tableConfig.ts";
import { listRows, getRow, insertRow, updateRow, deleteRow, getColumns } from "../db.ts";
import { maskRow, maskRows } from "../middleware/maskFields.ts";

export function mountRoutes(app: Hono): void {
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

    // Delete
    app.delete(`${base}/:id`, (c) => {
      const deleted = deleteRow(config.tableName, config.pk, c.req.param("id"));
      if (!deleted) return c.json({ error: "Not found" }, 404);
      return c.json({ ok: true });
    });
  }
}
