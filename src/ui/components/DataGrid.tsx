import { MaskedField } from "./MaskedField.tsx";
import { TABLE_SINGULAR, COLUMN_DISPLAY } from "../labels.ts";
import type { TableConfig, Row } from "../types.ts";

const RECOVERY_COLS = new Set([
  "RecoveryCode1","RecoveryCode2","RecoveryCode3","RecoveryCode4","RecoveryCode5",
]);

interface Props {
  config: TableConfig;
  rows: Row[];
  fkLabels: Record<string, Record<string | number, string>>;
  onEdit:   (row: Row) => void;
  onDelete: (row: Row) => void;
}

function colHeader(col: string, config: TableConfig): string {
  const fk = config.fks.find((f) => f.column === col);
  if (fk) return TABLE_SINGULAR[fk.refTable] ?? fk.refTable;
  return COLUMN_DISPLAY[col] ?? col;
}

export function DataGrid({ config, rows, fkLabels, onEdit, onDelete }: Props) {
  const visibleCols = config.columns
    .filter((c) => c.name !== config.pk && !RECOVERY_COLS.has(c.name))
    .map((c) => c.name);

  const hasCodes = config.columns.some((c) => RECOVERY_COLS.has(c.name));

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {visibleCols.map((col) => (
              <th
                key={col}
                className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white border-b border-slate-200 whitespace-nowrap"
              >
                {colHeader(col, config)}
              </th>
            ))}
            {hasCodes && (
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white border-b border-slate-200">
                Recovery Codes
              </th>
            )}
            <th className="px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-white border-b border-slate-200 w-24 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={visibleCols.length + (hasCodes ? 2 : 1)}
                className="px-4 py-12 text-center text-slate-400 text-sm"
              >
                No records found.
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={String(row[config.pk])}
              className={[
                "border-b border-slate-100 hover:bg-indigo-50/30 transition-colors group",
                i % 2 === 0 ? "bg-white" : "bg-slate-50/50",
              ].join(" ")}
            >
              {visibleCols.map((col) => (
                <td key={col} className="px-4 py-2.5 text-slate-700 align-middle">
                  {renderCell(row, col, config, fkLabels)}
                </td>
              ))}
              {hasCodes && (
                <td className="px-4 py-2.5 align-middle">
                  <RecoveryCellGroup row={row} recordId={row[config.pk]} apiRoute={config.apiRoute} />
                </td>
              )}
              <td className="px-4 py-2.5 align-middle text-right">
                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                    onClick={() => onEdit(row)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2.5 py-1 text-xs border border-red-200 rounded text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors"
                    onClick={() => onDelete(row)}
                  >
                    Del
                  </button>
                </div>
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
  const fk = config.fks.find((f) => f.column === col);
  if (fk && fkLabels[col]) {
    const label = fkLabels[col][String(val)];
    return <span title={String(val ?? "")} className="text-slate-700">{label ?? String(val ?? "—")}</span>;
  }
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
  if (val === null || val === undefined) return <span className="text-slate-300">—</span>;
  return <span>{String(val)}</span>;
}

function RecoveryCellGroup({
  row, recordId, apiRoute,
}: { row: Row; recordId: unknown; apiRoute: string }) {
  const codes = ["RecoveryCode1","RecoveryCode2","RecoveryCode3","RecoveryCode4","RecoveryCode5"];
  const hasAny = codes.some((c) => row[c] != null);
  if (!hasAny) return <span className="text-slate-300">—</span>;
  return (
    <span className="flex flex-col gap-1">
      {codes.map((c) => row[c] != null ? (
        <MaskedField key={c} value={row[c]} fieldName={c} recordId={recordId} apiRoute={apiRoute} />
      ) : null)}
    </span>
  );
}
