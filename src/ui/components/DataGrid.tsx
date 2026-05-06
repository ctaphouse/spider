import { MaskedField } from "./MaskedField.tsx";
import { TABLE_SINGULAR, COLUMN_DISPLAY } from "../labels.ts";
import type { TableConfig, Row } from "../types.ts";

// Recovery code columns are grouped — show just a summary in the grid
const RECOVERY_COLS = new Set([
  "RecoveryCode1","RecoveryCode2","RecoveryCode3","RecoveryCode4","RecoveryCode5",
]);

interface Props {
  config: TableConfig;
  rows: Row[];
  fkLabels: Record<string, Record<string | number, string>>; // col → { id → label }
  onEdit:   (row: Row) => void;
  onDelete: (row: Row) => void;
}

/** Human-readable header for a column: FK cols → singular table name; others → COLUMN_DISPLAY override or raw name */
function colHeader(col: string, config: TableConfig): string {
  const fk = config.fks.find((f) => f.column === col);
  if (fk) return TABLE_SINGULAR[fk.refTable] ?? fk.refTable;
  return COLUMN_DISPLAY[col] ?? col;
}

export function DataGrid({ config, rows, fkLabels, onEdit, onDelete }: Props) {
  // Hide PK and individual recovery codes (recovery codes get one combined column)
  const visibleCols = config.columns
    .filter((c) => c.name !== config.pk && !RECOVERY_COLS.has(c.name))
    .map((c) => c.name);

  const hasCodes = config.columns.some((c) => RECOVERY_COLS.has(c.name));

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            {visibleCols.map((col) => (
              <th key={col} style={styles.th}>{colHeader(col, config)}</th>
            ))}
            {hasCodes && <th style={styles.th}>Recovery Codes</th>}
            <th style={{ ...styles.th, width: 90 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={visibleCols.length + (hasCodes ? 2 : 1)} style={styles.empty}>
                No records found.
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={String(row[config.pk])} style={styles.tr}>
              {visibleCols.map((col) => (
                <td key={col} style={styles.td}>
                  {renderCell(row, col, config, fkLabels)}
                </td>
              ))}
              {hasCodes && (
                <td style={styles.td}>
                  <RecoveryCellGroup row={row} recordId={row[config.pk]} apiRoute={config.apiRoute} />
                </td>
              )}
              <td style={styles.td}>
                <button style={styles.editBtn}   onClick={() => onEdit(row)}>Edit</button>
                <button style={styles.deleteBtn} onClick={() => onDelete(row)}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderCell(
  row: Row,
  col: string,
  config: TableConfig,
  fkLabels: Record<string, Record<string | number, string>>,
) {
  const val = row[col];
  // FK → show human label
  const fk = config.fks.find((f) => f.column === col);
  if (fk && fkLabels[col]) {
    const label = fkLabels[col][String(val)];
    return <span title={String(val ?? "")}>{label ?? String(val ?? "—")}</span>;
  }
  // Sensitive (non-recovery)
  if (config.sensitiveFields.includes(col)) {
    return (
      <MaskedField
        value={val}
        fieldName={col}
        recordId={row[config.pk]}
        apiRoute={config.apiRoute}
      />
    );
  }
  if (val === null || val === undefined) return <span style={{ color: "#aaa" }}>—</span>;
  return <span>{String(val)}</span>;
}

function RecoveryCellGroup({
  row, recordId, apiRoute,
}: { row: Row; recordId: unknown; apiRoute: string }) {
  const codes = ["RecoveryCode1","RecoveryCode2","RecoveryCode3","RecoveryCode4","RecoveryCode5"];
  const hasAny = codes.some((c) => row[c] != null);
  if (!hasAny) return <span style={{ color: "#aaa" }}>—</span>;
  return (
    <span style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 2 }}>
      {codes.map((c) => row[c] != null ? (
        <MaskedField key={c} value={row[c]} fieldName={c} recordId={recordId} apiRoute={apiRoute} />
      ) : null)}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th:    { textAlign: "left", padding: "8px 10px", background: "#f1f5f9", borderBottom: "2px solid #e2e8f0", fontWeight: 600, whiteSpace: "nowrap" },
  tr:    { borderBottom: "1px solid #e2e8f0" },
  td:    { padding: "7px 10px", verticalAlign: "middle" },
  empty: { padding: 24, textAlign: "center", color: "#94a3b8" },
  editBtn:   { marginRight: 4, padding: "3px 8px", fontSize: 12, cursor: "pointer", border: "1px solid #94a3b8", borderRadius: 4, background: "#fff" },
  deleteBtn: { padding: "3px 8px", fontSize: 12, cursor: "pointer", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626" },
};
