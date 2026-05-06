import { useState, useEffect, useCallback } from "react";
import { DataGrid } from "./DataGrid.tsx";
import { RecordModal } from "./RecordModal.tsx";
import { stripTbl, TABLE_SINGULAR } from "../labels.ts";
import type { TableConfig, Row } from "../types.ts";

interface Props {
  apiRoute: string;
}

type ModalState = { mode: "create"; row: null } | { mode: "edit"; row: Row };

export function TablePage({ apiRoute }: Props) {
  const [config, setConfig]       = useState<TableConfig | null>(null);
  const [rows, setRows]           = useState<Row[]>([]);
  const [fkLabels, setFkLabels]   = useState<Record<string, Record<string, string>>>({});
  const [fkOptions, setFkOptions] = useState<Record<string, { value: string | number; label: string }[]>>({});
  const [modal, setModal]         = useState<ModalState | null>(null);
  const [search, setSearch]       = useState("");
  const [fkFilters, setFkFilters] = useState<Record<string, string>>({});
  const [toast, setToast]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, rowsRes] = await Promise.all([
        fetch(`/api/${apiRoute}/schema`),
        fetch(`/api/${apiRoute}`),
      ]);
      const cfg  = await cfgRes.json()  as TableConfig;
      const data = await rowsRes.json() as { data: Row[] };
      setConfig(cfg);
      setRows(data.data);

      if (cfg.fks.length > 0) {
        const lookups = await Promise.all(
          cfg.fks.map((fk) =>
            fetch(`/api/${fk.refTable}`).then((r) => r.json() as Promise<{ data: Row[] }>)
          )
        );
        const labels:  Record<string, Record<string, string>> = {};
        const options: Record<string, { value: string | number; label: string }[]> = {};
        cfg.fks.forEach((fk, i) => {
          const lookupRows = lookups[i].data;
          labels[fk.column]    = {};
          options[fk.refTable] = lookupRows.map((r) => ({
            value: r[fk.refPk] as string | number,
            label: String(r[fk.refLabel] ?? r[fk.refPk] ?? ""),
          }));
          for (const r of lookupRows) {
            labels[fk.column][String(r[fk.refPk])] = String(r[fk.refLabel] ?? "");
          }
        });
        setFkLabels(labels);
        setFkOptions(options);
      }
    } finally {
      setLoading(false);
    }
  }, [apiRoute]);

  useEffect(() => {
    setSearch("");
    setFkFilters({});
    setModal(null);
    loadData();
  }, [apiRoute, loadData]);

  async function handleSave(data: Row) {
    if (!config) return;
    const isEdit = modal?.mode === "edit";
    const id     = isEdit ? String(modal.row[config.pk]) : null;
    const url    = isEdit ? `/api/${apiRoute}/${id}` : `/api/${apiRoute}`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      throw new Error(err.error ?? "Request failed");
    }
    setModal(null);
    showToast(isEdit ? "Record updated." : "Record created.");
    await loadData();
  }

  async function handleDelete(row: Row) {
    if (!config) return;
    if (!confirm("Delete this record?")) return;
    const id = String(row[config.pk]);
    await fetch(`/api/${apiRoute}/${id}`, { method: "DELETE" });
    showToast("Record deleted.");
    await loadData();
  }

  async function handleEdit(row: Row) {
    if (!config) return;
    let rowData = row;
    if (config.sensitiveFields.length > 0) {
      const res = await fetch(`/api/${apiRoute}/${String(row[config.pk])}?masked=false`);
      rowData = await res.json() as Row;
    }
    setModal({ mode: "edit", row: rowData });
  }

  function setFkFilter(col: string, val: string) {
    setFkFilters((prev) => ({ ...prev, [col]: val }));
  }

  function clearFilters() {
    setFkFilters({});
    setSearch("");
  }

  const activeFilterCount = Object.values(fkFilters).filter(Boolean).length;
  const hasFilters = activeFilterCount > 0 || search !== "";

  const filtered = rows.filter((row) => {
    if (search && !Object.values(row).some((v) =>
      String(v ?? "").toLowerCase().includes(search.toLowerCase())
    )) return false;
    for (const [col, val] of Object.entries(fkFilters)) {
      if (val !== "" && String(row[col]) !== val) return false;
    }
    return true;
  });

  if (loading) return <div style={styles.loading}>Loading…</div>;
  if (!config)  return <div style={styles.loading}>Failed to load config.</div>;

  const hasFks = config.fks.length > 0;

  return (
    <div style={styles.page}>
      {toast && <div style={styles.toast}>{toast}</div>}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <h1 style={styles.heading}>{stripTbl(config.tableName)}</h1>
        <div style={styles.toolbarRight}>
          <input
            style={styles.search}
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button style={styles.newBtn} onClick={() => setModal({ mode: "create", row: null })}>
            + New
          </button>
        </div>
      </div>

      {/* FK filter bar — only shown for tables with foreign keys */}
      {hasFks && (
        <div style={styles.filterBar}>
          {config.fks.map((fk) => {
            const opts   = fkOptions[fk.refTable] ?? [];
            const label  = TABLE_SINGULAR[fk.refTable] ?? fk.refTable;
            const active = Boolean(fkFilters[fk.column]);
            return (
              <div key={fk.column} style={styles.filterGroup}>
                <label style={styles.filterLabel}>{label}</label>
                <select
                  style={{ ...styles.filterSelect, ...(active ? styles.filterSelectActive : {}) }}
                  value={fkFilters[fk.column] ?? ""}
                  onChange={(e) => setFkFilter(fk.column, e.target.value)}
                >
                  <option value="">All</option>
                  {opts.map((opt) => (
                    <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
                  ))}
                </select>
              </div>
            );
          })}
          {hasFilters && (
            <button style={styles.clearBtn} onClick={clearFilters}>
              ✕ Clear{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </button>
          )}
        </div>
      )}

      <div style={styles.count}>{filtered.length} of {rows.length} records</div>

      <DataGrid
        config={config}
        rows={filtered}
        fkLabels={fkLabels}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {modal && (
        <RecordModal
          mode={modal.mode}
          config={config}
          initial={modal.mode === "edit" ? modal.row : null}
          fkOptions={fkOptions}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page:     { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  loading:  { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" },
  toolbar:  { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 10px" },
  heading:  { fontSize: 18, fontWeight: 700, color: "#1e293b" },
  toolbarRight: { display: "flex", gap: 8, alignItems: "center" },
  search:   { padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, width: 200 },
  newBtn:   { padding: "6px 14px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  filterBar: {
    display: "flex", flexWrap: "wrap", alignItems: "flex-end",
    gap: "8px 16px", padding: "8px 20px 10px",
    borderTop: "1px solid #e2e8f0", background: "#f8fafc",
  },
  filterGroup:  { display: "flex", flexDirection: "column", gap: 3 },
  filterLabel:  { fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" },
  filterSelect: { padding: "5px 8px", border: "1px solid #cbd5e1", borderRadius: 5, fontSize: 13, background: "#fff", cursor: "pointer", minWidth: 120 },
  filterSelectActive: { borderColor: "#2563eb", background: "#eff6ff", color: "#1d4ed8" },
  clearBtn:  { padding: "5px 12px", fontSize: 12, cursor: "pointer", border: "1px solid #fca5a5", borderRadius: 5, background: "#fff", color: "#dc2626", alignSelf: "flex-end" },
  count:    { padding: "6px 20px 8px", fontSize: 12, color: "#94a3b8" },
  toast:    {
    position: "fixed", bottom: 24, right: 24, background: "#1e293b", color: "#f8fafc",
    padding: "10px 18px", borderRadius: 8, fontSize: 13, zIndex: 200,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
};
