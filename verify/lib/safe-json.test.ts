import { describe, it, expect } from "vitest";
import { safeParseJSON, parseWithRetry } from "./safe-json";

describe("safeParseJSON", () => {
  it("parses clean JSON", () => {
    const r = safeParseJSON<{ a: number }>('{"a":1}');
    expect(r.ok && r.value.a).toBe(1);
    expect(r.ok && r.repaired).toBe(false);
  });

  it("strips ```json fences", () => {
    const r = safeParseJSON<{ a: number }>('```json\n{"a":1}\n```');
    expect(r.ok && r.value.a).toBe(1);
    expect(r.ok && r.repaired).toBe(true);
  });

  it("strips bare ``` fences", () => {
    expect(safeParseJSON<{ a: number }>('```\n{"a":2}\n```')).toMatchObject({ ok: true });
  });

  // The exact failure that used to 500 the satire route.
  it("survives a conversational preamble", () => {
    const r = safeParseJSON<{ a: number }>('Sure! Here is the JSON:\n{"a":1}');
    expect(r.ok && r.value.a).toBe(1);
  });

  it("survives trailing commentary", () => {
    const r = safeParseJSON<{ a: number }>('{"a":1}\n\nHope that helps!');
    expect(r.ok && r.value.a).toBe(1);
  });

  it("does not truncate on braces inside string values", () => {
    const r = safeParseJSON<{ satire_take: string }>(
      '{"satire_take":"the {situation} is }absurd{"}',
    );
    expect(r.ok && r.value.satire_take).toBe("the {situation} is }absurd{");
  });

  it("handles escaped quotes inside strings", () => {
    const r = safeParseJSON<{ s: string }>('{"s":"he said \\"no\\" loudly"}');
    expect(r.ok && r.value.s).toBe('he said "no" loudly');
  });

  it("repairs smart quotes", () => {
    const r = safeParseJSON<{ a: number }>('{“a”:1}');
    expect(r.ok && r.value.a).toBe(1);
  });

  it("repairs trailing commas", () => {
    const r = safeParseJSON<{ a: number }>('{"a":1,}');
    expect(r.ok && r.value.a).toBe(1);
  });

  it("parses arrays", () => {
    const r = safeParseJSON<number[]>("prefix [1,2,3] suffix");
    expect(r.ok && r.value).toEqual([1, 2, 3]);
  });

  it("fails cleanly on empty input without throwing", () => {
    expect(safeParseJSON("")).toMatchObject({ ok: false });
    expect(safeParseJSON("   ")).toMatchObject({ ok: false });
  });

  it("fails cleanly on prose with no JSON", () => {
    expect(safeParseJSON("I cannot help with that request.")).toMatchObject({ ok: false });
  });

  it("fails cleanly on an unterminated object", () => {
    expect(safeParseJSON('{"a":1')).toMatchObject({ ok: false });
  });

  it("never throws on hostile input", () => {
    const nasty = ["{{{{", "]]]]", '"', "\\", "{'a':1}", "null", "undefined"];
    for (const n of nasty) expect(() => safeParseJSON(n)).not.toThrow();
  });
});

describe("parseWithRetry", () => {
  const isAB = (v: unknown): v is { a: number } =>
    !!v && typeof v === "object" && typeof (v as { a?: unknown }).a === "number";

  it("returns on first success without a second call", async () => {
    let calls = 0;
    const r = await parseWithRetry(
      async () => {
        calls++;
        return '{"a":1}';
      },
      isAB,
      2,
    );
    expect(r.ok).toBe(true);
    expect(calls).toBe(1);
  });

  it("retries once when the first output is unparseable", async () => {
    let calls = 0;
    const r = await parseWithRetry(
      async () => {
        calls++;
        return calls === 1 ? "sorry, no JSON here" : '{"a":7}';
      },
      isAB,
      2,
    );
    expect(r.ok && r.value.a).toBe(7);
    expect(calls).toBe(2);
  });

  it("retries when JSON parses but fails shape validation", async () => {
    let calls = 0;
    const r = await parseWithRetry(
      async () => {
        calls++;
        return calls === 1 ? '{"wrong":"shape"}' : '{"a":3}';
      },
      isAB,
      2,
    );
    expect(r.ok && r.value.a).toBe(3);
  });

  it("surfaces failure after exhausting attempts instead of throwing", async () => {
    const r = await parseWithRetry(async () => "never json", isAB, 2);
    expect(r.ok).toBe(false);
  });

  it("survives a producer that throws", async () => {
    let calls = 0;
    const r = await parseWithRetry(
      async () => {
        calls++;
        if (calls === 1) throw new Error("network down");
        return '{"a":5}';
      },
      isAB,
      2,
    );
    expect(r.ok && r.value.a).toBe(5);
  });
});
