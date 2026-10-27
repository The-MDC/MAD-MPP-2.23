import { beforeEach, describe, expect, it, vi } from "vitest";
import { secretMatches } from "./bearer-secret";

/**
 * The complaint-resolution branch settles a market at a caller-supplied price
 * and then halts it. It was gated on `requireMadxRouteAuth` — any signed-in
 * wallet — so any user could settle any market at a price of their choosing.
 *
 * These lock the boundary: no credential is a refusal, a wrong credential is a
 * refusal, and an unconfigured credential FAILS CLOSED rather than falling back
 * to the session check it replaced.
 */
describe("registrar resolution auth", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret";
    delete process.env.DATABASE_URL;
    delete process.env.REGISTRAR_TOKEN;
  });

  const resolveRequest = (headers: Record<string, string> = {}) =>
    new Request("http://localhost/api/v1/registrar/complaint?resolve=1", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify({ complaintId: 1, settlePrice: 0.01, settleLeg: 1, marketId: "mkt_1" }),
    });

  it("fails CLOSED when REGISTRAR_TOKEN is unconfigured — never back to session auth", async () => {
    const { POST } = await import("@/app/api/v1/registrar/complaint/route");
    const res = await POST(resolveRequest());
    // 503, not 401: the action is unavailable, which is different from "you are
    // not the registrar" and must not be confusable with it.
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toMatchObject({ success: false });
  });

  it("refuses a wrong credential", async () => {
    process.env.REGISTRAR_TOKEN = "the-real-registrar-token";
    const { POST } = await import("@/app/api/v1/registrar/complaint/route");
    const res = await POST(resolveRequest({ "x-registrar": "not-it" }));
    expect(res.status).toBe(401);
  });

  it("refuses a credential that is merely a prefix of the real one", async () => {
    // The length check has to come before the byte compare, or timingSafeEqual
    // throws and the route 500s instead of refusing.
    process.env.REGISTRAR_TOKEN = "the-real-registrar-token";
    const { POST } = await import("@/app/api/v1/registrar/complaint/route");
    const res = await POST(resolveRequest({ "x-registrar": "the-real" }));
    expect(res.status).toBe(401);
  });

  it("does not accept a session cookie in place of the credential", async () => {
    // The regression this exists for: the old gate was requireMadxRouteAuth.
    process.env.REGISTRAR_TOKEN = "the-real-registrar-token";
    const { POST } = await import("@/app/api/v1/registrar/complaint/route");
    const res = await POST(resolveRequest({ cookie: "mg_session=anything" }));
    expect(res.status).toBe(401);
  });
});

describe("secretMatches", () => {
  it("matches only an exact equal-length secret", () => {
    expect(secretMatches("abc123", "abc123")).toBe(true);
    expect(secretMatches("abc124", "abc123")).toBe(false);
    expect(secretMatches("abc12", "abc123")).toBe(false);   // shorter
    expect(secretMatches("abc1234", "abc123")).toBe(false); // longer
    expect(secretMatches("", "abc123")).toBe(false);
    expect(secretMatches("", "")).toBe(true);
  });

  it("does not throw on a length mismatch", () => {
    // node's timingSafeEqual throws when the buffers differ in length; the
    // guard has to catch that before it reaches the compare.
    expect(() => secretMatches("a", "aaaaaaaaaaaaaaaa")).not.toThrow();
  });
});
