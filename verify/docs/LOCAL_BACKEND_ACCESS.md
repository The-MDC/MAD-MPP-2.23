# Local backend access

Use the Vercel project as the single credential distributor for local development. Do not copy connection strings or tokens into source control, Claude prompts, or agent configuration files.

## One-time setup

1. Authenticate to Vercel with the developer's own account and link this repository to the `madgambit/mad-mpp-2-23` project.
2. Pull Development variables into an ignored local file:

   ```sh
   vercel env pull .env.local
   ```

3. Run the app from `verify`:

   ```sh
   npm run dev
   ```

The Neon integration provides `DATABASE_URL` for the PostgreSQL pool and migration runner. Preview and Production receive their own environment assignments from Vercel.

## Operational boundaries

- Neon PostgreSQL is the source of truth for market state, balances, orders, outcomes, and audit records.
- Upstash Redis is reserved for cache, rate-limit, nonce/session coordination, and idempotency work; it must not store settlement state.
- Vercel Blob is reserved for uploads and immutable artifacts. Keep object access private unless a route explicitly authorizes delivery.
- Run migrations only from a reviewed deployment or an operator-controlled local environment with the intended `DATABASE_URL`.

## Release flow

Preview deployments remain enabled for non-`main` branches. Git pushes to `main` do not deploy automatically; create a reviewed manual Production deployment and promote it only after verification.
