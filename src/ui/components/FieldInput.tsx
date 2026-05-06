import type { FKRef, Row } from "../types.ts";

interface Props {
  name: string;
  value: unknown;
  sensitive: boolean;
  fk?: FKRef;
  fkOptions?: { value: string | number; label: string }[];
  onChange: (name: string, value: unknown) => void;
  isRecoveryGroup?: boolean;
}

export function FieldInput({ name, value, sensitive, fk, fkOptions, onChange }: Props) {
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
      <input
        type="password"
        style={styles.input}
        value={strVal}
        autoComplete="off"
        onChange={(e) => onChange(name, e.target.value || null)}
      />
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
};
