import type { Row } from "../db.ts";

export const MASK_TOKEN = "●●●●●";

export function maskRow(row: Row, sensitiveFields: string[]): Row {
  if (sensitiveFields.length === 0) return row;
  const masked = { ...row };
  for (const field of sensitiveFields) {
    if (masked[field] != null) {
      masked[field] = MASK_TOKEN;
    }
  }
  return masked;
}

export function maskRows(rows: Row[], sensitiveFields: string[]): Row[] {
  return rows.map((r) => maskRow(r, sensitiveFields));
}
