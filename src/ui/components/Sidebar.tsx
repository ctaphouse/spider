import { useState } from "react";
import { TABLE_NAV_LABELS } from "../labels.ts";
import type { TableConfig } from "../types.ts";

interface Props {
  configs: TableConfig[];
  current: string;
  onSelect: (route: string) => void;
}

export function Sidebar({ configs, current, onSelect }: Props) {
  const [backupBusy, setBackupBusy]   = useState(false);
  const [backupMsg, setBackupMsg]     = useState<string | null>(null);
  const [shutdown, setShutdown]       = useState(false);

  async function handleBackup() {
    setBackupBusy(true);
    setBackupMsg(null);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const body = await res.json() as { ok?: boolean; filename?: string; count?: number; error?: string };
      if (!res.ok || !body.ok) {
        setBackupMsg(body.error ?? "Backup failed");
      } else {
        setBackupMsg(`Saved: ${body.filename}`);
      }
      setTimeout(() => setBackupMsg(null), 4000);
    } catch {
      setBackupMsg("Backup failed");
      setTimeout(() => setBackupMsg(null), 4000);
    } finally {
      setBackupBusy(false);
    }
  }

  return (
    <nav className="w-60 bg-slate-950 flex flex-col flex-shrink-0 border-r border-slate-800">
      {/* Brand */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <span className="text-white text-sm font-bold font-display">S</span>
          </div>
          <div>
            <div className="font-display text-white text-sm font-bold tracking-wide">
              Spider
            </div>
            <div className="text-slate-500 text-[10px] tracking-wider uppercase mt-0.5">
              Credential Vault
            </div>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div className="px-6 pt-2 pb-3">
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-[0.12em]">
          Tables
        </span>
      </div>

      {/* Nav items */}
      <div className="flex flex-col px-3 gap-0.5 flex-1">
        {configs.map((cfg) => {
          const isActive = current === cfg.apiRoute;
          return (
            <button
              key={cfg.apiRoute}
              className={[
                "text-left px-4 py-2.5 text-[13px] font-medium rounded-lg transition-all duration-150",
                "w-full",
                isActive
                  ? "text-white bg-indigo-600 shadow-md shadow-indigo-600/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]",
              ].join(" ")}
              onClick={() => onSelect(cfg.apiRoute)}
            >
              {TABLE_NAV_LABELS[cfg.apiRoute] ?? cfg.apiRoute}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-5 border-t border-slate-800/60 flex flex-col gap-2">
        <button
          onClick={handleBackup}
          disabled={backupBusy}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors text-[12px] font-medium w-full text-left disabled:opacity-50"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
          {backupBusy ? "Backing up..." : "Backup"}
        </button>
        {backupMsg && (
          <div className="px-3 py-1.5 text-[11px] text-slate-400 break-all">
            {backupMsg}
          </div>
        )}
        <button
          onClick={() => {
            if (!window.confirm("Shut down Spider?")) return;
            setShutdown(true);
            fetch("/api/shutdown", { method: "POST" }).catch(() => {});
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors text-[12px] font-medium w-full text-left"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
          </svg>
          Quit Spider
        </button>
        <div className="flex items-center gap-2 px-3 pt-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="text-slate-500 text-[11px]">
            Local database
          </span>
        </div>
      </div>

      {/* Shutdown overlay */}
      {shutdown && (
        <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[999]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Spider has been shut down.</p>
            <p className="text-slate-600 text-xs mt-2">You can close this tab.</p>
          </div>
        </div>
      )}

    </nav>
  );
}
