import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { globRegex, pathspecRegex } from "../scripts/check-gates.mjs";

/**
 * `scripts/check-gates.mjs` — proven to FAIL, class by class.
 *
 * The script exists to catch gates that are green because they looked at nothing. A script like
 * that is worth only what it is shown to fail on, so each test below breaks a COPY of the real
 * repo in exactly one way and asserts the script exits non-zero and names the break. The first
 * test is the control: the unmodified copy must pass, otherwise every failure below could be a
 * failure for the wrong reason.
 *
 * The copy is built once and each test mutates then RESTORES a file (vitest runs a file's tests
 * serially), because copying the repo per test would dominate the run.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
vi.setConfig({ testTimeout: 60_000, hookTimeout: 120_000 });

const VERIFY = fileURLToPath(new URL("..", import.meta.url));
const REPO = path.resolve(VERIFY, "..");
const SCRIPT = path.join(VERIFY, "scripts", "check-gates.mjs");
const SKIP = new Set(["node_modules", ".git", ".next", ".next-dev", ".vercel", "dist", "coverage", "out", ".turbo", "broadcast", "cache"]);

/** Files whose CONTENT the gate reads. Every other file only needs to EXIST, so it is mirrored empty. */
const NEEDS_CONTENT = (rel: string) =>
  rel.startsWith(".github/workflows/") ||
  /^verify\/(package\.json|tsconfig\.json|tsconfig\.tests\.json|vitest\.config\.mts)$/.test(rel) ||
  rel.startsWith("verify/sql/") ||
  /^verify\/.*\.(test|spec)\.[a-z]+$/.test(rel);

let FIX = "";

function mirror(dir: string) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const src = path.join(dir, e.name);
    const rel = path.relative(REPO, src).split(path.sep).join("/");
    const dest = path.join(FIX, rel);
    if (e.isDirectory()) {
      mkdirSync(dest, { recursive: true });
      // contracts/lib is ~1,000 vendored files; one stub is enough for `contracts/lib/**` to match something.
      if (rel === "contracts/lib") writeFileSync(path.join(dest, "stub.sol"), "");
      else mirror(src);
    } else if (NEEDS_CONTENT(rel)) {
      copyFileSync(src, dest);
    } else {
      writeFileSync(dest, "");
    }
  }
}

beforeAll(() => {
  // The gate cares about WHICH files exist (path filters, dark code, orphan tests) far more than what is
  // in them, so mirror the whole tree's names and copy content only where it is read.
  FIX = mkdtempSync(path.join(tmpdir(), "gates-fixture-"));
  mirror(REPO);
});

afterAll(() => {
  if (FIX) rmSync(FIX, { recursive: true, force: true });
});

function run() {
  const r = spawnSync(process.execPath, [SCRIPT, "--repo", FIX], { encoding: "utf8" });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

/** Edit a file in the fixture, run the gate, and put the file back whatever happens. */
function withEdit(rel: string, edit: (src: string) => string) {
  const file = path.join(FIX, rel);
  const before = readFileSync(file, "utf8");
  // Edit on LF text and write back in the file's own line endings: a Windows checkout has CRLF workflow
  // files, and a replace written against LF would silently change nothing there.
  const CRLF = "\r\n";
  const LF = "\n";
  const crlf = before.includes(CRLF);
  const lf = before.split(CRLF).join(LF);
  const editedLf = edit(lf);
  expect(editedLf, `mutation of ${rel} changed nothing — the test would prove nothing`).not.toBe(lf);
  const after = crlf ? editedLf.split(LF).join(CRLF) : editedLf;
  writeFileSync(file, after);
  try {
    return run();
  } finally {
    writeFileSync(file, before);
  }
}

/** Create a file in the fixture, run the gate, delete it. */
function withFile(rel: string, content: string) {
  const file = path.join(FIX, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
  try {
    return run();
  } finally {
    rmSync(file, { force: true });
  }
}

describe("control", () => {
  it("passes on the unmodified repo, and reports what it looked at", () => {
    const r = run();
    expect(r.out).toMatch(/workflow-filters\s+\d+ path pattern/);
    expect(r.out).toMatch(/test-discovery\s+\d+ test file/);
    expect(r.status, r.out).toBe(0);
  });

  it("passes on the real repo too (the fixture is faithful)", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: VERIFY });
    expect(r.status).toBe(0);
  });

  it("an empty directory is a failure, not a pass", () => {
    const empty = mkdtempSync(path.join(tmpdir(), "gates-empty-"));
    try {
      const r = spawnSync(process.execPath, [SCRIPT, "--repo", empty], { encoding: "utf8" });
      expect(r.status).toBe(1);
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  });
});

describe("the two glob dialects (the Placeholder Guard bug)", () => {
  it("a git pathspec `*` crosses `/`; a GitHub Actions `*` does not", () => {
    expect(pathspecRegex("verify/*.ts").test("verify/lib/deep/x.ts")).toBe(true);
    expect(globRegex("verify/*.ts").test("verify/lib/deep/x.ts")).toBe(false);
    expect(globRegex("verify/*.ts").test("verify/x.ts")).toBe(true);
  });

  it("`**` crosses `/` in Actions globs, including zero directories", () => {
    expect(globRegex("lib/**/*.test.ts").test("lib/a.test.ts")).toBe(true);
    expect(globRegex("lib/**/*.test.ts").test("lib/x/y/a.test.ts")).toBe(true);
    expect(globRegex("lib/**/*.test.ts").test("app/a.test.ts")).toBe(false);
    expect(globRegex("verify/**").test("verify/a/b/c.ts")).toBe(true);
  });

  it("in a git pathspec `**` is just two stars — `src/**/*.sol` needs a subdirectory", () => {
    // CLAUDE.md: 'contracts/src/**/*.sol' matched 0 files because of exactly this.
    expect(pathspecRegex("contracts/src/**/*.sol").test("contracts/src/MADx.sol")).toBe(false);
    expect(pathspecRegex("contracts/src/*.sol").test("contracts/src/MADx.sol")).toBe(true);
  });

  it("escapes regex metacharacters in a pattern", () => {
    expect(globRegex("a.b+c").test("a.b+c")).toBe(true);
    expect(globRegex("a.b+c").test("aXb+c")).toBe(false);
  });
});

describe("workflow filters that match nothing", () => {
  it("a `paths:` pattern with a typo is caught", () => {
    const r = withEdit(".github/workflows/ci.yml", (s) => s.replace('- "verify/**"', '- "verfy/**"'));
    expect(r.status).toBe(1);
    expect(r.out).toContain("paths pattern 'verfy/**' matches 0 files");
  });

  it("a run-block `git ls-files` pathspec that matches nothing is caught", () => {
    const r = withEdit(".github/workflows/placeholder-guard.yml", (s) => s.replace("'contracts/src/*.sol'", "'contracts/srcc/*.sol'"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("git ls-files 'contracts/srcc/*.sol' matches 0 files");
  });
});

describe("dark code (no workflow covers it)", () => {
  it("a new top-level source directory no workflow covers fails", () => {
    const r = withFile("newservice/index.ts", "export const x = 1;\n");
    expect(r.status).toBe(1);
    expect(r.out).toContain("newservice/");
    expect(r.out).toMatch(/covered by NO workflow/);
  });

  it("a known-dark group that becomes covered must be removed from the list (a stale exemption fails)", () => {
    const r = withEdit(".github/workflows/ci.yml", (s) => s.replace('- "verify/**"', '- "verify/**"\n      - "master-maths/**"'));
    expect(r.status).toBe(1);
    expect(r.out).toContain("KNOWN_DARK lists 'master-maths' but it is now covered");
  });
});

describe("gates that cannot fail", () => {
  it("a new `continue-on-error: true` step fails the gate check", () => {
    const r = withEdit(".github/workflows/unit-tests.yml", (s) => s.replace("      - name: Run unit tests\n", "      - name: Run unit tests\n        continue-on-error: true\n"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("step 'Run unit tests' cannot fail the job");
  });

  it("a new `|| true` fails it too", () => {
    const r = withEdit(".github/workflows/unit-tests.yml", (s) => s.replace("run: npx vitest run", "run: npx vitest run || true"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("cannot fail the job");
  });

  it("`if: false` fails it", () => {
    const r = withEdit(".github/workflows/unit-tests.yml", (s) => s.replace("      - name: Run unit tests\n", "      - name: Run unit tests\n        if: false\n"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("cannot fail the job");
  });

  it("a comment that merely MENTIONS continue-on-error does not trip it", () => {
    const r = withEdit(".github/workflows/unit-tests.yml", (s) => s.replace("      - name: Run unit tests\n", "      # we do NOT use continue-on-error: true here\n      - name: Run unit tests\n"));
    expect(r.status, r.out).toBe(0);
  });

  it("a listed mask that is later removed must come off the list", () => {
    const r = withEdit(".github/workflows/ci.yml", (s) => s.replace("        continue-on-error: true\n", ""));
    expect(r.status).toBe(1);
    expect(r.out).toContain("KNOWN_MASKED lists 'ci.yml::Lint (eslint)'");
  });
});

describe("dependency skew (CI ran vitest 3.x while the app locked 5.x)", () => {
  it("an install over the locked tree is caught", () => {
    const r = withEdit(".github/workflows/unit-tests.yml", (s) =>
      s.replace("      - name: Run unit tests\n", "      - name: Install vitest\n        run: npm install --no-save vitest@^3.2.4\n      - name: Run unit tests\n"),
    );
    expect(r.status).toBe(1);
    expect(r.out).toContain("installs packages after (or instead of) the locked tree");
  });

  it("CI on a different Node than engines.node is caught", () => {
    const r = withEdit(".github/workflows/ci.yml", (s) => s.replace("node-version: 24", "node-version: 22"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("CI uses Node 22");
  });
});

describe("tests that never run, or never assert", () => {
  it("a test file outside vitest's include is caught — it would never run", () => {
    const r = withFile("verify/components/orphan.test.tsx", 'import { it, expect } from "vitest";\nit("x", () => { expect(1).toBe(1); });\n');
    expect(r.status).toBe(1);
    expect(r.out).toContain("verify/components/orphan.test.tsx is a test file vitest will NEVER run");
  });

  it("an emptied `include` is caught", () => {
    const r = withEdit("verify/vitest.config.mts", (s) => s.replace(/include:\s*\[[^\]]*\]/, "include: []"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("has no `include`");
  });

  it("a self-comparing assertion is caught, and the marker lets an intentional one through", () => {
    const bad = withFile("verify/lib/zz-self.test.ts", 'import { it, expect } from "vitest";\nconst f = (n: number) => n * 2;\nit("x", () => {\n  expect(f(2)).toBe(f(2));\n});\n');
    expect(bad.status).toBe(1);
    expect(bad.out).toContain("self-comparing assertion");
    const ok = withFile("verify/lib/zz-self.test.ts", 'import { it, expect } from "vitest";\nconst f = (n: number) => n * 2;\nit("x", () => {\n  expect(f(2)).toBe(4);\n  expect(f(2)).toBe(f(2)); // SELF-COMPARE-OK: pinned above\n});\n');
    expect(ok.status, ok.out).toBe(0);
  });

  it("a committed .only or .skip is caught (.only silently skips every other test in the file)", () => {
    const only = withFile("verify/lib/zz-only.test.ts", 'import { it, expect } from "vitest";\nit.only("x", () => { expect(1).toBe(1); });\n');
    expect(only.status).toBe(1);
    expect(only.out).toContain("committed skip/only/todo");
    const skip = withFile("verify/lib/zz-skip.test.ts", 'import { describe, expect, it } from "vitest";\ndescribe.skip("x", () => { it("y", () => { expect(1).toBe(1); }); });\n');
    expect(skip.status).toBe(1);
  });

  it("but a conditional `skipIf` (the opt-in live tests) is allowed", () => {
    const r = withFile("verify/lib/zz-skipif.test.ts", 'import { describe, expect, it } from "vitest";\ndescribe.skipIf(true)("x", () => { it("y", () => { expect(1).toBe(1); }); });\n');
    expect(r.status).toBe(0);
  });

  it("a test with no assertion is caught", () => {
    const r = withFile("verify/lib/zz-vacuous.test.ts", 'import { it } from "vitest";\nit("does a thing", () => {\n  const x = 1 + 1;\n  void x;\n});\n');
    expect(r.status).toBe(1);
    expect(r.out).toContain("test body has no assertion");
  });
});

describe("tests excluded from tsc must be type-checked somewhere", () => {
  it("dropping the CI step is caught", () => {
    const r = withEdit(".github/workflows/ci.yml", (s) => s.replace("npm run type-check:tests", "echo skipped"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("ci.yml never runs `type-check:tests`");
  });

  it("dropping the script is caught", () => {
    const r = withEdit("verify/package.json", (s) => s.replace(/\s*"type-check:tests":[^\n]*\n/, "\n"));
    expect(r.status).toBe(1);
    expect(r.out).toContain("no `type-check:tests` script");
  });

  it("a tests tsconfig that excludes tests defeats the point", () => {
    const r = withEdit("verify/tsconfig.tests.json", (s) => s.replace('".next-dev"', '".next-dev",\n    "**/*.test.ts"'));
    expect(r.status).toBe(1);
    expect(r.out).toContain("tsconfig.tests.json also excludes tests");
  });
});

describe("migrations", () => {
  it("a duplicate number is caught", () => {
    const r = withFile("verify/sql/0026_dupe.sql", "CREATE TABLE IF NOT EXISTS dupe (id int);\n");
    expect(r.status).toBe(1);
    expect(r.out).toContain("two migrations are numbered 0026");
  });

  it("a gap in the numbering is caught", () => {
    const r = withFile("verify/sql/0030_gap.sql", "CREATE TABLE IF NOT EXISTS gap (id int);\n");
    expect(r.status).toBe(1);
    expect(r.out).toContain("jumps from 0026 to 0030");
  });

  it("a letter-suffixed follow-up (0026 then 0026b) is allowed — it sorts right after its base", () => {
    const r = withFile("verify/sql/0026b_follow_up.sql", "REVOKE ALL ON SCHEMA public FROM PUBLIC;\n");
    expect(r.status, r.out).toBe(0);
  });

  it("but a suffixed migration may not be repeated, or skip its base", () => {
    const base = withFile("verify/sql/0026b_one.sql", "SELECT 1;\n");
    expect(base.status).toBe(0);
    // two 0026b files
    const dir = path.join(FIX, "verify", "sql");
    writeFileSync(path.join(dir, "0026b_one.sql"), "SELECT 1;\n");
    try {
      const r = withFile("verify/sql/0026b_two.sql", "SELECT 2;\n");
      expect(r.status).toBe(1);
      expect(r.out).toContain("two migrations are numbered 0026b");
    } finally {
      rmSync(path.join(dir, "0026b_one.sql"), { force: true });
    }
    // a suffixed file whose base does not exist (0030b with no 0030)
    const orphan = withFile("verify/sql/0030b_orphan.sql", "SELECT 1;\n");
    expect(orphan.status).toBe(1);
    expect(orphan.out).toContain("jumps from 0026 to 0030b");
  });

  it("a badly named migration is caught", () => {
    const r = withFile("verify/sql/add_things.sql", "CREATE TABLE IF NOT EXISTS things (id int);\n");
    expect(r.status).toBe(1);
    expect(r.out).toContain("does not match NNNN_snake_case.sql");
  });

  it("non-idempotent DDL is caught, and DDL that merely appears in a comment is not", () => {
    const bad = withFile("verify/sql/0027_bad.sql", "CREATE TABLE widgets (id int);\n");
    expect(bad.status).toBe(1);
    expect(bad.out).toContain("non-idempotent DDL");
    const ok = withFile("verify/sql/0027_ok.sql", "-- CREATE TABLE widgets (id int);\nCREATE TABLE IF NOT EXISTS widgets (id int);\n");
    expect(ok.status, ok.out).toBe(0);
  });
});
