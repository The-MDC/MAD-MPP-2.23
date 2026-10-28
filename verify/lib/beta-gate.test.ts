import { describe, it, expect } from "vitest";
import { guestValid, safeNext, signPass, verifyPass } from "@/lib/beta-gate";

const guests = { madgambit: "s3cret" };

describe("beta gate", () => {
  it("accepts only the exact guest pair", () => {
    expect(guestValid(guests, "madgambit", "s3cret")).toBe(true);
    expect(guestValid(guests, "madgambit", "s3cre")).toBe(false);
    expect(guestValid(guests, "constructor", "x")).toBe(false);
  });
  it("a signed pass verifies; tampering, expiry or a removed guest fail", async () => {
    const pass = await signPass("madgambit", 1_000_000);
    expect(await verifyPass(pass, guests, 1_000_000)).toBe(true);
    const [u, exp, mac] = pass.split(".");
    expect(await verifyPass(`${u}.${Number(exp) + 999}.${mac}`, guests, 1_000_000)).toBe(false);
    expect(await verifyPass(pass, guests, (Number(exp) + 1) * 1000)).toBe(false);
    expect(await verifyPass(pass, {}, 1_000_000)).toBe(false);
    expect(await verifyPass(undefined, guests)).toBe(false);
  });
  it("only same-site paths survive as next", () => {
    expect(safeNext("/open-markets?tab=prediction")).toBe("/open-markets?tab=prediction");
    expect(safeNext("//evil.example")).toBe("/preview");
    expect(safeNext("https://evil.example")).toBe("/preview");
    expect(safeNext("/beta")).toBe("/preview");
  });
  it("refuses the backslash and control-character open redirects", () => {
    for (const evil of ["/\\evil.example", "/\\/evil.example", "/\t/evil.example", "/\n/evil.example", "/\r\n/evil.example", "/%5Cevil.example/..", "/api/v1/x", "/beta?next=//x"]) {
      const out = safeNext(evil);
      expect(out.startsWith("//"), JSON.stringify(evil)).toBe(false);
      expect(new URL(out, "https://madgambit.fun").origin, JSON.stringify(evil)).toBe("https://madgambit.fun");
    }
    expect(safeNext("/\\evil.example")).toBe("/preview");
    expect(safeNext("/profile#cashed")).toBe("/profile#cashed");
  });
});
