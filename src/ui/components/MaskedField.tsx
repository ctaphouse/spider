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
    <span style={{ fontFamily: "monospace", display: "inline-flex", alignItems: "center", gap: 4 }}>
      <span>{loading ? "…" : display}</span>
      {value != null && (
        <button onClick={toggle} title={revealed ? "Hide" : "Reveal"} style={btnStyle}>
          {revealed ? "🙈" : "👁"}
        </button>
      )}
    </span>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0 2px",
  fontSize: 13,
  lineHeight: 1,
};
