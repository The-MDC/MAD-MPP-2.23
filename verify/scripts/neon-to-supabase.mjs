#!/usr/bin/env node
/**
 * Copy whatever Neon has and Supabase lacks, then PROVE the two agree — the last step before Neon is retired.
 *
 * Neon has been production's live database since the 2026-11-02 port to Supabase, so rows written since then
 * (beta sign-ups, audit entries, ledger rows…) exist only there. Deleting Neon before this has run loses them.
 *
 * Inputs come from the environment (never a command line, never a file this script writes):
 *   NEON_URL      the source   (postgres URL, read-only use)
 *   SUPABASE_URL  the target   (postgres URL of a role that can INSERT; the app_preview role is enough)
 *   SUPABASE_CA_PEM_FILE  optional path to the Supabase root CA (public certificate)
 *
 * Usage:   node scripts/neon-to-supabase.mjs              (DRY RUN — counts and the plan only; writes nothing)
 *          node scripts/neon-to-supabase.mjs --apply      (copy missing rows, fix sequences, then re-count)
 *
 * How rows are copied: `INSERT … SELECT * FROM json_populate_recordset(null::table, $1) ON CONFLICT DO NOTHING`,
 * so every column type survives (jsonb, arrays, vector) and rows already on Supabase are never overwritten.
 * Exit code 0 only when, after the copy, no table has more rows on Neon than on Supabase.
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const apply = process.argv.includes("--apply");
const BATCH = 500;
const SKIP = new Set(["_migrations"]); // each side keeps its own migration ledger

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

const neonUrl = process.env.NEON_URL || fail("NEON_URL is not set");
const supaUrl = process.env.SUPABASE_URL || fail("SUPABASE_URL is not set");
if (!/^postgres(ql)?:\/\//.test(neonUrl)) fail("NEON_URL is not a postgres URL");
if (!/^postgres(ql)?:\/\//.test(supaUrl)) fail("SUPABASE_URL is not a postgres URL");
if (neonUrl === supaUrl) fail("NEON_URL and SUPABASE_URL are the same database");
if (!/neon\.tech/i.test(neonUrl)) fail("NEON_URL does not look like a Neon host (*.neon.tech); refusing to guess which side is the source");
if (/neon\.tech/i.test(supaUrl)) fail("SUPABASE_URL points at Neon; the target must be Supabase");

const pg = (await import(process.env.PG_MODULE || "pg")).default;
const verify = (u) => u.replace(/([?&]sslmode=)(require|prefer|verify-ca)\b/i, "$1verify-full");
const caFile = process.env.SUPABASE_CA_PEM_FILE;
const neon = new pg.Pool({ connectionString: verify(neonUrl), max: 1, ssl: { rejectUnauthorized: true } });
const supa = new pg.Pool({
  connectionString: verify(supaUrl),
  max: 1,
  ssl: { rejectUnauthorized: true, ...(caFile ? { ca: readFileSync(caFile, "utf8") } : {}) },
});

const tablesOf = async (pool) =>
  (await pool.query(`select tablename from pg_tables where schemaname='public' order by 1`)).rows.map((r) => r.tablename).filter((t) => !SKIP.has(t));
const count = async (pool, t) => (await pool.query(`select count(*)::bigint as n from public."${t}"`)).rows[0].n * 1;

async function counts() {
  const nTables = await tablesOf(neon);
  const sTables = new Set(await tablesOf(supa));
  const rows = [];
  for (const t of nTables) rows.push({ t, neon: await count(neon, t), supa: sTables.has(t) ? await count(supa, t) : null });
  return rows;
}

try {
  const before = await counts();
  const missingTables = before.filter((r) => r.supa === null).map((r) => r.t);
  if (missingTables.length) fail(`tables on Neon but not on Supabase (run the migrations first): ${missingTables.join(", ")}`);
  console.log(`${"table".padEnd(28)} ${"neon".padStart(8)} ${"supabase".padStart(9)}`);
  for (const r of before) if (r.neon || r.supa) console.log(`${r.t.padEnd(28)} ${String(r.neon).padStart(8)} ${String(r.supa).padStart(9)}${r.neon > r.supa ? "   ← Neon has more" : ""}`);
  const behind = before.filter((r) => r.neon > r.supa);
  console.log(`\n${behind.length} table(s) where Neon has more rows than Supabase.`);

  if (!apply) {
    console.log("Dry run: nothing written. Re-run with --apply to copy the missing rows.");
    process.exit(behind.length ? 3 : 0);
  }

  for (const { t } of behind) {
    const cols = (await neon.query(`select column_name from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position`, [t])).rows.map((c) => c.column_name);
    const { rows } = await neon.query(`select * from public."${t}"`);
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = JSON.stringify(rows.slice(i, i + BATCH));
      const r = await supa.query(
        `insert into public."${t}" (${cols.map((c) => `"${c}"`).join(",")}) select ${cols.map((c) => `"${c}"`).join(",")} from json_populate_recordset(null::public."${t}", $1::json) on conflict do nothing`,
        [chunk],
      );
      inserted += r.rowCount ?? 0;
    }
    // Keep serial/identity sequences ahead of the copied ids so the next insert cannot collide.
    const seqs = (await supa.query(`select a.attname as col, pg_get_serial_sequence(format('%I.%I','public',$1), a.attname) as seq
                                    from pg_attribute a where a.attrelid = format('public.%I',$1)::regclass and a.attnum > 0 and not a.attisdropped`, [t])).rows.filter((s) => s.seq);
    for (const s of seqs) await supa.query(`select setval($1, greatest(coalesce((select max("${s.col}") from public."${t}"), 1), 1))`, [s.seq]);
    console.log(`  ${t}: read ${rows.length}, inserted ${inserted}`);
  }

  const after = await counts();
  const stillBehind = after.filter((r) => r.neon > r.supa);
  console.log(`\nAfter the copy: ${stillBehind.length} table(s) where Neon still has more rows.`);
  for (const r of stillBehind) console.log(`  ${r.t}: neon ${r.neon}, supabase ${r.supa}`);
  process.exit(stillBehind.length ? 2 : 0);
} finally {
  await neon.end().catch(() => {});
  await supa.end().catch(() => {});
}
