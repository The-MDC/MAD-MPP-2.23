import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
// A plain .mjs module (the script runs under bare node); `allowJs` lets tsc read it.
import { applyDdl, evaluateSchema, isTempTableDdl, schemaInventory, stripSqlNoise } from "../scripts/lib/schema-inventory.mjs";

/**
 * `npm run schema:verify` used to check a hand-written list — 41 tables, migrations 0001–0014 —
 * against a schema of 67 tables and 26 migrations, so it printed "verified" for a database
 * missing 0017–0026. These tests pin the three things that stop that happening again:
 *
 *   1. what the script requires is DERIVED from `sql/` (the parser, tested on tricky SQL);
 *   2. the comparison (`evaluateSchema`) reports a database that is missing something —
 *      including the exact case the old script waved through;
 *   3. the script cannot grow a hand-written list again.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const VERIFY = fileURLToPath(new URL("..", import.meta.url));
const SQL_DIR = path.join(VERIFY, "sql");
const made: string[] = [];
afterEach(() => {
  while (made.length) rmSync(made.pop() as string, { recursive: true, force: true });
});

const state = () => ({ tables: new Set<string>(), extensions: new Set<string>() });

describe("the DDL parser", () => {
  it("finds plain, IF NOT EXISTS, quoted and public-qualified tables, case-insensitively", () => {
    const s = state();
    applyDdl(
      `CREATE TABLE a (id int);
       create table if not exists b (id int);
       CREATE TABLE public.c (id int);
       CREATE TABLE IF NOT EXISTS "public"."d" (id int);
       CREATE UNLOGGED TABLE e (id int);`,
      s,
    );
    expect([...s.tables].sort()).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("ignores a table that is only named in a comment or a string", () => {
    const s = state();
    applyDdl(
      `-- CREATE TABLE ghost_one (id int);
       /* CREATE TABLE ghost_two (id int); */
       INSERT INTO notes VALUES ('CREATE TABLE ghost_three (id int)');
       CREATE TABLE real_one (id int);`,
      s,
    );
    expect([...s.tables]).toEqual(["real_one"]);
  });

  it("applies drops and renames in order — a dropped table is not required, a renamed one is its new name", () => {
    const s = state();
    applyDdl(
      `CREATE TABLE old_name (id int);
       CREATE TABLE doomed (id int);
       ALTER TABLE old_name RENAME TO new_name;
       DROP TABLE IF EXISTS doomed;`,
      s,
    );
    expect([...s.tables]).toEqual(["new_name"]);
  });

  it("a table created again after a drop is required again", () => {
    const s = state();
    applyDdl(`CREATE TABLE t (id int); DROP TABLE t; CREATE TABLE t (id int, extra int);`, s);
    expect([...s.tables]).toEqual(["t"]);
  });

  it("never requires a temporary table", () => {
    const sql = `CREATE TEMP TABLE scratch (id int); CREATE TEMPORARY TABLE scratch2 (id int);`;
    const s = state();
    applyDdl(sql, s);
    expect([...s.tables]).toEqual([]);
    expect(isTempTableDdl(sql)).toBe(true);
  });

  it("records the extensions a migration creates", () => {
    const s = state();
    applyDdl(`CREATE EXTENSION IF NOT EXISTS vector; CREATE EXTENSION "pgcrypto";`, s);
    expect([...s.extensions].sort()).toEqual(["pgcrypto", "vector"]);
  });

  it("strips noise without eating real statements around it", () => {
    expect(stripSqlNoise("a -- c\nb /* x */ c 'it''s' d")).not.toMatch(/--|\/\*|it''s/);
  });
});

describe("schemaInventory on the real migrations", () => {
  it("lists every .sql file, in the order the runner applies them, and finds the tables they create", async () => {
    const inv = await schemaInventory(SQL_DIR);
    const onDisk = readdirSync(SQL_DIR).filter((f) => f.endsWith(".sql")).sort();
    expect(inv.migrations).toEqual(onDisk);
    expect(inv.migrations.length).toBeGreaterThan(0);
    expect(inv.tables.length).toBeGreaterThan(0);
    expect(inv.extensions).toContain("vector");
  });

  it("includes tables from the LATEST migrations — the ones the hand-written list never reached", async () => {
    const inv = await schemaInventory(SQL_DIR);
    // From 0017–0025. The old script's REQUIRED_TABLES had none of these.
    for (const t of ["beta_signups", "admin_users", "support_tickets", "chat_files", "account_flags"]) {
      expect(inv.tables).toContain(t);
    }
  });

  it("agrees with a crude independent count: every CREATE TABLE keyword in sql/ is accounted for", async () => {
    const inv = await schemaInventory(SQL_DIR);
    let creates = 0;
    for (const f of inv.migrations) {
      const clean = readFileSync(path.join(SQL_DIR, f), "utf8").replace(/--[^\n]*/g, "");
      creates += (clean.match(/\bCREATE\s+(?:UNLOGGED\s+)?TABLE\b/gi) ?? []).length;
    }
    // No drops/renames exist in sql/ today, so the counts must match exactly. If a migration starts
    // dropping a table, this fails loudly and the assertion should be reasoned about, not loosened.
    expect(inv.tables.length).toBe(creates);
  });

  it("fails on an empty directory rather than returning an empty — and therefore trivially satisfied — requirement", async () => {
    const dir = mkdtempSync(path.join(tmpdir(), "schema-empty-"));
    made.push(dir);
    const inv = await schemaInventory(dir);
    expect(inv.migrations).toEqual([]);
    expect(inv.tables).toEqual([]); // the script refuses to run on this (see the guard in schema-verify.mjs)
  });
});

describe("evaluateSchema — a database that is missing something is reported", () => {
  const inventory = {
    migrations: ["0001_a.sql", "0002_b.sql", "0017_late.sql"],
    tables: ["alpha", "beta", "late_table"],
    extensions: ["plpgsql", "vector"],
  };
  const full = {
    presentTables: ["alpha", "beta", "late_table"],
    appliedMigrations: ["0001_a.sql", "0002_b.sql", "0017_late.sql"],
    extensions: ["plpgsql", "vector"],
  };

  it("passes a complete database", () => {
    expect(evaluateSchema(inventory, full)).toMatchObject({ ok: true, missingTables: [], missingMigrations: [], missingExtensions: [] });
  });

  it("REGRESSION: a database missing the LATE migration and its table fails — the old script said 'verified'", () => {
    const r = evaluateSchema(inventory, {
      ...full,
      presentTables: ["alpha", "beta"],
      appliedMigrations: ["0001_a.sql", "0002_b.sql"],
    });
    expect(r.ok).toBe(false);
    expect(r.missingMigrations).toEqual(["0017_late.sql"]);
    expect(r.missingTables).toEqual(["late_table"]);
  });

  it("reports a missing extension", () => {
    const r = evaluateSchema(inventory, { ...full, extensions: ["plpgsql"] });
    expect(r.ok).toBe(false);
    expect(r.missingExtensions).toEqual(["vector"]);
  });

  it("matches a migration by its 4-digit prefix, so a file renamed after it was applied is not 'missing'", () => {
    const r = evaluateSchema(inventory, { ...full, appliedMigrations: ["0001_a.sql", "0002_b.sql", "0017_renamed_later.sql"] });
    expect(r.missingMigrations).toEqual([]);
  });

  it("does not let prefix matching hide a different migration", () => {
    const r = evaluateSchema(inventory, { ...full, appliedMigrations: ["0001_a.sql", "0002_b.sql", "0018_other.sql"] });
    expect(r.missingMigrations).toEqual(["0017_late.sql"]);
  });

  it("an empty database fails everything", () => {
    const r = evaluateSchema(inventory, { presentTables: [], appliedMigrations: [], extensions: [] });
    expect(r.ok).toBe(false);
    expect(r.missingTables).toHaveLength(3);
    expect(r.missingMigrations).toHaveLength(3);
  });
});

describe("schema-verify.mjs cannot grow a hand-written list again", () => {
  const src = readFileSync(path.join(VERIFY, "scripts", "schema-verify.mjs"), "utf8");

  it("derives its requirements from sql/ and uses the pure comparison", () => {
    expect(src).toContain("schemaInventory(");
    expect(src).toContain("evaluateSchema(");
  });

  it("holds no literal table or migration list", () => {
    expect(src).not.toMatch(/REQUIRED_TABLES\s*=\s*\[/);
    expect(src).not.toMatch(/REQUIRED_MIGRATIONS\s*=\s*Array\.from\(\s*\{\s*length:\s*\d+/);
    // a long run of quoted snake_case identifiers is what a pasted table list looks like
    expect(src).not.toMatch(/(?:"[a-z]+_[a-z_]+",\s*){6,}/);
  });

  it("refuses to run when it finds nothing to check against", () => {
    expect(src).toMatch(/Nothing to check against/);
  });
});
