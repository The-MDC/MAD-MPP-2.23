import { afterEach, describe, expect, it, vi } from "vitest";

const query = vi.fn();
vi.mock("@/lib/database-url", () => ({ hasDatabaseUrl: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDbPool: () => ({ query }) }));

import { hasDatabaseUrl } from "@/lib/database-url";
import { checkDatabaseHealth } from "@/lib/storage-health";

afterEach(() => vi.resetAllMocks());

describe("checkDatabaseHealth", () => {
  it("reports unconfigured without opening a connection", async () => {
    vi.mocked(hasDatabaseUrl).mockReturnValue(false);
    await expect(checkDatabaseHealth()).resolves.toEqual({ configured: false, available: false, latencyMs: null });
    expect(query).not.toHaveBeenCalled();
  });

  it("reports a successful database readiness check", async () => {
    vi.mocked(hasDatabaseUrl).mockReturnValue(true);
    query.mockResolvedValueOnce({});
    await expect(checkDatabaseHealth()).resolves.toMatchObject({ configured: true, available: true });
  });
});
