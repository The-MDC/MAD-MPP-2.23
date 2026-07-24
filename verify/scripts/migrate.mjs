/**
 * MAD Gambit — migration runner (real DB, no ORM).
 *
 * Applies every verify/sql/*.sql file, in sorted order, to DATABASE_URL, inside
 * a transaction each, tracked in a `_migrations` table so re-runs are no-ops.
 * All migrations are `CREATE ... IF NOT EXISTS`, so this is safe to run
 * repeatedly (CI ephemeral branch, prod, local).
 *
 *   DATABASE_URL=postgres://... node scripts/migrate.mjs
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const { Client } = pg;
const SQL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "sql");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set — nothing to migrate against.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();
  console.log("🔌 connected to Postgres");

  await client.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );

  const files = (await readdir(SQL_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set(
    (await client.query(`SELECT name FROM _migrations`)).rows.map((r) => r.name),
  );

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`↳ skip   ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(path.join(SQL_DIR, file), "utf8");
    console.log(`↳ apply  ${file} ...`);
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(`INSERT INTO _migrations (name) VALUES ($1)`, [file]);
      await client.query("COMMIT");
      count++;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`❌ FAILED ${file}: ${err.message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log(`✅ migrations complete — ${count} applied, ${files.length} present`);
  await client.end();
}

main().catch((err) => {
  console.error("❌ migrate crashed:", err);
  process.exit(1);
});
