# Neon × Vercel — injected environment variables (Vercel-Managed integration, Path A)

Source: https://neon.com/docs/guides/vercel-managed-integration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Pooled connection string (PgBouncer) — use this for normal app queries |
| `DATABASE_URL_UNPOOLED` | Direct connection string — use for migrations, long-lived connections, `LISTEN/NOTIFY`, or anything PgBouncer's transaction pooling breaks |
| `PGHOST` | Pooled host |
| `PGHOST_UNPOOLED` | Direct host |
| `PGUSER` | Database user |
| `PGDATABASE` | Database name |
| `PGPASSWORD` | Database password |
| `POSTGRES_*` | Legacy aliases kept for backward compatibility with old Vercel Postgres templates — prefer `DATABASE_URL`/`PG*` in new code |
| `NEON_AUTH_BASE_URL` | Only present if Managed Better Auth is enabled on the production branch |
| `VITE_NEON_AUTH_URL` | Same as above, Vite-prefixed for client-side access |

Optional env var prefix (e.g. `PRIMARY_DATABASE_URL`) can be set when connecting a project, useful if a single Vercel project has multiple Neon databases attached.

**Preview-deployment-specific note**: the per-branch connection variables for automated Preview Branching are injected at deployment time via webhook and are intentionally **not visible** in the Vercel project's Environment Variables settings UI — this is by design (nothing to manually clean up when the branch is deleted), not a bug or missing permission.

## GARCH/canon-adjacent note (this repo specifically)

None of the above overlaps with this repo's math/canon env vars (`GOOGLE_API_KEY`, `ALLOWED_WALLETS`, `CRON_SECRET`, etc.) — this file covers only the Postgres connection surface.
