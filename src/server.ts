import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { resolve } from "path";
import { initDb } from "./api/db.ts";
import { mountRoutes } from "./api/routes/index.ts";

const dbPath = resolve(Bun.argv[2] ?? "data/output/spider.sqlite");
const port   = Number(Bun.env.PORT ?? 3000);
const isDev  = Bun.env.NODE_ENV !== "production";

// Build the React bundle before starting (skip in production — use `bun run build:ui` separately)
if (isDev) {
  console.log("Building UI...");
  const result = await Bun.build({
    entrypoints: ["src/ui/main.tsx"],
    outdir: "dist",
    target: "browser",
    naming: "bundle.js",
  });
  if (!result.success) {
    console.error("UI build failed:", result.logs);
    process.exit(1);
  }
  await Bun.write("dist/index.html", await Bun.file("src/ui/index.html").text());
}

// Initialise SQLite
initDb(dbPath);
console.log(`Database: ${dbPath}`);

const app = new Hono();

// API routes first (must precede serveStatic)
mountRoutes(app);

// Static files from dist/
app.use("/*", serveStatic({ root: "./dist" }));

// SPA catch-all
app.get("*", async (c) => {
  const html = await Bun.file("dist/index.html").text();
  return c.html(html);
});

console.log(`Spider UI → http://localhost:${port}`);

export default { port, fetch: app.fetch };
