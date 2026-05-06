import { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { TablePage } from "./components/TablePage.tsx";
import type { TableConfig } from "./types.ts";

const TABLE_ORDER = ["accounts","categories","passcodes","paymentMethods","statuses","users"];

export function App() {
  const [configs, setConfigs]   = useState<TableConfig[]>([]);
  const [current, setCurrent]   = useState<string>(
    window.location.hash.replace("#", "") || "accounts"
  );

  useEffect(() => {
    // Load all schemas to populate sidebar
    Promise.all(
      TABLE_ORDER.map((r) => fetch(`/api/${r}/schema`).then((res) => res.json() as Promise<TableConfig>))
    ).then(setConfigs);
  }, []);

  function navigate(route: string) {
    setCurrent(route);
    window.location.hash = route;
  }

  useEffect(() => {
    function onHash() {
      const r = window.location.hash.replace("#", "");
      if (r) setCurrent(r);
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      <Sidebar configs={configs} current={current} onSelect={navigate} />
      <main style={styles.main}>
        <TablePage key={current} apiRoute={current} />
      </main>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { flex: 1, overflow: "auto", display: "flex", flexDirection: "column" },
};
