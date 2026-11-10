import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * scripts/signed-commit.mjs writes to a real GitHub branch, so its guards must hold before it ever calls `gh`.
 * Every spawn below uses a `gh` shim that always fails (exit 99), so a regressed guard fails an assertion on the
 * message instead of touching a repository.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const VERIFY = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = path.join(VERIFY, "scripts", "signed-commit.mjs");

const SHIM_DIR = mkdtempSync(path.join(tmpdir(), "gh-shim-"));
writeFileSync(path.join(SHIM_DIR, "gh.cmd"), "@echo off\r\nexit /b 99\r\n");
writeFileSync(path.join(SHIM_DIR, "gh"), "#!/bin/sh\nexit 99\n", { mode: 0o755 });

function run(args: string[]) {
  const r = spawnSync(process.execPath, [SCRIPT, ...args], {
    encoding: "utf8",
    cwd: VERIFY,
    env: { PATH: `${SHIM_DIR}${path.delimiter}${path.dirname(process.execPath)}`, SystemRoot: process.env.SystemRoot ?? "", NODE_ENV: "test" },
  });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

describe("signed-commit guards (they fire before any GitHub call)", () => {
  it("needs a branch and a message", () => {
    expect(run(["--message", "m", "--allow-empty"]).out).toContain("--branch is required");
    expect(run(["--branch", "b", "--allow-empty"]).out).toContain("--message is required");
  });

  it("refuses to commit straight to main or master", () => {
    for (const b of ["main", "master"]) {
      const r = run(["--branch", b, "--message", "m", "--allow-empty"]);
      expect(r.status).toBe(1);
      expect(r.out).toContain("refusing to commit straight to main");
    }
  });

  it("refuses an empty commit unless it was asked for", () => {
    const r = run(["--branch", "claude/x", "--message", "m"]);
    expect(r.status).toBe(1);
    expect(r.out).toContain("no files given");
  });

  it("rejects an unknown option", () => {
    const r = run(["--branch", "claude/x", "--message", "m", "--force"]);
    expect(r.status).toBe(1);
    expect(r.out).toContain("unknown option --force");
  });

  it("only ever adds a commit on top: it never pushes with git and never moves a ref", () => {
    const src = readFileSync(SCRIPT, "utf8");
    expect(src.includes('git("push"')).toBe(false);
    expect(src.includes("updateRef")).toBe(false);
    expect(src.includes("createCommitOnBranch")).toBe(true);
  });
});
