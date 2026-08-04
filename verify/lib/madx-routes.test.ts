import { beforeEach, describe, expect, it, vi } from "vitest";

describe("MADx route auth", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test-session-secret";
    delete process.env.DATABASE_URL;
  });

  it("returns 401 for an unauthenticated transfer before touching DATABASE_URL", async () => {
    const { POST } = await import("@/app/api/v1/madx/transfer/route");

    const res = await POST(
      new Request("http://localhost/api/v1/madx/transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: "0xvictim", to: "0xattacker", amount: 1 }),
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ success: false, error: "unauthorized" });
  });
});
