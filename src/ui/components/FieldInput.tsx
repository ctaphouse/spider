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

export function FieldInput({ name, value, sensitive, fk, fkOptions, onChange }: Props) {
  const [revealed, setRevealed] = useState(false);
  const strVal = value != null ? String(value) : "";

  if (fk && fkOptions) {
    return (
      <select
        style={styles.input}
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
      <div style={styles.sensitiveWrapper}>
        <input
          type={revealed ? "text" : "password"}
          style={{ ...styles.input, ...styles.sensitiveInput }}
          value={strVal}
          autoComplete="off"
          onChange={(e) => onChange(name, e.target.value || null)}
        />
        <button
          type="button"
          style={styles.revealBtn}
          title={revealed ? "Hide" : "Reveal"}
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
      style={styles.input}
      value={strVal}
      onChange={(e) => onChange(name, e.target.value || null)}
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  input: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: 4,
    fontSize: 13,
    background: "#fff",
  },
  sensitiveWrapper: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  sensitiveInput: {
    width: "100%",
    fontFamily: "monospace",
  },
  revealBtn: {
    flexShrink: 0,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    padding: "2px 4px",
    lineHeight: 1,
  },
};
