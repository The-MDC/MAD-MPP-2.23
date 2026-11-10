/**
 * What the migrations in `verify/sql/` say the database must contain — derived, never typed.
 *
 * WHY THIS EXISTS. `scripts/schema-verify.mjs` used to carry two hand-written lists: 41 table
 * names and "migrations 0001–0014". When the migrations grew to 26 files and 67 tables nobody
 * updated them, so `npm run schema:verify` printed "Schema readiness: verified" for a database
 * that was missing migrations 0017–0026 (the admin suite, beta signups, files, flags) and 26 of
 * their tables. A verification script that checks a list somebody remembers to keep current is
 * a green light that goes dark the first time somebody forgets — this repo's recurring failure.
 * So the list is now read from the same files the migration runner applies, and
 * `evaluateSchema` is a pure function so the "database is missing something" cases are tested
 * without a database.
 *
 * The parser is deliberately small and strict about what it ignores: SQL comments and
 * single-quoted string literals are blanked first, so a table named in a comment or a string is
 * not a table.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/** Blank `-- …`, block comments and '…' literals (length-preserving is not needed here). */
export function stripSqlNoise(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/'(?:[^']|'')*'/g, "''");
}

const IDENT = `(?:"([A-Za-z_][\\w$]*)"|([A-Za-z_][\\w$]*))`;
const QUAL = `(?:(?:"public"|public)\\s*\\.\\s*)?`;
const CREATE_TABLE = new RegExp(`\\bCREATE\\s+(?:UNLOGGED\\s+)?TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${QUAL}${IDENT}`, "gi");
const CREATE_TEMP = /\bCREATE\s+(?:GLOBAL\s+|LOCAL\s+)?(?:TEMP|TEMPORARY)\s+TABLE\b/i;
const DROP_TABLE = new RegExp(`\\bDROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?${QUAL}${IDENT}`, "gi");
const RENAME_TABLE = new RegExp(`\\bALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(?:ONLY\\s+)?${QUAL}${IDENT}\\s+RENAME\\s+TO\\s+${IDENT}`, "gi");
const CREATE_EXTENSION = new RegExp(`\\bCREATE\\s+EXTENSION\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?${IDENT}`, "gi");

const name = (m, i) => (m[i] ?? m[i + 1]).toLowerCase();

/**
 * Apply one migration's DDL, in textual order, to a running set of tables/extensions.
 * Order matters: a table created in 0005 and dropped in 0012 is not required.
 */
export function applyDdl(sql, state) {
  const clean = stripSqlNoise(sql);
  const events = [];
  for (const m of clean.matchAll(CREATE_TABLE)) {
    // `CREATE TEMP TABLE x` does not match CREATE_TABLE's prefix, so no extra guard is needed here;
    // CREATE_TEMP is kept to document (and test) that temp tables are never required.
    events.push({ at: m.index, op: "create", table: name(m, 1) });
  }
  for (const m of clean.matchAll(DROP_TABLE)) events.push({ at: m.index, op: "drop", table: name(m, 1) });
  for (const m of clean.matchAll(RENAME_TABLE)) events.push({ at: m.index, op: "rename", from: name(m, 1), to: name(m, 3) });
  for (const m of clean.matchAll(CREATE_EXTENSION)) events.push({ at: m.index, op: "extension", ext: name(m, 1) });
  events.sort((a, b) => a.at - b.at);
  for (const e of events) {
    if (e.op === "create") state.tables.add(e.table);
    else if (e.op === "drop") state.tables.delete(e.table);
    else if (e.op === "rename") {
      if (state.tables.delete(e.from)) state.tables.add(e.to);
    } else state.extensions.add(e.ext);
  }
}

export function isTempTableDdl(sql) {
  return CREATE_TEMP.test(stripSqlNoise(sql));
}

/**
 * @returns {Promise<{ migrations: string[], tables: string[], extensions: string[] }>}
 *   migrations: every `*.sql` file name, sorted (the order the runner applies them);
 *   tables: public tables the migrations leave in existence;
 *   extensions: extensions they create.
 */
export async function schemaInventory(sqlDir) {
  const migrations = (await readdir(sqlDir)).filter((f) => f.endsWith(".sql")).sort();
  const state = { tables: new Set(), extensions: new Set() };
  for (const file of migrations) applyDdl(await readFile(path.join(sqlDir, file), "utf8"), state);
  return { migrations, tables: [...state.tables].sort(), extensions: [...state.extensions].sort() };
}

/**
 * Compare what the migrations require with what a database reports. Pure.
 *
 * Migrations are matched by their 4-digit prefix, the way the old script did, so a file renamed
 * after it was applied does not read as missing. `presentTables` / `extensions` / `appliedMigrations`
 * are whatever the caller queried.
 */
export function evaluateSchema(inventory, db) {
  const present = new Set(db.presentTables);
  const applied = [...db.appliedMigrations];
  const missingTables = inventory.tables.filter((t) => !present.has(t));
  const missingMigrations = inventory.migrations.filter((f) => {
    const prefix = f.slice(0, 5); // "0017_"
    return !applied.some((a) => a === f || a.startsWith(prefix));
  });
  const haveExt = new Set(db.extensions);
  const missingExtensions = inventory.extensions.filter((e) => e !== "plpgsql" && !haveExt.has(e));
  return {
    missingTables,
    missingMigrations,
    missingExtensions,
    ok: missingTables.length === 0 && missingMigrations.length === 0 && missingExtensions.length === 0,
  };
}
