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
| `0002_shield.sql` | `shield_positions` — MAD Shield opt-in + return-window ledger (value movement is on-chain) |
| `0003_cards.sql` | `cards` — ownership ledger + durability/evolution lifecycle |
| `0004_vector.sql` | `market_intelligence` + `CREATE EXTENSION vector` — pgvector(768) with an HNSW cosine index |
| `0005_gdelt.sql` | `celebrity_whitelist`, `gdelt_signals` — scandal signal pipeline |
| `0006_card_stats.sql` | `card_stats` — Living MADCards off-chain stats, mint-gated at L3+ |
| `0007_markets.sql` | `markets`, `bets`, `audit_log` — prediction-market backbone |
| `0008_madx_web2.sql` | `madx_accounts`, `madx_ledger`, `madx_supply` — Web2 $MADx beta credit ledger |
| `0009_gdelt_url_unique.sql` | Partial unique index on `gdelt_signals(url)` for idempotent ingest |
| `0010_auth_identity.sql` | `siwe_nonces` (SIWE replay protection), `user_profiles` (customer-supplied identity) |

## Auth model

Authentication is **SIWE (EIP-4361)** — a wallet signature, domain-bound and
chain-bound to Arbitrum Nova (42170). Identity is an EVM address; there are no
passwords and no OAuth providers, so there is no password/hash column and no
`accounts` table. Sessions are **stateless HMAC tokens** (`lib/session.ts`), so
there is no `sessions` table either.

Do not layer an Auth.js/NextAuth schema on top of this. It keys identity on a
`SERIAL` integer and uses foreign keys, while every table here keys on
`VARCHAR(42)` and is deliberately FK-free — adopting it would create a second,
parallel identity system rather than extending the existing one.
