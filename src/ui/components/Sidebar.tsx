import { TABLE_NAV_LABELS } from "../labels.ts";
import type { TableConfig } from "../types.ts";

interface Props {
  configs: TableConfig[];
  current: string;
  onSelect: (route: string) => void;
}

export function Sidebar({ configs, current, onSelect }: Props) {
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
      <div className="px-6 py-5 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="text-slate-500 text-[11px]">
            Local database
          </span>
        </div>
      </div>
    </nav>
  );
}
