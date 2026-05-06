import { useState, useEffect } from "react";
import { FieldInput } from "./FieldInput.tsx";
import { TABLE_SINGULAR, COLUMN_DISPLAY } from "../labels.ts";
import type { TableConfig, Row } from "../types.ts";

const RECOVERY_COLS = ["RecoveryCode1","RecoveryCode2","RecoveryCode3","RecoveryCode4","RecoveryCode5"];

interface Props {
  mode:    "create" | "edit";
  config:  TableConfig;
  initial: Row | null;
  fkOptions: Record<string, { value: string | number; label: string }[]>;
  onSave:  (data: Row) => Promise<void>;
  onClose: () => void;
}

export function RecordModal({ mode, config, initial, fkOptions, onSave, onClose }: Props) {
  const [form, setForm]           = useState<Row>({});
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({ ...initial });
    } else {
      const empty: Row = {};
      for (const col of config.columns) {
        empty[col.name] = null;
      }
      setForm(empty);
    }
  }, [initial, config]);

  function handleChange(name: string, value: unknown) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  const pk = config.pk;
  const regularCols = config.columns.filter(
    (c) => c.name !== pk && !RECOVERY_COLS.includes(c.name)
  );
  const recoveryCols = config.columns.filter((c) => RECOVERY_COLS.includes(c.name));

  function fieldLabel(colName: string): string {
    const fk = config.fks.find((f) => f.column === colName);
    if (fk) return TABLE_SINGULAR[fk.refTable] ?? fk.refTable;
    return COLUMN_DISPLAY[colName] ?? colName;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {mode === "create" ? "New Record" : "Edit Record"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {config.tableName}
            </p>
          </div>
          <button
            className="text-slate-400 hover:text-slate-600 transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-100 text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 flex flex-col gap-5">
          {/* PK: read-only in edit, hidden in create */}
          {mode === "edit" && (
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Id</label>
              <input
                className="w-full px-3 py-1.5 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-400 font-mono"
                value={String(form[pk] ?? "")}
                readOnly
                tabIndex={-1}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {regularCols.map((col) => {
              const fk = config.fks.find((f) => f.column === col.name);
              const isSensitive = config.sensitiveFields.includes(col.name);
              return (
                <div key={col.name} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {fieldLabel(col.name)}
                  </label>
                  <FieldInput
                    name={col.name}
                    value={form[col.name]}
                    sensitive={isSensitive}
                    fk={fk}
                    fkOptions={fk ? fkOptions[fk.refTable] : undefined}
                    onChange={handleChange}
                  />
                </div>
              );
            })}
          </div>

          {recoveryCols.length > 0 && (
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors text-left"
                onClick={() => setShowCodes((v) => !v)}
              >
                <span className="text-xs">{showCodes ? "▾" : "▸"}</span>
                Recovery Codes
                <span className="text-xs text-slate-400 font-normal">
                  ({recoveryCols.filter((c) => form[c.name] != null).length} set)
                </span>
              </button>
              {showCodes && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {recoveryCols.map((col) => (
                    <div key={col.name} className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {col.name}
                      </label>
                      <FieldInput
                        name={col.name}
                        value={form[col.name]}
                        sensitive={true}
                        onChange={handleChange}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
            <button
              type="button"
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
