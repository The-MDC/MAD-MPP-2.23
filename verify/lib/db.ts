import { Pool } from 'pg';
import { ensureDatabaseUrlEnv } from '@/lib/database-url';

let pool: Pool | undefined;

/**
 * Rewrite an ambiguous `sslmode` to the explicit `verify-full`.
 *
 * Setting `ssl: { rejectUnauthorized: true }` on the Pool (below) pins the
 * BEHAVIOUR, but it does not stop the warning: `pg-connection-string` emits
 *
 *   SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are
 *   treated as aliases for 'verify-full' ...
 *
 * while PARSING the URL, before any Pool option is consulted. That warning was
 * firing on every cold start of every DB-backed route in production (41
 * occurrences across /api/v1/zeitgeist/slate, /epiphany/models,
 * /markets/proposals, /registrar/status, /faces).
 *
 * The warning names its own remedy — "explicitly use 'sslmode=verify-full'" —
 * so do exactly that. Neon injects `sslmode=require`; rewriting it to
 * `verify-full` states the intent we already rely on, keeps the same semantics
 * across the pg v9 change, and removes the log noise that was burying real
 * errors.
 *
 * Deliberately narrow: only the three modes the warning names are rewritten. A
 * connection string that already says `verify-full`, or that says `disable`/
 * `no-verify` for a local socket, is left untouched rather than silently
 * upgraded — surprising a local dev with a TLS requirement is its own bug.
 */
function normalizeSslMode(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  return raw.replace(/([?&]sslmode=)(require|prefer|verify-ca)\b/i, "$1verify-full");
}

export function getDbPool() {
  if (!pool) {
    const connectionString = normalizeSslMode(ensureDatabaseUrlEnv());

    // Neon requires TLS, and we pin CERTIFICATE VERIFICATION here explicitly
    // rather than letting the connection string's `sslmode` decide it.
    //
    // Why this is not redundant with `sslmode=require` (which Neon's injected
    // DATABASE_URL carries): production build logs currently emit
    //
    //   SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca'
    //   are treated as aliases for 'verify-full'. In the next major version
    //   (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt
    //   standard libpq semantics, which have weaker security guarantees.
    //
    // Today `require` happens to mean verify-full. Under libpq semantics it
    // means "encrypt, but do not verify the certificate" — which silently
    // opens a MITM window on a dependency bump, with no code change and no
    // error to notice. An explicit `ssl` object on the Pool config takes
    // precedence over the connection string, so verification stays on across
    // that upgrade regardless of which sslmode the platform injects.
    //
    // Deliberately NOT `rejectUnauthorized: false` (as some Neon quickstarts
    // suggest) — Neon presents valid publicly-trusted certs, so verification
    // costs nothing and disabling it is the exact weakening warned about above.
    //
    // SUPABASE: its Postgres certificates are signed by Supabase's own root CA, not a public one, so verification
    // needs that CA. Put the PEM from the Supabase dashboard (Database settings, SSL certificate) in DATABASE_CA_CERT
    // and verification stays ON. Never "fix" a Supabase TLS error with rejectUnauthorized: false.
    // Serverless sizing: on Vercel each function instance holds its own pool, so keep it small (DB_POOL_MAX, default
    // 5) and point DATABASE_URL at the transaction pooler (Supabase: port 6543) to stay inside free-tier connection caps.
    const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n").trim();
    const max = Math.max(1, Math.min(20, Number(process.env.DB_POOL_MAX) || 5));
    pool = new Pool({
      connectionString,
      max,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: ca ? { rejectUnauthorized: true, ca } : { rejectUnauthorized: true },
    });

    // A background error on an idle client (e.g. Neon closing an idle
    // connection) must not crash the process — log it and let the pool recycle.
    pool.on('error', (err) => {
      console.error('[db] unexpected idle client error', err);
    });
  }
  return pool;
}
