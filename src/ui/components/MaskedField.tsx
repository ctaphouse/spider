import { useState } from "react";

interface Props {
  value: unknown;
  fieldName: string;
  recordId: unknown;
  apiRoute: string;
}

export function MaskedField({ value, fieldName, recordId, apiRoute }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [actual, setActual]     = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function toggle() {
    if (!revealed && actual === null) {
      setLoading(true);
      try {
        const res = await fetch(`/api/${apiRoute}/${recordId}?masked=false`);
        const row = await res.json() as Record<string, unknown>;
        setActual(row[fieldName] != null ? String(row[fieldName]) : "");
      } finally {
        setLoading(false);
      }
    }
    setRevealed((v) => !v);
  }

  const display = revealed && actual !== null ? actual : (value != null ? "●●●●●" : "—");

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[13px]">
      <span className={revealed ? "text-slate-700" : "text-slate-400 tracking-tight"}>
        {loading ? "…" : display}
      </span>
      {value != null && (
        <button
          onClick={toggle}
          title={revealed ? "Hide" : "Reveal"}
          className="text-slate-400 hover:text-indigo-500 text-[11px] transition-colors leading-none"
        >
          {revealed ? "🙈" : "👁"}
        </button>
      )}
    </span>
  );
}
