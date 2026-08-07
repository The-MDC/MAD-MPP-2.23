const FALLBACK_DATABASE_URL_KEYS = [
  "NEON_SKY_PARK_DATABASE_URL",
  "NEO_DATABASE_URL",
] as const;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || FALLBACK_DATABASE_URL_KEYS.map((key) => process.env[key]).find(Boolean);
}

export function hasDatabaseUrl(): boolean {
  return Boolean(getDatabaseUrl());
}

/**
 * Keep legacy `process.env.DATABASE_URL` checks working when Vercel's Neon
 * integration emits a project-prefixed connection string instead.
 */
export function ensureDatabaseUrlEnv(): string | undefined {
  const url = getDatabaseUrl();
  if (url && !process.env.DATABASE_URL) process.env.DATABASE_URL = url;
  return url;
}
