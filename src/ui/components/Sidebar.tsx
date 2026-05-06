import { useState } from "react";
import { TABLE_NAV_LABELS } from "../labels.ts";
import type { TableConfig } from "../types.ts";

interface Props {
  configs: TableConfig[];
  current: string;
  onSelect: (route: string) => void;
}

export function Sidebar({ configs, current, onSelect }: Props) {
  const [showBackup, setShowBackup] = useState(false);
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [busy, setBusy]             = useState(false);
  const [error, setError]           = useState("");
  const [shutdown, setShutdown]     = useState(false);

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) { setError("Minimum 4 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/backup/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        setError(body.error ?? "Download failed");
        return;
      }
      const blob = await res.blob();
      const filename = res.headers.get("X-Filename") ?? "spider-backup.sqlite.enc";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setShowBackup(false);
      setPassword("");
      setConfirm("");
    } catch {
      setError("Download failed");
    } finally {
      setBusy(false);
    }
  }

  function closeBackup() {
    setShowBackup(false);
    setPassword("");
    setConfirm("");
    setError("");
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
          onClick={() => setShowBackup(true)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors text-[12px] font-medium w-full text-left"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
          Download Backup
        </button>
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

      {/* Backup password prompt */}
      {showBackup && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={(e) => e.target === e.currentTarget && closeBackup()}
        >
          <form
            onSubmit={handleDownload}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Encrypted Backup</h3>
              <p className="text-xs text-slate-400 mt-1">
                The backup will be encrypted with AES-256-GCM. You will need this password to restore it.
              </p>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4">
              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-mono"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-white transition-colors"
                onClick={closeBackup}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm shadow-indigo-600/20"
              >
                {busy ? "Encrypting..." : "Download"}
              </button>
            </div>
          </form>
        </div>
      )}
    </nav>
  );
}
