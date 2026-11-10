/**
 * MAD Gambit — database schema readiness check.
 *
 * Read-only verification for an environment where DATABASE_URL is available.
 * It checks the migration ledger, the extensions the migrations create, and every
 * application table the migrations create — without exposing connection details or
 * application data.
 *
 * WHAT IT REQUIRES IS DERIVED FROM `verify/sql/`, NOT TYPED HERE. This file used to hold a
 * hand-written list of 41 table names and "migrations 0001–0014"; the migrations grew to 26
 * files and 67 tables and the lists did not, so it reported "Schema readiness: verified" for a
 * database missing migrations 0017–0026. See `scripts/lib/schema-inventory.mjs`, which also holds
 * the comparison (`evaluateSchema`) so it is unit-tested without a database.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { evaluateSchema, schemaInventory } from "./lib/schema-inventory.mjs";

const { Client } = pg;
const FALLBACK_DATABASE_URL_KEYS = ["NEON_SKY_PARK_DATABASE_URL", "NEO_DATABASE_URL"];
const SQL_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "sql");

const connectionString = process.env.DATABASE_URL
  ?? FALLBACK_DATABASE_URL_KEYS.map((key) => process.env[key]).find(Boolean);

if (!connectionString) {
  console.error("DATABASE_URL is required for schema verification.");
  process.exit(1);
}

const inventory = await schemaInventory(SQL_DIR);

// A verifier that looked at nothing is not a passing verifier.
if (inventory.migrations.length === 0 || inventory.tables.length === 0) {
  console.error(
    `Schema verification refused: found ${inventory.migrations.length} migration file(s) and ` +
      `${inventory.tables.length} table(s) under ${SQL_DIR}. Nothing to check against.`,
  );
  process.exit(1);
}

const client = new Client({ connectionString });
try {
  await client.connect();
  const [{ rows: migrations }, { rows: extensions }, { rows: tables }] = await Promise.all([
    client.query("SELECT name FROM _migrations ORDER BY name"),
    client.query("SELECT extname FROM pg_extension"),
    client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])",
      [inventory.tables],
    ),
  ]);

  const result = evaluateSchema(inventory, {
    presentTables: tables.map(({ tablename }) => tablename),
    appliedMigrations: migrations.map(({ name }) => name),
    extensions: extensions.map(({ extname }) => extname),
  });

  console.log(`Migrations recorded: ${migrations.length} of ${inventory.migrations.length} in sql/`);
  console.log(`Application tables: ${inventory.tables.length - result.missingTables.length}/${inventory.tables.length}`);
  console.log(`Extensions: ${inventory.extensions.filter((e) => e !== "plpgsql").join(", ") || "none required"}${result.missingExtensions.length ? " (MISSING)" : " (ready)"}`);
  if (!result.ok) {
    if (result.missingTables.length) console.error(`Missing tables: ${result.missingTables.join(", ")}`);
    if (result.missingExtensions.length) console.error(`Missing extension(s): ${result.missingExtensions.join(", ")}`);
    if (result.missingMigrations.length) console.error(`Missing migration ledger entries: ${result.missingMigrations.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Schema readiness: verified");
  }
} catch (error) {
  console.error("Schema verification failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
