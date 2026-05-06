import { useState, useEffect } from "react";
import { FieldInput } from "./FieldInput.tsx";
import { TABLE_SINGULAR, COLUMN_DISPLAY } from "../labels.ts";
import type { TableConfig, Row } from "../types.ts";

const RECOVERY_COLS = ["RecoveryCode1","RecoveryCode2","RecoveryCode3","RecoveryCode4","RecoveryCode5"];

interface Props {
  mode:    "create" | "edit";
  config:  TableConfig;
  initial: Row | null;   // null for create
  fkOptions: Record<string, { value: string | number; label: string }[]>;
  onSave:  (data: Row) => Promise<void>;
  onClose: () => void;
}

export function RecordModal({ mode, config, initial, fkOptions, onSave, onClose }: Props) {
  const [form, setForm]       = useState<Row>({});
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({ ...initial });
    } else {
      // Default empty form
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

  /** Human-readable label for a form field */
  function fieldLabel(colName: string): string {
    const fk = config.fks.find((f) => f.column === colName);
    if (fk) return TABLE_SINGULAR[fk.refTable] ?? fk.refTable;
    return COLUMN_DISPLAY[colName] ?? colName;
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {mode === "create" ? "New Record" : "Edit Record"}
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* PK: read-only in edit mode, hidden in create */}
          {mode === "edit" && (
            <div style={{ ...styles.field, gridColumn: "span 2" }}>
              <label style={styles.label}>Id</label>
              <input
                style={{ ...styles.readOnly }}
                value={String(form[pk] ?? "")}
                readOnly
                tabIndex={-1}
              />
            </div>
          )}

          <div style={styles.grid}>
            {regularCols.map((col) => {
              const fk  = config.fks.find((f) => f.column === col.name);
              const isSensitive = config.sensitiveFields.includes(col.name);
              return (
                <div key={col.name} style={styles.field}>
                  <label style={styles.label}>{fieldLabel(col.name)}</label>
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
            <div style={styles.recoverySection}>
              <button
                type="button"
                style={styles.toggleBtn}
                onClick={() => setShowCodes((v) => !v)}
              >
                {showCodes ? "▾" : "▸"} Recovery Codes ({recoveryCols.filter((c) => form[c.name] != null).length} set)
              </button>
              {showCodes && (
                <div style={styles.grid}>
                  {recoveryCols.map((col) => (
                    <div key={col.name} style={styles.field}>
                      <label style={styles.label}>{col.name}</label>
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

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" style={styles.saveBtn} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  modal: {
    background: "#fff", borderRadius: 8, width: "min(680px, 95vw)",
    maxHeight: "90vh", display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px", borderBottom: "1px solid #e2e8f0",
  },
  title:    { fontSize: 16, fontWeight: 600 },
  closeBtn: { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" },
  error:    { padding: "8px 20px", background: "#fef2f2", color: "#dc2626", fontSize: 13 },
  form:     { overflowY: "auto", padding: "16px 20px 8px", display: "flex", flexDirection: "column", gap: 16 },
  grid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 16px" },
  field:    { display: "flex", flexDirection: "column", gap: 4 },
  label:    { fontSize: 12, fontWeight: 600, color: "#475569" },
  readOnly: { width: "100%", padding: "6px 8px", border: "1px solid #e2e8f0", borderRadius: 4, fontSize: 13, background: "#f8fafc", color: "#94a3b8" },
  recoverySection: { borderTop: "1px solid #e2e8f0", paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 },
  toggleBtn:  { background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#475569", textAlign: "left", padding: 0 },
  actions:    { display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 0 4px", borderTop: "1px solid #e2e8f0" },
  cancelBtn:  { padding: "7px 16px", border: "1px solid #cbd5e1", borderRadius: 6, background: "#fff", cursor: "pointer", fontSize: 13 },
  saveBtn:    { padding: "7px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 },
};
