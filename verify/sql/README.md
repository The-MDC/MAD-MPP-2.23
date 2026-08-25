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
| `0010_auth_identity.sql` | `siwe_nonces` (SIWE replay protection), `user_profiles` (user-asserted identity) |
| `0011_customer_accounts.sql` | `customer_accounts`, `customer_login_events`, `customer_profile_audit` (system-asserted account state + ledgers) |
| `0012_perp_markets.sql` | `perp_markets`, `faces_simplex`, `zeitgeist_slates`, `zeitgeist_succession`, `epiphany_models`, `perp_positions`, `portrait_keys`, `portrait_key_destructions` — the three perp families, legs not expiries |
| `0013_registrar.sql` | `registrar_queue`, `subject_replies`, `subject_complaints`, `subject_identity_map`, `pause_state`, `pause_events`, `registry_readiness` — named-subject governance |
| `0014_slot_auction.sql` | `slot_auctions`, `slot_nominations`, `slot_bids` — ZEITGEIST sealed-bid slot auction with a Dutch reserve clock |
| `0015_pack_open_counter.sql` | `customer_accounts.pack_open_count` — per-wallet monotonic counter, closes the open-pack grindable-nonce bug |
| `0016_market_book.sql` | `market_book` (DL-LMSR share vector + liquidity + GARCH state), `market_prices` (append-only price tape), and the priced-fill columns on `bets` |

## One migration owns each table

A table is created by **exactly one** migration file. `CREATE TABLE IF NOT
EXISTS` makes a second definition of the same table a silent no-op — whichever
runs first wins, and any divergence in the losing definition disappears without
an error. Two files defining the same table is a bug even when both appear to
work.

Corollary: never reuse a sequence number. Two files numbered `0010` have no
defined apply order.

## Auth model

Authentication is **SIWE (EIP-4361)** — a wallet signature, domain-bound and
chain-bound to Arbitrum Nova (42170). Identity is an EVM address; there are no
passwords and no OAuth providers, so there is no password/hash column and no
`accounts` table. Sessions are **stateless HMAC tokens** (`lib/session.ts`), so
there is no `sessions` table either.

### One identity key, many projections

The rule is **one identity key**, not one identity table. Every table keys on
the same lowercased `VARCHAR(42)` wallet address and is deliberately FK-free.
Identity data is split across tables by **who is entitled to write it**:

| Table | Writer | Mutability | Holds |
|---|---|---|---|
| `user_profiles` | the user | mutable | `display_name`, `avatar_url`, `bio`, `email`, `notification_prefs` |
| `customer_accounts` | the system (SIWE verify path) | mutable | `chain_id`, `status`, `first_seen`, `last_login_at`, `login_count` |
| `customer_login_events` | the system | append-only | auth event ledger |
| `customer_profile_audit` | the system | append-only | who mutated `user_profiles`, and how |

A user may assert their own display name. A user may not assert their own
`login_count`, and must not be able to assert `status='active'` when an operator
set `'suspended'`. Different write authority is why these are separate tables —
not different identities.

`customer_accounts` is created by the login path on first successful verify, so
it may exist without a `user_profiles` row (a player who never filled anything
in). The reverse should not happen.

**Profile fields have exactly one home: `user_profiles`.** An earlier draft of
`customer_accounts` carried `profile`/`preferences` JSONB columns; they were
removed because they duplicated `user_profiles` and created a second source of
truth for the same fields.

### What is actually forbidden

Do not introduce a **second identity key**. Auth.js/NextAuth is the concrete
example: it keys identity on a `SERIAL` integer and uses foreign keys, which
would sit alongside the wallet address as a rival primary identity. That is a
parallel identity system, and it is what this directive exists to prevent.

Adding a table that keys on the same wallet address, for data with a different
writer, is not — it is another projection of the one identity.
