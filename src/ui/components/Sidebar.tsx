import { TABLE_NAV_LABELS } from "../labels.ts";
import type { TableConfig } from "../types.ts";

interface Props {
  configs: TableConfig[];
  current: string;
  onSelect: (route: string) => void;
}

export function Sidebar({ configs, current, onSelect }: Props) {
  return (
    <nav className="w-48 bg-slate-950 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <span className="text-indigo-400 text-lg leading-none">⬡</span>
          <span className="font-display text-white text-sm font-bold tracking-[0.18em] uppercase">
            Spider
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col pt-2 pb-4 gap-px">
        {configs.map((cfg) => {
          const isActive = current === cfg.apiRoute;
          return (
            <button
              key={cfg.apiRoute}
              className={[
                "text-left px-5 py-2.5 text-sm font-medium transition-all duration-100",
                "w-full border-l-2",
                isActive
                  ? "text-white bg-slate-800/70 border-indigo-500"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/60 border-transparent",
              ].join(" ")}
              onClick={() => onSelect(cfg.apiRoute)}
            >
              {TABLE_NAV_LABELS[cfg.apiRoute] ?? cfg.apiRoute}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto px-5 py-4 border-t border-slate-800/80">
        <span className="text-slate-600 text-[10px] tracking-wider uppercase font-medium">
          Local Vault
        </span>
      </div>
    </nav>
  );
}
