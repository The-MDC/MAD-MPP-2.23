# Production operations

## Database migrations

The normal `npm run build` command only builds the application. It never changes
schema state. Run migrations deliberately from an approved deployment operator
session before deploying code that depends on a new migration:

```bash
vercel env pull .env.production --environment production
npm run migrate:deploy
```

Run `npm run schema:verify` first, then `npm run db:smoke` against the same approved environment after migrations.
A ready schema has 14 recorded migrations, pgvector, and all MAD Gambit application tables.
Never set `SKIP_MIGRATIONS` as a normal deployment path.

## Portrait storage

Portrait ciphertext uses a **private** Vercel Blob store through
`lib/vercel-blob-store.ts`. The store must be connected to this project in
Production, Preview, and Development. Vercel deployments use rotating OIDC
credentials; local development can use `BLOB_READ_WRITE_TOKEN` from `vercel env
pull`.

## Cron secret

Set `CRON_SECRET` as an encrypted value in Production, Preview, and Development
before shipping the cron configuration. Vercel Cron supplies it to scheduled
requests as `Authorization: Bearer <CRON_SECRET>`.
