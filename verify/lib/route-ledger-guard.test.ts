import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * T1 phase 3 — the ledger check in scripts/check-route-guards.mjs, proven to FAIL.
 *
 * A guard that has only ever passed has proved nothing: this repo has had three
 * gates that were green because they scanned an empty set. So none of these tests
 * ask the check to pass on a toy fixture. Each runs the REAL script, with the REAL
 * registry, against a COPY of the real app that has been broken in exactly one way
 * — and asserts the script exits non-zero and names the break. The first test is
 * the control: the unmodified copy must pass, otherwise every failure below would
 * be a failure for the wrong reason.
 *
 * `--root` is what lets the script look at a copy. THIS FILE MUST STAY UNDER
 * `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */

// Each case copies the app and starts a node process; the default 5 s is too tight for a slow runner.
vi.setConfig({ testTimeout: 60_000 });

const VERIFY = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = path.join(VERIFY, "scripts", "check-route-guards.mjs");
const made: string[] = [];

/** A copy of the parts of the app the script reads, minus tests and node_modules. */
function copyApp(): string {
  const root = mkdtempSync(path.join(tmpdir(), "ledger-guard-"));
  made.push(root);
  for (const dir of ["app", "lib"]) {
    cpSync(path.join(VERIFY, dir), path.join(root, dir), {
      recursive: true,
      filter: (src) => !src.includes("node_modules") && !/\.test\.tsx?$/.test(src),
    });
  }
  return root;
}

const edit = (root: string, rel: string, fn: (src: string) => string) => {
  const file = path.join(root, rel);
  const before = readFileSync(file, "utf8");
  const after = fn(before);
  expect(after, `mutation of ${rel} changed nothing — the test would prove nothing`).not.toBe(before);
  writeFileSync(file, after);
};

const add = (root: string, rel: string, src: string) => {
  const file = path.join(root, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, src);
};

function run(root: string) {
  const r = spawnSync(process.execPath, [SCRIPT, "--root", root], { encoding: "utf8" });
  return { status: r.status, out: `${r.stdout}\n${r.stderr}` };
}

afterEach(() => {
  while (made.length) {
    const d = made.pop() as string;
    if (existsSync(d)) rmSync(d, { recursive: true, force: true });
  }
});

describe("the ledger check — control", () => {
  it("passes on the unmodified app, and says what it looked at", () => {
    const r = run(copyApp());
    expect(r.out).toMatch(/ledger check: \d+ route\(s\) move value through the ledger \(\d+ pinned\)/);
    expect(r.status).toBe(0);
  });

  it("the real tree passes too (the copy is faithful)", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { encoding: "utf8", cwd: VERIFY });
    expect(r.status).toBe(0);
  });
});

describe("the ledger check — it FAILS on the bugs T1 found", () => {
  it("a pinned route whose debit is removed (the pre-T1 perps/convict)", () => {
    const root = copyApp();
    // Exactly the pre-phase-1 state: the route stakes conviction without calling the ledger-backed function.
    edit(root, "app/api/v1/perps/convict/route.ts", (s) => s.replace(/\bstakeConviction\(/g, "recordConvictionForFree("));
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("app/api/v1/perps/convict/route.ts is PINNED to the ledger");
  });

  it("the auction route without commitSealedBid / clearAndSettle (the pre-2b state)", () => {
    const root = copyApp();
    edit(root, "app/api/v1/zeitgeist/auction/route.ts", (s) =>
      s.replace(/\b(commitSealedBid|clearAndSettle)\(/g, "pool.query("),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("app/api/v1/zeitgeist/auction/route.ts is PINNED");
  });

  it("a NEW route that takes an amount and writes its own state", () => {
    const root = copyApp();
    add(
      root,
      "app/api/v1/widgets/stake/route.ts",
      `import { requireMadxRouteAuth, isAuthResponse } from "@/lib/madx-route-auth";
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "w", 5, 1000);
  if (isAuthResponse(auth)) return auth;
  const { amount } = (await req.json()) as { amount: number };
  await pool.query("INSERT INTO widget_positions (owner, amount) VALUES ($1, $2)", [auth.owner, amount]);
  return Response.json({ ok: true });
}
`,
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("app/api/v1/widgets/stake/route.ts reads a monetary field and moves nothing through the ledger");
  });

  it("a known ledger-free route that STARTS using the ledger must be taken off the list", () => {
    const root = copyApp();
    edit(
      root,
      "app/api/v1/bets/route.ts",
      (s) => `import { fill } from "@/lib/market-book";\n${s}\nvoid fill;\nvoid fill(null as never, null as never);\n`,
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("app/api/v1/bets/route.ts now calls the ledger");
    expect(r.out).toContain("remove it from KNOWN_LEDGER_FREE");
  });
});

describe("the ledger check — it cannot be blinded", () => {
  it("a renamed ledger entrypoint fails the registry rather than silently matching nothing", () => {
    const root = copyApp();
    edit(root, "lib/slot-auction-store.ts", (s) => s.replace("export async function clearAndSettle", "export async function clearAndSettle2"));
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("lib/slot-auction-store.ts no longer exports clearAndSettle()");
  });

  it("a new lib module that moves $MADx but is not registered is caught", () => {
    const root = copyApp();
    add(
      root,
      "lib/treasury-sweep.ts",
      `import { spendWithin } from "@/lib/madx-web2";
export async function sweep(c: never) { return spendWithin(c, "0xabc", 1, "sweep"); }
`,
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("lib/treasury-sweep.ts moves $MADx (spendWithin) but is not in LEDGER_ENTRYPOINTS");
  });

  it("a word that merely LOOKS like a ledger call is not one", () => {
    const root = copyApp();
    // `fill(` as Array.prototype.fill and a local `transfer(`: neither is imported from a
    // registered module, so neither may satisfy the check.
    add(
      root,
      "app/api/v1/widgets/fake/route.ts",
      `import { requireMadxRouteAuth, isAuthResponse } from "@/lib/madx-route-auth";
function transfer(a: number) { return a; }
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "w", 5, 1000);
  if (isAuthResponse(auth)) return auth;
  const { amount } = (await req.json()) as { amount: number };
  const row = new Array(3).fill(0);
  transfer(amount);
  return Response.json({ row });
}
`,
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("app/api/v1/widgets/fake/route.ts reads a monetary field");
  });

  it("a comment that mentions the ledger call does not count as calling it", () => {
    const root = copyApp();
    edit(root, "app/api/v1/shield/opt-in/route.ts", (s) =>
      s.replace(/\bchargeAndInsertShieldPosition\(/g, "// chargeAndInsertShieldPosition("),
    );
    const r = run(root);
    expect(r.status).toBe(1);
    expect(r.out).toContain("app/api/v1/shield/opt-in/route.ts is PINNED");
  });

  it("an empty tree is a failure, not a pass", () => {
    const root = mkdtempSync(path.join(tmpdir(), "ledger-guard-empty-"));
    made.push(root);
    mkdirSync(path.join(root, "app", "api"), { recursive: true });
    mkdirSync(path.join(root, "lib"), { recursive: true });
    const r = run(root);
    expect(r.status).toBe(1);
  });
});

describe("the ledger check — the escape hatches work, and only as documented", () => {
  it("`// LEDGER-FREE: reason` lets a route that reads an amount through", () => {
    const root = copyApp();
    add(
      root,
      "app/api/v1/widgets/calc/route.ts",
      `import { requireMadxRouteAuth, isAuthResponse } from "@/lib/madx-route-auth";
// LEDGER-FREE: pure calculator, nothing is recorded.
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "w", 5, 1000);
  if (isAuthResponse(auth)) return auth;
  const { amount } = (await req.json()) as { amount: number };
  return Response.json({ doubled: amount * 2 });
}
`,
    );
    expect(run(root).status).toBe(0);
  });

  it("a route that really calls a registered entrypoint passes", () => {
    const root = copyApp();
    add(
      root,
      "app/api/v1/widgets/paid/route.ts",
      `import { requireMadxRouteAuth, isAuthResponse } from "@/lib/madx-route-auth";
import { spend } from "@/lib/madx-web2";
export async function POST(req: Request) {
  const auth = requireMadxRouteAuth(req, "w", 5, 1000);
  if (isAuthResponse(auth)) return auth;
  const { amount } = (await req.json()) as { amount: number };
  await spend(null as never, auth.owner, amount, "widget");
  return Response.json({ ok: true });
}
`,
    );
    expect(run(root).status).toBe(0);
  });
});
