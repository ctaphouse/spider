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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-[720px] max-h-[90vh] flex flex-col shadow-2xl shadow-slate-900/10 border border-slate-200/50">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-display tracking-tight">
              {mode === "create" ? "New Record" : "Edit Record"}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1 font-mono tracking-wide">
              {config.tableName}
            </p>
          </div>
          <button
            className="text-slate-300 hover:text-slate-500 transition-colors w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-8 py-3 bg-red-50 border-b border-red-100/60 text-red-600 text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto scroll-thin px-8 py-7 flex flex-col gap-7">
          {/* PK */}
          {mode === "edit" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-2">
                Record ID
              </label>
              <input
                className="w-full px-4 py-2.5 text-sm border border-slate-100 rounded-lg bg-slate-50 text-slate-400 font-mono tracking-wide"
                value={String(form[pk] ?? "")}
                readOnly
                tabIndex={-1}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            {regularCols.map((col) => {
              const fk = config.fks.find((f) => f.column === col.name);
              const isSensitive = config.sensitiveFields.includes(col.name);
              return (
                <div key={col.name} className="flex flex-col gap-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.06em]">
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
            <div className="border-t border-slate-100 pt-6 flex flex-col gap-4">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors text-left group"
                onClick={() => setShowCodes((v) => !v)}
              >
                <svg
                  className={[
                    "w-3.5 h-3.5 text-slate-400 group-hover:text-slate-500 transition-transform duration-200",
                    showCodes ? "rotate-90" : "",
                  ].join(" ")}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Recovery Codes
                <span className="text-xs text-slate-400 font-normal ml-1 bg-slate-100 px-2 py-0.5 rounded-full">
                  {recoveryCols.filter((c) => form[c.name] != null).length} set
                </span>
              </button>
              {showCodes && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 pl-5">
                  {recoveryCols.map((col) => (
                    <div key={col.name} className="flex flex-col gap-2">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.06em]">
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
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl">
          <button
            type="button"
            className="px-5 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-300 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            form=""
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-600/20"
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              const form = (e.currentTarget.closest('[class*="rounded-2xl"]') as HTMLElement)?.querySelector('form');
              form?.requestSubmit();
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
