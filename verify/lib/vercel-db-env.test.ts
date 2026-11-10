import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * scripts/vercel-db-env.mjs rewrites a Vercel project's database variables. Its guards run BEFORE any call to the
 * Vercel API, so they can be proven without a network or a login — and they are the part that must never regress:
 * Production is refused without an explicit flag, Neon is refused as a target, and missing inputs stop it cold.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const VERIFY = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = path.join(VERIFY, "scripts", "vercel-db-env.mjs");

/**
 * SAFETY: if a guard below ever regresses, the script would go on to call the real Vercel API with these fake
 * values — and could rewrite a real project's DATABASE_URL. So the test can never reach it: PATH holds only a
 * `vercel` shim that always fails (exit 99), and every run passes `--dry-run`, which returns before any write.
 * A regressed guard therefore shows up as a failed assertion on the message, never as a changed project.
 */
const SHIM_DIR = mkdtempSync(path.join(tmpdir(), "vercel-shim-"));
writeFileSync(path.join(SHIM_DIR, "vercel.cmd"), "@echo off\r\nexit /b 99\r\n");
writeFileSync(path.join(SHIM_DIR, "vercel"), "#!/bin/sh\nexit 99\n", { mode: 0o755 });

function run(args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(process.execPath, [SCRIPT, "--dry-run", ...args], {
    encoding: "utf8",
    // A clean environment: nothing from the developer's shell may leak a real URL or a real `vercel` into the test.
    env: { PATH: `${SHIM_DIR}${path.delimiter}${path.dirname(process.execPath)}`, SystemRoot: process.env.SystemRoot ?? "", ...env },
  });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

const good = {
  DB_URL_POOLED: "postgresql://u:p@pooler.example.invalid:6543/postgres",
  DB_URL_SESSION: "postgresql://u:p@pooler.example.invalid:5432/postgres",
  DB_CA_PEM_FILE: SCRIPT, // any readable file; the guards below never reach the Vercel API
};

describe("vercel-db-env guards (they fire before any Vercel call)", () => {
  it("refuses Production without the explicit flag", () => {
    const r = run(["--target", "production"], good);
    expect(r.status).toBe(1);
    expect(r.out).toContain("refusing to change Production without --i-understand-this-is-production");
  });

  it("refuses a target that is neither preview nor production", () => {
    const r = run(["--target", "staging"], good);
    expect(r.status).toBe(1);
    expect(r.out).toContain("--target must be preview or production");
  });

  it("refuses a Neon URL: it only switches TO the new database", () => {
    const r = run([], { ...good, DB_URL_POOLED: "postgresql://u:p@ep-x.us-east-2.aws.neon.tech/db" });
    expect(r.status).toBe(1);
    expect(r.out).toContain("DB_URL_POOLED points at Neon");
  });

  it("refuses a value that is not a postgres URL", () => {
    const r = run([], { ...good, DB_URL_SESSION: "https://example.com" });
    expect(r.status).toBe(1);
    expect(r.out).toContain("DB_URL_SESSION is not a postgres URL");
  });

  it("stops when an input is missing, and names it", () => {
    const { DB_URL_SESSION: _omit, ...rest } = good;
    const r = run([], rest);
    expect(r.status).toBe(1);
    expect(r.out).toContain("DB_URL_SESSION is not set");
  });

  it("never prints a value it was given", () => {
    const r = run(["--target", "production"], { ...good, DB_URL_POOLED: "postgresql://secretuser:secretpass@h.example.invalid/db" });
    expect(r.out).not.toContain("secretpass");
    expect(r.out).not.toContain("secretuser");
  });
});
