import { describe, expect, it } from "vitest";
import type { Pool } from "pg";
import { assertOutcome, initialState, type ResolutionState } from "./market-resolution";
import { createMarketWithSpec, getSpec, saveSpec, sweepDue, transition } from "./resolution-store";
import { buildSpec, hashSpec, specId, type BuildInput, type ResolutionSpec } from "./resolution-spec";

/**
 * The store's contract with the database, checked against a recording fake pool: what it asks for, in what order, and
 * that a refusal or an error rolls back and writes nothing. The SQL itself was run against the real schema separately
 * (see PR); these tests pin the control flow so a refactor cannot quietly drop the lock, the rollback or the audit row.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
const NOW = new Date("2026-11-10T00:00:00Z"); // 40 days before the spec closes (30-day minimum tenor)
const input = (): BuildInput => ({
  question: "Will the stated result be reported by the league within the window?",
  evidence: [
    { name: "League API", url: "https://example.com/league", group: "league" },
    { name: "Wire service", url: "https://example.com/wire", group: "wire" },
  ],
  predicate: { inputs: [{ name: "result", source: "League API", version: "1" }], expression: "result.winner == team_a" },
  boundaries: [
    { state: "Game postponed without a declared result", outcome: "CANCEL" },
    { state: "Score revised after settlement", outcome: "YES" },
  ],
  closes_at: "2026-12-20T00:00:00Z",
  deadline: "2026-12-27T00:00:00Z",
});
const spec: ResolutionSpec = buildSpec("binary-event", input());

type Row = Record<string, unknown>;
interface Call { sql: string; params: unknown[] }

/** A pool whose `query` answers from a script keyed by a SQL fragment, and records every call. */
function fakePool(script: Array<[string, Row[]]> = [], failOn?: string) {
  const calls: Call[] = [];
  const query = async (sql: string, params: unknown[] = []) => {
    calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
    if (failOn && sql.includes(failOn)) throw new Error("boom");
    const hit = script.find(([frag]) => sql.includes(frag));
    return { rows: hit ? hit[1] : [], rowCount: hit ? hit[1].length : 0 };
  };
  let released = 0;
  const pool = { query, connect: async () => ({ query, release: () => { released++; } }) } as unknown as Pool;
  return { pool, calls, released: () => released, verbs: () => calls.map((c) => c.sql.split(" ")[0]) };
}

describe("saveSpec / getSpec", () => {
  it("stores a valid spec under its content hash", async () => {
    const f = fakePool();
    const s = await saveSpec(f.pool, spec, NOW);
    expect(s.hash).toBe(hashSpec(spec));
    expect(s.id).toBe(specId(s.hash));
    expect(f.calls[0].sql).toContain("ON CONFLICT (spec_hash) DO NOTHING");
    expect(f.calls[0].params[0]).toBe(s.id);
  });

  it("refuses an invalid spec and writes nothing", async () => {
    const f = fakePool();
    await expect(saveSpec(f.pool, { ...spec, boundaries: [] }, NOW)).rejects.toThrow(/invalid resolution spec/);
    expect(f.calls.length).toBe(0);
  });

  it("returns null for an unknown id", async () => {
    expect(await getSpec(fakePool().pool, "rs_0000000000000000")).toBeNull();
  });

  it("refuses a stored spec that no longer matches its hash", async () => {
    const hash = hashSpec(spec);
    const tampered = { ...spec, question_template: "Will something far easier happen?" };
    const f = fakePool([["FROM resolution_specs", [{ spec: tampered, spec_hash: hash }]]]);
    await expect(getSpec(f.pool, specId(hash))).rejects.toThrow(/does not match its hash/);
  });

  it("returns a stored spec that still matches", async () => {
    const hash = hashSpec(spec);
    const f = fakePool([["FROM resolution_specs", [{ spec, spec_hash: hash }]]]);
    expect((await getSpec(f.pool, specId(hash)))?.spec.family).toBe("binary-event");
  });
});

describe("createMarketWithSpec", () => {
  it("writes the spec and the market in one transaction, closing at the spec's close", async () => {
    const f = fakePool([["INSERT INTO markets", [{ id: "m1" }]]]);
    const out = await createMarketWithSpec(f.pool, { id: "m1", title: "t", spec }, NOW);
    expect(out.created).toBe(true);
    expect(f.verbs()).toEqual(["BEGIN", "INSERT", "INSERT", "COMMIT"]);
    const market = f.calls[2];
    expect(market.params).toContain("2026-12-20T00:00:00Z");
    expect(market.params).toContain(out.specId);
    expect(f.released()).toBe(1);
  });

  it("creates nothing and rolls back when the spec is invalid", async () => {
    const f = fakePool();
    await expect(createMarketWithSpec(f.pool, { id: "m1", title: "t", spec: { nope: true } }, NOW)).rejects.toThrow();
    expect(f.verbs()).toEqual(["BEGIN", "ROLLBACK"]);
    expect(f.released()).toBe(1);
  });

  it("reports created:false for a repeated id", async () => {
    const f = fakePool([["INSERT INTO markets", []]]);
    expect((await createMarketWithSpec(f.pool, { id: "m1", title: "t", spec }, NOW)).created).toBe(false);
  });
});

describe("transition", () => {
  const lock = (state: Partial<ResolutionState>) => [["FOR UPDATE OF m", [{ state, spec }]]] as Array<[string, Row[]]>;
  const afterClose = new Date("2026-12-21T00:00:00Z");
  const assertYes = (s: ResolutionState, sp: ResolutionSpec, t: number) =>
    assertOutcome(s, sp, { outcome: "YES", bond: 1_000_000, by: "0xabc", pot: 10 }, t);

  it("locks the row, writes state + status + outcome and an audit event, then commits", async () => {
    const f = fakePool(lock({ ...initialState(), phase: "closed" }));
    const out = await transition(f.pool, "m1", "assert", "0xabc", { outcome: "YES" }, assertYes, afterClose);
    expect(out).toMatchObject({ ok: true, phase: "asserted", changed: true });
    expect(f.verbs()).toEqual(["BEGIN", "SELECT", "UPDATE", "INSERT", "COMMIT"]);
    expect(f.calls[3].sql).toContain("resolution_events");
    expect(f.calls[1].sql).toContain("FOR UPDATE OF m");
  });

  it("a refused transition rolls back and writes nothing", async () => {
    const f = fakePool(lock(initialState()));
    const early = new Date("2026-11-10T00:00:00Z"); // before the close
    const out = await transition(f.pool, "m1", "assert", "0xabc", {}, assertYes, early);
    expect(out.ok).toBe(false);
    expect(out.reason).toBeTruthy();
    expect(f.verbs()).toEqual(["BEGIN", "SELECT", "ROLLBACK"]);
  });

  it("a market with no spec is reported, not thrown", async () => {
    const f = fakePool();
    const out = await transition(f.pool, "nope", "assert", null, {}, assertYes, afterClose);
    expect(out).toMatchObject({ ok: false });
    expect(f.verbs()).toEqual(["BEGIN", "SELECT", "ROLLBACK"]);
  });

  it("an unchanged state writes no audit row", async () => {
    const f = fakePool(lock(initialState()));
    const out = await transition(f.pool, "m1", "noop", null, {}, (s) => ({ ok: true, state: s }), NOW);
    expect(out).toMatchObject({ ok: true, changed: false });
    expect(f.verbs()).toEqual(["BEGIN", "SELECT", "COMMIT"]);
  });

  it("rolls back and rethrows on a database error, and always releases the client", async () => {
    const f = fakePool(lock(initialState()), "UPDATE markets");
    await expect(transition(f.pool, "m1", "x", null, {}, (s) => ({ ok: true, state: { ...s, phase: "closed" } }), NOW)).rejects.toThrow("boom");
    expect(f.verbs()).toContain("ROLLBACK");
    expect(f.verbs()).not.toContain("COMMIT");
    expect(f.released()).toBe(1);
  });
});

describe("sweepDue", () => {
  it("closes an open market past its close and leaves one that is not due", async () => {
    const f = fakePool([
      ["SELECT id FROM markets", [{ id: "due" }, { id: "early" }]],
      ["FOR UPDATE OF m", [{ state: initialState(), spec }]],
    ]);
    const report = await sweepDue(f.pool, new Date("2026-12-21T00:00:00Z"));
    expect(report.scanned).toBe(2);
    expect(report.closed).toBe(2); // the fake returns the same open state for both; both are past close at this date
    expect(report.cancelled).toBe(0);
    expect(report.failed).toBe(0);
  });

  it("cancels a market nobody resolved before deadline + fallback_after", async () => {
    const f = fakePool([
      ["SELECT id FROM markets", [{ id: "stale" }]],
      ["FOR UPDATE OF m", [{ state: { ...initialState(), phase: "closed" }, spec }]],
    ]);
    const report = await sweepDue(f.pool, new Date("2027-02-01T00:00:00Z"));
    expect(report).toMatchObject({ scanned: 1, cancelled: 1, closed: 0, failed: 0 });
    const update = f.calls.find((c) => c.sql.startsWith("UPDATE markets"));
    expect(update?.params[2]).toBe("cancelled");
    expect(update?.params[3]).toBeNull();
  });

  it("does nothing to a market that is not yet due", async () => {
    const f = fakePool([
      ["SELECT id FROM markets", [{ id: "early" }]],
      ["FOR UPDATE OF m", [{ state: initialState(), spec }]],
    ]);
    const report = await sweepDue(f.pool, NOW);
    expect(report).toMatchObject({ scanned: 1, closed: 0, cancelled: 0, failed: 0 });
    expect(f.calls.some((c) => c.sql.startsWith("UPDATE markets"))).toBe(false);
  });

  it("counts a failing market and carries on", async () => {
    const f = fakePool([["SELECT id FROM markets", [{ id: "a" }, { id: "b" }]]], "FOR UPDATE OF m");
    const report = await sweepDue(f.pool, NOW);
    expect(report).toMatchObject({ scanned: 2, failed: 2 });
  });
});
