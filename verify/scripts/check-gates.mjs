#!/usr/bin/env node
/**
 * Gate integrity — checks that the platform's own gates cannot pass by checking nothing.
 *
 * This repo's recurring failure is not a bug that a gate misses; it is a gate that is GREEN
 * BECAUSE IT LOOKED AT NOTHING. Placeholder Guard's pathspecs matched 0 files. `contracts/script/**`
 * sat outside `foundry.yml`'s filter. `master-maths/` is matched by no workflow at all. The test
 * runner in CI was silently downgraded from the locked 5.x to 3.x. `schema:verify` said "verified"
 * for a database missing 12 of 26 migrations. Test files were excluded from type-checking. Each was
 * found by accident, after the fact. This script finds that CLASS, on every run, from the files:
 *
 *   workflow-filters   every `paths:` pattern, and every `git ls-files`/`git grep --` pathspec in a
 *                      workflow, matches at least one file (the Placeholder Guard bug)
 *   dark-code          code that NO workflow's path filter covers is enumerated; new dark code fails
 *   masked-gates       `continue-on-error`, `|| true`, `if: false`… are enumerated with a reason
 *   dependency-skew    a workflow must not `npm install` over the locked tree (the vitest downgrade),
 *                      and CI's Node must satisfy `engines.node`
 *   test-discovery     every test file is matched by vitest's `include`, and there is at least one
 *   test-hygiene       no self-comparing assertion, no committed `.only`/`.skip`, no test without an
 *                      assertion (each overridable with an explicit marker)
 *   typecheck-coverage tests are excluded from `tsc`, so something else must type-check them
 *   migrations         numbered, unique, contiguous, idempotent DDL
 *
 * Three of these are RATCHETS (dark-code, masked-gates, dependency installs): the known debt is
 * listed below with a reason, reported every run, and cannot grow. A listed entry that no longer
 * applies FAILS until it is removed — a stale exemption quietly covering something it no longer
 * matches is the same defect as the one this file exists to catch.
 *
 * Dependency-free on purpose (like check-route-guards.mjs): it can run before `npm ci`.
 * `--repo <dir>` points it at another copy of the repo (lib/platform-gates.test.ts mutates a copy and
 * asserts this script fails on it). Run with no argument from `verify/`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = (() => {
  const i = process.argv.indexOf("--repo");
  return i !== -1 && process.argv[i + 1]
    ? path.resolve(process.argv[i + 1])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
})();
const VERIFY = path.join(REPO, "verify");

/* ───────────────────────── the ratchets: known debt, each with a reason ───────────────────────── */

/**
 * Code that no workflow's `paths:` filter covers, grouped by directory (two levels under
 * `contracts/` and `verify/`, one elsewhere). Editing it triggers no CI at all.
 */
const KNOWN_DARK = new Map([
  ["master-maths", "The Kotlin Android client builds in no workflow (MASTER Workstream C5). Do C5 first."],
  ["contracts/madhat-core", "Holds src/tokens/MADxToken.sol, the token source. foundry.yml's filter covers contracts/src, test, script and lib, not this."],
  ["contracts", "Loose files directly under contracts/ (config, scripts) — no workflow path covers them."],
  ["contracts/evolution", "Solidity under contracts/evolution is outside every filter."],
  ["app", "Root-level duplicate of the app, outside Vercel's `verify/` root; deploys nothing (MASTER TD12)."],
  ["lib", "Root-level duplicate of lib/, outside Vercel's `verify/` root; deploys nothing (MASTER TD12)."],
  ["scripts", "Root-level helper scripts; nothing runs them in CI."],
  ["next.config.mjs", "Root-level config for the root-level duplicate app; deploys nothing (MASTER TD12)."],
]);

/** Steps that cannot fail the job. Key: `<workflow file>::<step name>`. */
const KNOWN_MASKED = new Map([
  ["ci.yml::Lint (eslint)", "Report-only until eslint-config-next / ESLint 9 land (MASTER TD5, §4)."],
  ["dependency-review.yml::Dependency review", "Report-only until Dependency graph is enabled for the repo."],
  ["foundry.yml::Slither", "Report-only: ~135 untriaged findings (MASTER §1). Green means 'ran'."],
  [
    "agentic-compile.yml::Fail if compiled output is out of date",
    "`git add -N … || true` is deliberate (registers brand-new .lock.yml files so they show as a diff); the lock files themselves are still ungenerated (MASTER §4).",
  ],
]);

/** `npm install`-style commands allowed in a workflow. Key: `<workflow file>::<step name>`. */
const KNOWN_INSTALLS = new Map([
  ["vercel-deploy.yml::Install the Vercel CLI", "A global CLI, pinned to a major (`vercel@65`) — not a dependency of the app."],
]);

/* ───────────────────────────────── file walking and globs ───────────────────────────────── */

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", ".next-dev", ".vercel", "dist", "coverage", "out", ".turbo", "broadcast", "cache"]);

async function walk(dir, out = []) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else out.push(path.relative(REPO, full).split(path.sep).join("/"));
  }
  return out;
}

const escapeRe = (c) => c.replace(/[.+^${}()|[\]\\]/g, "\\$&");

/** GitHub Actions / vitest globs: `*` stops at `/`, `**` crosses it, `?` is one non-slash char. */
export function globRegex(p) {
  let re = "";
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === "*" && p[i + 1] === "*") {
      re += ".*";
      i += 1;
      if (p[i + 1] === "/") i += 1;
    } else if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else re += escapeRe(c);
  }
  return new RegExp(`^${re}$`);
}

/**
 * git pathspecs WITHOUT glob magic: `*` already crosses `/`, and `**` has no special meaning (it is
 * just two stars). CLAUDE.md records the trap: 'contracts/src/**\/*.sol' matched 0 files because the
 * `**` was read as a path component.
 */
export function pathspecRegex(p) {
  let re = "";
  for (const c of p) re += c === "*" ? ".*" : c === "?" ? "." : escapeRe(c);
  return new RegExp(`^${re}$`);
}

const strip = (line) => line.replace(/\s+#.*$/, "");

/* ───────────────────────────────────── workflow parsing ───────────────────────────────────── */

/** Every `paths:` list entry in a workflow (push and pull_request both). */
function workflowPaths(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^(\s*)paths:\s*$/.exec(lines[i]);
    if (!m) continue;
    const indent = m[1].length;
    for (let j = i + 1; j < lines.length; j++) {
      if (!lines[j].trim() || /^\s*#/.test(lines[j])) continue;
      const item = /^(\s*)-\s*["']?([^"'#]+?)["']?\s*(?:#.*)?$/.exec(lines[j]);
      if (!item || item[1].length <= indent) break;
      out.push({ pattern: item[2], line: j + 1 });
    }
  }
  return out;
}

/** Pathspecs given to `git ls-files` and after `--` in `git grep`, in `run:` text. */
function runPathspecs(text) {
  const joined = text.replace(/\\\r?\n/g, " ");
  const out = [];
  for (const line of joined.split(/\r?\n/)) {
    if (/^\s*#/.test(line)) continue;
    const ls = /git\s+ls-files\b(.*)$/.exec(line);
    if (ls) for (const m of ls[1].matchAll(/'([^']+)'|"([^"]+)"/g)) out.push({ spec: m[1] ?? m[2], via: "git ls-files" });
    const grep = /git\s+grep\b.*?\s--\s+(.*)$/.exec(line);
    if (grep) for (const m of grep[1].matchAll(/'([^']+)'|"([^"]+)"/g)) out.push({ spec: m[1] ?? m[2], via: "git grep --" });
  }
  return out;
}

/** The step a given (0-based) line belongs to: `{ name, startLine }`. */
function stepOf(lines, idx) {
  const indent = (s) => s.match(/^\s*/)[0].length;
  const here = indent(lines[idx]);
  let s = idx;
  while (s >= 0) {
    if (/^\s*-\s+\S/.test(lines[s]) && indent(lines[s]) < here) break;
    s -= 1;
  }
  if (s < 0) return { name: "(job)", startLine: idx + 1 };
  const base = indent(lines[s]);
  for (let k = s; k < lines.length; k++) {
    if (k > s && lines[k].trim() && indent(lines[k]) <= base) break;
    const nm = /^\s*(?:-\s+)?name:\s*(.+?)\s*$/.exec(lines[k]);
    if (nm) return { name: nm[1].replace(/^["']|["']$/g, ""), startLine: s + 1 };
  }
  const uses = /^\s*-\s+uses:\s*(\S+)/.exec(lines[s]);
  return { name: uses ? uses[1] : "(unnamed step)", startLine: s + 1 };
}

/* ──────────────────────────────────────── the checks ──────────────────────────────────────── */

const problems = [];
const notes = [];
const stats = {};
const fail = (check, msg) => problems.push(`[${check}] ${msg}`);

async function main() {
  const files = await walk(REPO);
  if (files.length === 0) {
    console.error(`❌ gate check: found 0 files under ${REPO}. The walk matched nothing, so a pass would mean nothing.`);
    process.exitCode = 1;
    return;
  }
  const wfDir = path.join(REPO, ".github", "workflows");
  const wfNames = files.filter((f) => /^\.github\/workflows\/[^/]+\.yml$/.test(f)).map((f) => f.split("/").pop());
  const workflows = [];
  for (const name of wfNames) {
    const text = await readFile(path.join(wfDir, name), "utf8");
    workflows.push({ name, text, lines: text.split(/\r?\n/) });
  }
  if (workflows.length === 0) fail("workflow-filters", `no workflows found under ${wfDir}`);

  /* ── workflow-filters + dark-code ── */
  const allPatterns = [];
  let pathspecCount = 0;
  for (const wf of workflows) {
    for (const p of workflowPaths(wf.lines)) {
      allPatterns.push({ wf: wf.name, ...p, re: globRegex(p.pattern) });
    }
    for (const { spec, via } of runPathspecs(wf.text)) {
      pathspecCount += 1;
      const re = pathspecRegex(spec);
      if (!files.some((f) => re.test(f))) {
        fail("workflow-filters", `${wf.name}: ${via} '${spec}' matches 0 files — a scan over nothing passes by construction`);
      }
    }
  }
  const seen = new Set();
  for (const p of allPatterns) {
    const key = `${p.wf}|${p.pattern}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!files.some((f) => p.re.test(f))) {
      fail("workflow-filters", `${p.wf}:${p.line}: paths pattern '${p.pattern}' matches 0 files`);
    }
  }
  stats["workflow-filters"] = `${seen.size} path pattern(s) and ${pathspecCount} run-block pathspec(s) across ${workflows.length} workflow(s)`;

  const CODE = /\.(ts|tsx|mjs|cjs|js|sol|kt|py|sql)$/;
  const NOT_CODE = /^(docs|OUTPUTS|PROJECTS|TEMPLATES|ABOUT-ME|\.claude|\.agents)\/|^contracts\/lib\//;
  const dark = new Map();
  for (const f of files) {
    if (!CODE.test(f) || NOT_CODE.test(f)) continue;
    if (allPatterns.some((p) => p.re.test(f))) continue;
    const segs = f.split("/");
    const key = (segs[0] === "contracts" || segs[0] === "verify") && segs.length > 2 ? segs.slice(0, 2).join("/") : segs[0];
    const g = dark.get(key) ?? { n: 0, example: f };
    g.n += 1;
    dark.set(key, g);
  }
  for (const [key, g] of dark) {
    if (!KNOWN_DARK.has(key)) {
      fail("dark-code", `${key}/ — ${g.n} code file(s) (e.g. ${g.example}) are covered by NO workflow's path filter; a change there triggers no CI. Add it to a workflow's paths, or list it in KNOWN_DARK with a reason.`);
    }
  }
  for (const key of KNOWN_DARK.keys()) {
    if (!dark.has(key)) fail("dark-code", `KNOWN_DARK lists '${key}' but it is now covered (or gone) — remove the entry`);
  }
  stats["dark-code"] = `${dark.size} uncovered group(s), all enumerated (${[...dark.values()].reduce((s, g) => s + g.n, 0)} file(s))`;
  if (dark.size) {
    notes.push(
      `ℹ️  code no workflow covers (tracked, not failing; NEW groups do fail):\n` +
        [...dark].map(([k, g]) => `   ${k}  (${g.n} file(s)) — ${KNOWN_DARK.get(k) ?? "UNLISTED"}`).join("\n"),
    );
  }

  /* ── masked-gates + dependency-skew ── */
  const masked = new Map();
  const installs = new Map();
  const MASK = [/\bcontinue-on-error:\s*true\b/, /\|\|\s*true\b/, /\|\|\s*exit\s+0\b/, /^\s*(?:-\s+)?if:\s*(?:\$\{\{\s*)?false\b/, /\bset\s+\+e\b/];
  for (const wf of workflows) {
    wf.lines.forEach((raw, i) => {
      if (/^\s*#/.test(raw)) return;
      const line = strip(raw);
      const step = stepOf(wf.lines, i);
      if (MASK.some((re) => re.test(line))) masked.set(`${wf.name}::${step.name}`, `${wf.name}:${i + 1}`);
      if (/\bnpm\s+(?:i|install|add)\b/.test(line) || /--no-save\b/.test(line)) installs.set(`${wf.name}::${step.name}`, `${wf.name}:${i + 1}`);
    });
  }
  for (const [key, where] of masked) {
    if (!KNOWN_MASKED.has(key)) fail("masked-gates", `${where}: step '${key.split("::")[1]}' cannot fail the job (continue-on-error / || true / if: false). Remove the mask, or list '${key}' in KNOWN_MASKED with a reason.`);
  }
  for (const key of KNOWN_MASKED.keys()) {
    if (!masked.has(key)) fail("masked-gates", `KNOWN_MASKED lists '${key}' but no such masked step exists any more — remove the entry`);
  }
  for (const [key, where] of installs) {
    if (!KNOWN_INSTALLS.has(key)) {
      fail("dependency-skew", `${where}: step '${key.split("::")[1]}' installs packages after (or instead of) the locked tree. CI must run the versions package-lock.json pins — this is how CI ran vitest 3.x while the app locked 5.x.`);
    }
  }
  for (const key of KNOWN_INSTALLS.keys()) {
    if (!installs.has(key)) fail("dependency-skew", `KNOWN_INSTALLS lists '${key}' but no such step exists any more — remove the entry`);
  }
  stats["masked-gates"] = `${masked.size} masked step(s), all enumerated`;
  if (masked.size) notes.push(`ℹ️  steps that cannot fail their job (tracked, not failing; NEW ones do fail):\n` + [...masked.keys()].map((k) => `   ${k} — ${KNOWN_MASKED.get(k) ?? "UNLISTED"}`).join("\n"));

  // Node: CI must run a Node that satisfies engines.node.
  let pkg = null;
  try {
    pkg = JSON.parse(await readFile(path.join(VERIFY, "package.json"), "utf8"));
  } catch (e) {
    fail("dependency-skew", `cannot read verify/package.json: ${e.message}`);
  }
  const engine = pkg?.engines?.node;
  const engineMajor = engine ? /(\d+)/.exec(engine)?.[1] : null;
  const nodeVersions = [];
  for (const wf of workflows) {
    wf.lines.forEach((raw, i) => {
      const m = /^\s*(?:-\s+)?node-version:\s*["']?([\w.x-]+)["']?/.exec(raw);
      if (m && !/^\s*#/.test(raw)) nodeVersions.push({ wf: wf.name, v: m[1], line: i + 1 });
    });
  }
  if (engineMajor) {
    for (const n of nodeVersions) {
      const major = /(\d+)/.exec(n.v)?.[1];
      if (major !== engineMajor) fail("dependency-skew", `${n.wf}:${n.line}: CI uses Node ${n.v} but verify/package.json engines.node is '${engine}' — CI would pass on a runtime production does not run`);
    }
  }
  stats["dependency-skew"] = `${installs.size} install step(s) checked, ${nodeVersions.length} node-version pin(s) vs engines '${engine ?? "unset"}'`;

  /* ── test-discovery + test-hygiene ── */
  let include = [];
  let exclude = [];
  try {
    const cfg = await readFile(path.join(VERIFY, "vitest.config.mts"), "utf8");
    const arr = (key) => {
      const m = new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`).exec(cfg);
      return m ? [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]) : [];
    };
    include = arr("include");
    exclude = arr("exclude");
  } catch (e) {
    fail("test-discovery", `cannot read verify/vitest.config.mts: ${e.message}`);
  }
  if (include.length === 0) fail("test-discovery", "vitest.config.mts has no `include` — vitest's default would collect a different set than this repo's convention");
  const incRe = include.map((p) => globRegex(p));
  const excRe = exclude.map((p) => globRegex(p));
  const TESTFILE = /\.(test|spec)\.(ts|tsx|js|jsx|mjs|mts|cts)$/;
  const tests = files.filter((f) => f.startsWith("verify/") && TESTFILE.test(f));
  const rel = (f) => f.slice("verify/".length);
  const discovered = tests.filter((f) => incRe.some((re) => re.test(rel(f))) && !excRe.some((re) => re.test(rel(f))));
  const orphans = tests.filter((f) => !discovered.includes(f));
  for (const f of orphans) fail("test-discovery", `${f} is a test file vitest will NEVER run (include: ${include.join(", ")}) — move it under lib/ or widen the include`);
  if (discovered.length === 0) fail("test-discovery", "vitest would discover 0 test files — a green run would mean nothing");
  stats["test-discovery"] = `${discovered.length} test file(s) discovered, ${orphans.length} orphan(s)`;

  let selfCompare = 0;
  let vacuous = 0;
  for (const f of discovered.filter((x) => x.endsWith(".ts"))) {
    const src = await readFile(path.join(REPO, f), "utf8");
    const lines = src.split(/\r?\n/);
    lines.forEach((l, i) => {
      if (/\b(?:it|test|describe)\.(?:only|skip|todo)\b|\bx(?:it|describe)\(|\bf(?:it|describe)\(/.test(l) && !/\.skipIf\(/.test(l)) {
        fail("test-hygiene", `${f}:${i + 1}: committed skip/only/todo — ${l.trim().slice(0, 70)}`);
      }
      const m = /expect\((.+)\)\.(?:toBe|toEqual|toStrictEqual)\((.+)\);?\s*(?:\/\/.*)?$/.exec(l);
      if (m && m[1].replace(/\s+/g, "") === m[2].replace(/\s+/g, "") && !/SELF-COMPARE-OK/.test(l)) {
        selfCompare += 1;
        fail("test-hygiene", `${f}:${i + 1}: self-comparing assertion — it passes for ANY deterministic function and pins no value. Compare to a literal, or mark the line // SELF-COMPARE-OK: <why>`);
      }
    });
    const re = /\b(?:it|test)(?:\.each\([^)]*\))?\(\s*(?:"[^"\n]*"|'[^'\n]*'|`[^`]*`)\s*,\s*(?:async\s*)?\(?[^)]*\)?\s*=>\s*\{/g;
    let m;
    while ((m = re.exec(src))) {
      let depth = 1;
      let j = re.lastIndex;
      while (j < src.length && depth > 0) {
        if (src[j] === "{") depth += 1;
        else if (src[j] === "}") depth -= 1;
        j += 1;
      }
      const body = src.slice(re.lastIndex, j);
      if (!/\bexpect\b|\bassert\b|toThrow|\.rejects|\.resolves|expectTypeOf|NO-ASSERT-OK/.test(body)) {
        vacuous += 1;
        fail("test-hygiene", `${f}:${src.slice(0, m.index).split("\n").length}: test body has no assertion — it passes whatever the code does (mark // NO-ASSERT-OK: <why> if intentional)`);
      }
    }
  }
  stats["test-hygiene"] = `${discovered.length} file(s) scanned: ${selfCompare} self-comparing, ${vacuous} assertion-free`;

  /* ── typecheck-coverage ── */
  try {
    const tsconfig = await readFile(path.join(VERIFY, "tsconfig.json"), "utf8");
    if (/"exclude"\s*:\s*\[[^\]]*test/.test(tsconfig)) {
      const checks = [];
      let testsCfg = "";
      try {
        testsCfg = await readFile(path.join(VERIFY, "tsconfig.tests.json"), "utf8");
      } catch {
        checks.push("verify/tsconfig.tests.json does not exist");
      }
      if (testsCfg && /"exclude"\s*:\s*\[[^\]]*test/.test(testsCfg)) checks.push("tsconfig.tests.json also excludes tests");
      if (!pkg?.scripts?.["type-check:tests"]) checks.push("package.json has no `type-check:tests` script");
      const ci = workflows.find((w) => w.name === "ci.yml");
      if (!ci || !/\btype-check:tests\b/.test(ci.lines.filter((l) => !/^\s*#/.test(l)).join("\n"))) checks.push("ci.yml never runs `type-check:tests`");
      for (const c of checks) fail("typecheck-coverage", `tsconfig.json excludes test files, so something else must type-check them — but ${c}. A type error in a test passes every gate.`);
      stats["typecheck-coverage"] = checks.length ? `${checks.length} gap(s)` : "tests are excluded from tsc and type-checked by `type-check:tests` in ci.yml";
    } else {
      stats["typecheck-coverage"] = "tests are included in the main tsc project";
    }
  } catch (e) {
    fail("typecheck-coverage", `cannot read verify/tsconfig.json: ${e.message}`);
  }

  /* ── migrations ── */
  const sqlFiles = files.filter((f) => /^verify\/sql\/[^/]+\.sql$/.test(f)).map((f) => f.split("/").pop()).sort();
  if (sqlFiles.length === 0) fail("migrations", "no verify/sql/*.sql files found");
  const nums = [];
  for (const f of sqlFiles) {
    const m = /^(\d{4})_[a-z0-9_]+\.sql$/.exec(f);
    if (!m) fail("migrations", `verify/sql/${f} does not match NNNN_snake_case.sql — the runner sorts by name, so a stray name runs in the wrong place`);
    else nums.push(Number(m[1]));
  }
  nums.forEach((n, i) => {
    if (i > 0 && n === nums[i - 1]) fail("migrations", `two migrations are numbered ${String(n).padStart(4, "0")}`);
    else if (i > 0 && n !== nums[i - 1] + 1) fail("migrations", `migration numbering jumps from ${String(nums[i - 1]).padStart(4, "0")} to ${String(n).padStart(4, "0")}`);
  });
  if (nums.length && nums[0] !== 1) fail("migrations", `migrations start at ${String(nums[0]).padStart(4, "0")}, not 0001`);
  let nonIdempotent = 0;
  for (const f of sqlFiles) {
    const sql = (await readFile(path.join(VERIFY, "sql", f), "utf8")).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");
    for (const m of sql.matchAll(/^\s*(CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\s+(?!IF\s+NOT\s+EXISTS)[^\n(]*|ALTER\s+TABLE\s+\S+\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)[^\n]*)/gim)) {
      nonIdempotent += 1;
      fail("migrations", `verify/sql/${f}: non-idempotent DDL (\`${m[1].replace(/\s+/g, " ").trim().slice(0, 60)}\`) — migrate.mjs promises every migration is safe to re-run`);
    }
  }
  stats["migrations"] = `${sqlFiles.length} file(s), numbering ${nums.length ? `${String(nums[0]).padStart(4, "0")}–${String(nums[nums.length - 1]).padStart(4, "0")}` : "n/a"}, ${nonIdempotent} non-idempotent statement(s)`;

  /* ── report ── */
  for (const n of notes) console.log(n + "\n");
  if (problems.length === 0) {
    console.log("✅ gate check:");
    for (const [k, v] of Object.entries(stats)) console.log(`   ${k.padEnd(19)} ${v}`);
    return;
  }
  console.warn(`⚠️  gate check: ${problems.length} problem(s):\n`);
  for (const p of problems) console.warn(`   ${p}`);
  console.warn("\nLooked at:");
  for (const [k, v] of Object.entries(stats)) console.warn(`   ${k.padEnd(19)} ${v}`);
  process.exitCode = 1;
}

// Run only when executed directly, so the glob helpers above can be imported by their unit test.
if (path.resolve(process.argv[1] ?? "") === path.resolve(fileURLToPath(import.meta.url))) {
  main().catch((err) => {
    console.error("gate check crashed:", err);
    process.exitCode = 1;
  });
}
