# Neon SQL migrations (raw)

Plain-SQL migrations for the app DB on Neon. Drizzle is deferred, so these are
applied directly (they are idempotent — `CREATE TABLE IF NOT EXISTS`).

## Apply
- **CI (per PR):** run against the ephemeral Neon branch the `neon-pr-branch.yml`
  workflow provisions.
- **Cursor / local:** `psql "$DATABASE_URL" -f verify/sql/0001_data_platform.sql`
- **Prod:** apply the reviewed file once against the production branch.

Runtime code degrades gracefully when `DATABASE_URL` is unset or a table is
missing (routes return a clean fallback), so a missing migration never breaks
the build or the demo.

| File | Adds |
|---|---|
| `0001_data_platform.sql` | `events_stream`, `cdp_profiles`, `agg_platform_hourly`, `agg_user_daily` (V1 Data Platform) |
| `0010_customer_auth_profiles.sql` | `siwe_nonces`, `customer_accounts`, `customer_login_events`, `customer_profile_audit` (SIWE auth + customer profile backbone) |
