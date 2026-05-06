import { useState, useEffect, useCallback } from "react";
import { DataGrid } from "./DataGrid.tsx";
import { RecordModal } from "./RecordModal.tsx";
import { TABLE_SINGULAR } from "../labels.ts";
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
  const [toast, setToast]         = useState<{ msg: string; error?: boolean } | null>(null);
  const [loading, setLoading]     = useState(true);

  function showToast(msg: string, error = false) {
    setToast({ msg, error });
    setTimeout(() => setToast(null), error ? 4000 : 2500);
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
            fetch(`/api/${fk.refTable}?masked=false`).then((r) => r.json() as Promise<{ data: Row[] }>)
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
    const id  = String(row[config.pk]);
    const res = await fetch(`/api/${apiRoute}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json() as { error?: string };
      showToast(body.error ?? "Delete failed.", true);
      return;
    }
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <span className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }
  if (!config) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
        Failed to load config.
      </div>
    );
  }

  const hasFks = config.fks.length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-6">
      {/* Toast */}
      {toast && (
        <div
          className={[
            "fixed bottom-6 right-6 px-5 py-3.5 rounded-xl text-sm font-medium z-[200] max-w-sm",
            "shadow-xl border",
            toast.error
              ? "bg-red-600 text-white border-red-500 shadow-red-600/20"
              : "bg-slate-900 text-slate-50 border-slate-700 shadow-slate-900/30",
          ].join(" ")}
        >
          {toast.msg}
        </div>
      )}

      {/* Card container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 flex flex-col flex-1 overflow-hidden">
        {/* Card header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-display tracking-tight">
              {config.tableName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {rows.length} total record{rows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all w-60 placeholder:text-slate-400"
                placeholder="Search records..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-600/20"
              onClick={() => setModal({ mode: "create", row: null })}
            >
              + New
            </button>
          </div>
        </div>

        {/* FK filter strip */}
        {hasFks && (
          <div className="flex flex-wrap items-end gap-x-5 gap-y-3 px-7 py-4 bg-slate-50/80 border-b border-slate-100">
            {config.fks.map((fk) => {
              const opts   = fkOptions[fk.refTable] ?? [];
              const label  = TABLE_SINGULAR[fk.refTable] ?? fk.refTable;
              const active = Boolean(fkFilters[fk.column]);
              return (
                <div key={fk.column} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
                    {label}
                  </label>
                  <select
                    className={[
                      "px-3 py-2 text-xs border rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-w-[130px]",
                      active
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700 font-medium"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    ].join(" ")}
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
              <button
                className="px-3.5 py-2 text-xs border border-red-200 rounded-lg bg-white text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors self-end"
                onClick={clearFilters}
              >
                Clear{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>
            )}
          </div>
        )}

        {/* Table area */}
        <div className="flex-1 overflow-auto scroll-thin">
          <DataGrid
            config={config}
            rows={filtered}
            fkLabels={fkLabels}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Card footer */}
        <div className="px-7 py-3 border-t border-slate-100 bg-slate-50/50 flex-shrink-0">
          <span className="text-xs text-slate-400">
            Showing <span className="font-medium text-slate-500">{filtered.length}</span> of{" "}
            <span className="font-medium text-slate-500">{rows.length}</span> records
          </span>
        </div>
      </div>

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
