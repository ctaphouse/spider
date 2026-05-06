import { useState } from "react";
import type { FKRef } from "../types.ts";

interface Props {
  name: string;
  value: unknown;
  sensitive: boolean;
  fk?: FKRef;
  fkOptions?: { value: string | number; label: string }[];
  onChange: (name: string, value: unknown) => void;
}

const inputCls = [
  "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-700",
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-400",
  "transition-all placeholder:text-slate-400 hover:border-slate-300",
].join(" ");

export function FieldInput({ name, value, sensitive, fk, fkOptions, onChange }: Props) {
  const [revealed, setRevealed] = useState(false);
  const strVal = value != null ? String(value) : "";

  if (fk && fkOptions) {
    return (
      <select
        className={inputCls + " cursor-pointer"}
        value={strVal}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(name, raw === "" ? null : isNaN(Number(raw)) ? raw : Number(raw));
        }}
      >
        <option value="">— select —</option>
        {fkOptions.map((opt) => (
          <option key={opt.value} value={String(opt.value)}>{opt.label}</option>
        ))}
      </select>
    );
  }

  if (sensitive) {
    return (
      <div className="flex items-center gap-2">
        <input
          type={revealed ? "text" : "password"}
          className={inputCls + " font-mono tracking-wide flex-1"}
          value={strVal}
          autoComplete="off"
          onChange={(e) => onChange(name, e.target.value || null)}
        />
        <button
          type="button"
          title={revealed ? "Hide" : "Reveal"}
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 transition-colors"
          onClick={() => setRevealed((v) => !v)}
        >
          {revealed ? "🙈" : "👁"}
        </button>
      </div>
    );
  }

  return (
    <input
      type="text"
      className={inputCls}
      value={strVal}
      onChange={(e) => onChange(name, e.target.value || null)}
    />
  );
}
