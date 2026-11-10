import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * scripts/neon-to-supabase.mjs moves data between two real databases, so its guards must hold BEFORE any
 * connection is opened. Each case below fails inside the script's own argument checks; `PG_MODULE` points the
 * driver import at a module that does not exist, so a regressed guard fails the assertion on the message
 * instead of ever connecting to anything.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const VERIFY = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = path.join(VERIFY, "scripts", "neon-to-supabase.mjs");

const NEON = "postgresql://u:p@ep-x-123.us-east-2.aws.neon.tech/neondb";
const SUPA = "postgresql://postgres.ref:p@aws-0-us-east-1.pooler.supabase.com:6543/postgres";

function run(env: Record<string, string>, args: string[] = []) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    env: { PATH: path.dirname(process.execPath), PG_MODULE: "pg-that-does-not-exist-on-purpose", NODE_ENV: "test", ...env },
  });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

describe("neon-to-supabase guards (they fire before any connection)", () => {
  it("needs both URLs", () => {
    expect(run({ SUPABASE_URL: SUPA }).out).toContain("NEON_URL is not set");
    expect(run({ NEON_URL: NEON }).out).toContain("SUPABASE_URL is not set");
  });

  it("refuses non-postgres values", () => {
    expect(run({ NEON_URL: "https://x", SUPABASE_URL: SUPA }).out).toContain("NEON_URL is not a postgres URL");
    expect(run({ NEON_URL: NEON, SUPABASE_URL: "mysql://x" }).out).toContain("SUPABASE_URL is not a postgres URL");
  });

  it("refuses the same database on both sides", () => {
    const r = run({ NEON_URL: NEON, SUPABASE_URL: NEON });
    expect(r.status).toBe(1);
    expect(r.out).toContain("are the same database");
  });

  it("refuses a source that does not look like Neon, so it cannot be run backwards", () => {
    const r = run({ NEON_URL: SUPA, SUPABASE_URL: "postgresql://u:p@other.example.invalid/db" });
    expect(r.status).toBe(1);
    expect(r.out).toContain("does not look like a Neon host");
  });

  it("refuses a Neon target", () => {
    const r = run({ NEON_URL: NEON, SUPABASE_URL: "postgresql://u:p@ep-y-456.us-east-2.aws.neon.tech/neondb" });
    expect(r.status).toBe(1);
    expect(r.out).toContain("SUPABASE_URL points at Neon");
  });

  it("with valid inputs it reaches the driver import — and only then stops (no connection is made in this test)", () => {
    const r = run({ NEON_URL: NEON, SUPABASE_URL: SUPA });
    expect(r.status).not.toBe(0);
    expect(r.out).not.toContain("are the same database");
    expect(r.out).toMatch(/pg-that-does-not-exist-on-purpose|Cannot find (package|module)/);
  });

  it("never prints a credential it was given", () => {
    const r = run({ NEON_URL: "postgresql://realuser:realsecret@ep-z.neon.tech/db", SUPABASE_URL: "postgresql://realuser:realsecret@ep-z.neon.tech/db" });
    expect(r.out).not.toContain("realsecret");
  });
});
