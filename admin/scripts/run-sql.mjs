// Usage: node scripts/run-sql.mjs <file.sql>   (reads DATABASE_URL from .env.local or env)
// Splits on ";" + newline, so keep migrations to plain statements.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

try {
  const path = fileURLToPath(new URL("../.env.local", import.meta.url));
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
} catch {
  // rely on real env
}

const file = process.argv[2];
if (!file || !process.env.DATABASE_URL) {
  console.error("Usage: node scripts/run-sql.mjs <file.sql>  (needs DATABASE_URL in .env.local)");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(file, "utf8")
  .split(/;\s*\n/)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);
for (const stmt of statements) {
  await sql.query(stmt);
  console.log("ok:", stmt.split("\n")[0].slice(0, 70));
}
console.log(`Ran ${statements.length} statements from ${file}`);
