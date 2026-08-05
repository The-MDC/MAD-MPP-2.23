# ADR-008: Runtime DB Driver — `pg` Pool + Next.js Route Handlers

**Date:** 2026-08-05
**Status:** Accepted
**Author:** Nick (MAD Gambit Founder)

---

## Context

The three custom perpetual families — **FIVE FACES**, **ZEITGEIST** and **Perpetual
Epiphanies** — need a persistence layer. Before writing it, the driver and backend
boundary had to be settled, because the choice determines the shape of every
store, route and migration downstream.

The question surfaced because the `@neondatabase/serverless` snippet is the
pattern Vercel and Neon lead with in their current docs:

```ts
// app/actions.ts
"use server";
import { neon } from "@neondatabase/serverless";

export async function getData() {
  const sql = neon(process.env.DATABASE_URL);
  return await sql`...`;
}
```

That is good advice **for a new App Router app**. It is not the shape of this
backend, and adopting it here would fork the architecture rather than extend it.

### What already exists

| Surface | Uses |
|---|---|
| `verify/lib/db.ts` | `pg.Pool` singleton via `getDbPool()`, TLS enforced, idle-error handling |
| `verify/scripts/migrate.mjs` | `pg.Client`, transaction per migration, `_migrations` ledger |
| `verify/app/api/v1/**/route.ts` | 10+ route handlers on `getDbPool()` — markets, cards, GDELT, analytics, `$MADx`, lobby, audit, scandal graph |
| `verify/lib/card-evolution.ts` | Takes `Pool` directly; typed mappers, no ORM |

Several modules depend on `Pool` / `PoolClient` semantics and multi-statement
transactions. `@neondatabase/serverless`'s HTTP mode is single-shot per request
and does not give the same transaction handle.

---

## Decision

**Use `pg` Pool + Next.js Route Handlers.**

Keep:

- `NEON_SKY_PARK_DATABASE_URL` as the runtime source (resolved through
  `verify/lib/database-url.ts#ensureDatabaseUrlEnv`, which also accepts
  `DATABASE_URL` and `NEO_DATABASE_URL`)
- `verify/lib/db.ts` as the **single** DB client — nothing else constructs a pool
- `verify/app/api/**/route.ts` as the **backend boundary** — no DB access from
  components or Server Actions

Do **not** adopt:

- `@neondatabase/serverless` + `"use server"` Server Actions
- `neon()` inside existing route handlers

---

## Rationale

1. **It is already everywhere.** Migrations, smoke tests, `$MADx`, markets, cards,
   GDELT and analytics all run on `pg`. Consistency is the cheap win.
2. **Transactions are load-bearing.** Modules type against `Pool` / `PoolClient`
   and use real transactions. Swapping to `neon()` is a refactor, not a setup step.
3. **The runtime supports it.** Vercel Functions on a Node.js runtime with a Neon
   **pooled** connection string is a valid, supported shape for this backend.
4. **One driver, one boundary.** Adding a second runtime driver would mean two
   connection lifecycles, two error surfaces and two places to reason about
   pooling — for no capability this backend lacks.
5. **The migration story is unchanged either way.** `migrate.mjs` runs on `pg`
   regardless, so adopting `neon()` at runtime would have split the codebase
   across two drivers without simplifying schema management.

### On Vercel Postgres

Vercel Postgres is no longer a first-party product. Existing Vercel Postgres
databases were migrated to **Neon** via the Marketplace in December 2024, so Neon
is the correct relational backend here and `@vercel/postgres` is not a candidate.

---

## Consequences

- New perp tables land as numbered migrations (`verify/sql/00NN_*.sql`), applied
  by `.github/workflows/db-migrate.yml` on merge to `main`. **No interactive
  `psql` access is required or expected** — and in the agent container it is not
  even possible, since network policy denies both TCP 5432 and HTTPS CONNECT to
  `*.neon.tech`. Schema landing through reviewed migrations rather than an
  interactive shell is the safer arrangement, not a workaround.
- Stores are plain modules taking `Pool`, mirroring `card-evolution.ts`.
- Routes keep using `enforceRateLimit` and the existing auth helpers, which are
  written against the `Request` / `NextResponse` route-handler contract.
- Anything genuinely needing edge latency can be revisited **per route**, as an
  explicit exception with its own ADR — not as a default.

---

## Status of this decision

**Settled. Do not reopen without a new ADR superseding this one.**

This question has been raised more than once; it is recorded here so future
contributors and agents can find the answer instead of re-deriving it.
