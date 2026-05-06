import type { TableConfig } from "../types.ts";

const LABELS: Record<string, string> = {
  accounts:       "Accounts",
  categories:     "Categories",
  passcodes:      "Passcodes",
  paymentMethods: "Payment Methods",
  statuses:       "Statuses",
  users:          "Users",
};

interface Props {
  configs: TableConfig[];
  current: string;
  onSelect: (route: string) => void;
}

export function Sidebar({ configs, current, onSelect }: Props) {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>🕷 Spider</div>
      {configs.map((cfg) => (
        <button
          key={cfg.apiRoute}
          style={{ ...styles.item, ...(current === cfg.apiRoute ? styles.active : {}) }}
          onClick={() => onSelect(cfg.apiRoute)}
        >
          {LABELS[cfg.apiRoute] ?? cfg.apiRoute}
        </button>
      ))}
    </nav>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    width: 180,
    background: "#1e293b",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
    padding: "0 0 16px 0",
    flexShrink: 0,
  },
  logo: {
    padding: "20px 16px 16px",
    fontSize: 18,
    fontWeight: 700,
    borderBottom: "1px solid #334155",
    marginBottom: 8,
    color: "#f8fafc",
  },
  item: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    textAlign: "left",
    padding: "10px 16px",
    cursor: "pointer",
    fontSize: 14,
    width: "100%",
    borderRadius: 0,
  },
  active: {
    background: "#334155",
    color: "#f1f5f9",
  },
};
