#!/usr/bin/env node
/**
 * Point ONE Vercel environment of the `mad-mpp-2-23` project at a database, without touching the others.
 *
 * Why this exists in the repo: the previous helper lived in an untracked local folder, asked for a password at a
 * hidden prompt, and relied on `upsert=true` — which is exactly where a variable that spans Preview AND Production
 * (the Neon integration's DATABASE_URL does) can get overwritten for both. This script does it explicitly:
 *
 *   1. read the project's env entries (names, ids, targets — never values);
 *   2. for each managed key, if an entry covers the chosen target AND others, PATCH it so it covers only the others
 *      (the value is untouched, so the other environments keep working exactly as before);
 *   3. create the new entries for the chosen target only;
 *   4. re-read and ASSERT that every entry that was not meant to change still has the same id and the same targets.
 *
 * Inputs come from the environment, so no secret is ever on a command line or in a file this script writes:
 *   DB_URL_POOLED   transaction pooler URL   (becomes DATABASE_URL)
 *   DB_URL_SESSION  session pooler URL       (becomes DATABASE_URL_UNPOOLED; used by migrations)
 *   DB_CA_PEM_FILE  path to the CA certificate PEM (public; becomes DATABASE_CA_CERT)
 *   DB_POOL_MAX     optional, default 5
 *
 * Usage:   node scripts/vercel-db-env.mjs --dry-run             (plan only; writes nothing)
 *          node scripts/vercel-db-env.mjs                       (Preview)
 *          node scripts/vercel-db-env.mjs --target production --i-understand-this-is-production
 *
 * Requires the Vercel CLI, already logged in. Production is refused unless the flag above is present.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const TEAM = process.env.VERCEL_ORG_ID || "team_ThJlmLcaIliE23YywpmA7uQf";
const PROJECT = process.env.VERCEL_PROJECT_ID || "prj_aiAAMWo4XvseAHHMMzIrH1ET1KCK";
const MANAGED = ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "DATABASE_CA_CERT", "DB_POOL_MAX"];

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const target = args.includes("--target") ? args[args.indexOf("--target") + 1] : "preview";
const dryRun = flag("--dry-run");

if (!["preview", "production"].includes(target)) fail(`--target must be preview or production, got "${target}"`);
if (target === "production" && !flag("--i-understand-this-is-production")) {
  fail("refusing to change Production without --i-understand-this-is-production");
}

function fail(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

/** `vercel api` with a JSON body from a temp file; strips the CLI's hint lines; never echoes the body. */
function api(method, route, body) {
  const argv = ["api", `${route}${route.includes("?") ? "&" : "?"}teamId=${TEAM}`, "-X", method];
  let file;
  if (body !== undefined) {
    file = path.join(os.tmpdir(), `vercel-db-env-${process.pid}-${Math.random().toString(36).slice(2)}.json`);
    fs.writeFileSync(file, JSON.stringify(body), { mode: 0o600 });
    argv.push("--input", file);
  }
  try {
    const out = execFileSync("vercel", argv, { encoding: "utf8", shell: process.platform === "win32" });
    const json = out.split("\n").filter((l) => !l.startsWith("<claude-code-hint")).join("\n").trim();
    return json ? JSON.parse(json) : {};
  } finally {
    if (file) fs.rmSync(file, { force: true });
  }
}

const listEntries = () =>
  (api("GET", `/v10/projects/${PROJECT}/env`).envs ?? []).map((e) => ({
    id: e.id,
    key: e.key,
    target: [...(e.target ?? [])].sort(),
    gitBranch: e.gitBranch ?? null,
  }));

const must = (name) => process.env[name] || fail(`${name} is not set`);
const pooled = must("DB_URL_POOLED");
const session = must("DB_URL_SESSION");
const caFile = must("DB_CA_PEM_FILE");
const ca = fs.readFileSync(caFile, "utf8").trim().replace(/\r?\n/g, "\\n");
const poolMax = process.env.DB_POOL_MAX || "5";
for (const [n, v] of [["DB_URL_POOLED", pooled], ["DB_URL_SESSION", session]]) {
  if (!/^postgres(ql)?:\/\//.test(v)) fail(`${n} is not a postgres URL`);
  if (/neon\.tech/i.test(v)) fail(`${n} points at Neon; this script only switches TO the new database`);
}

const before = listEntries();

// Plan: which existing managed entries cover the target?
const touching = before.filter((e) => MANAGED.includes(e.key) && e.target.includes(target));
const detach = touching.filter((e) => e.target.length > 1); // shared with other environments → PATCH to remove `target`
const retire = touching.filter((e) => e.target.length === 1); // target-only → DELETE and recreate

console.log(`Target: ${target}${dryRun ? "  (dry run — nothing will be written)" : ""}`);
console.log(`Entries that cover ${target}: ${touching.map((e) => `${e.key}[${e.target.join("+")}]`).join(", ") || "none"}`);
for (const e of detach) console.log(`  PATCH  ${e.key} ${e.id}: ${e.target.join("+")} → ${e.target.filter((t) => t !== target).join("+")}  (value untouched)`);
for (const e of retire) console.log(`  DELETE ${e.key} ${e.id}: ${target}-only entry`);
for (const k of MANAGED) console.log(`  CREATE ${k} → ${target} only`);
if (dryRun) process.exit(0);

// Entries that must NOT change: everything that does not cover the target, plus every unmanaged key.
const untouchedBefore = before.filter((e) => !touching.some((t) => t.id === e.id));

for (const e of detach) {
  api("PATCH", `/v9/projects/${PROJECT}/env/${e.id}`, { target: e.target.filter((t) => t !== target) });
}
for (const e of retire) api("DELETE", `/v9/projects/${PROJECT}/env/${e.id}`);

const create = (key, value, type) => api("POST", `/v10/projects/${PROJECT}/env`, { key, value, type, target: [target] });
create("DATABASE_URL", pooled, "sensitive");
create("DATABASE_URL_UNPOOLED", session, "sensitive");
create("DATABASE_CA_CERT", ca, "plain");
create("DB_POOL_MAX", poolMax, "plain");

// Verify. The point of this step is that "it said OK" is not evidence.
const after = listEntries();
const problems = [];
for (const e of untouchedBefore) {
  const now = after.find((x) => x.id === e.id);
  if (!now) problems.push(`${e.key} ${e.id} disappeared`);
  else if (now.target.join("+") !== e.target.join("+")) problems.push(`${e.key} ${e.id} targets changed ${e.target.join("+")} → ${now.target.join("+")}`);
}
for (const k of MANAGED) {
  const mine = after.filter((e) => e.key === k && e.target.includes(target));
  if (mine.length !== 1 || mine[0].target.join("+") !== target) problems.push(`${k}: expected exactly one ${target}-only entry, found ${mine.map((e) => e.target.join("+")).join(", ") || "none"}`);
}
const otherEnvs = ["production", "preview"].filter((t) => t !== target);
for (const t of otherEnvs) {
  for (const k of ["DATABASE_URL"]) {
    const was = before.some((e) => e.key === k && e.target.includes(t));
    const is = after.some((e) => e.key === k && e.target.includes(t));
    if (was && !is) problems.push(`${k} no longer exists for ${t}`);
  }
}
if (problems.length) {
  console.error("✖ verification failed:\n  " + problems.join("\n  "));
  process.exit(2);
}
console.log(`✔ ${target} now has its own DATABASE_URL, DATABASE_URL_UNPOOLED, DATABASE_CA_CERT, DB_POOL_MAX; every other entry kept its id and targets.`);
