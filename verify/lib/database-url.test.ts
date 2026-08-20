import { afterEach, describe, expect, it } from "vitest";
import { ensureDatabaseUrlEnv, getDatabaseUrl } from "@/lib/database-url";

const connectionKeys = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "NEON_SKY_PARK_DATABASE_URL",
  "NEO_DATABASE_URL",
] as const;

const originalValues = Object.fromEntries(connectionKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of connectionKeys) {
    const value = originalValues[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("database URL resolution", () => {
  it("uses the standard Neon POSTGRES_URL when DATABASE_URL is absent", () => {
    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL = "postgresql://pooled";

    expect(getDatabaseUrl()).toBe("postgresql://pooled");
    expect(ensureDatabaseUrlEnv()).toBe("postgresql://pooled");
    expect(process.env.DATABASE_URL).toBe("postgresql://pooled");
  });

  it("prefers an explicit DATABASE_URL over integration fallbacks", () => {
    process.env.DATABASE_URL = "postgresql://explicit";
    process.env.POSTGRES_URL = "postgresql://pooled";

    expect(getDatabaseUrl()).toBe("postgresql://explicit");
  });
});
