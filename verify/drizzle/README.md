# Database — Neon Postgres + Drizzle

Schema: `lib/schema/`. Config: `drizzle.config.ts`. Client: `lib/db.ts` → `db`.

## Workflow
- `npm run db:generate` — generate a SQL migration from the schema into `drizzle/migrations/`.
- `npm run db:migrate` — apply pending migrations to `DATABASE_URL` (a Neon branch).
- `npm run db:push` — push the schema directly (dev only; no migration files).
- `npm run db:studio` — open Drizzle Studio.

## Where it runs
- **CI:** the Neon PR-database-branch workflow provisions an ephemeral branch per PR — run `db:migrate` against it to validate.
- **Cursor/local:** point `DATABASE_URL` at a Neon dev branch and run the scripts.
- Never run `db:push` / `db:migrate` against production without a reviewed migration.

Ported from `docs/imported/specs/MADHATS_DATABASE_SCHEMA.md` — Section 1 (application DB). Sections 2–5 (warehouse / CDP / analytics) are a separate system, not in this schema.
