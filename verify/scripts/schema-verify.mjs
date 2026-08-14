/**
 * MAD Gambit — Neon schema readiness check.
 *
 * Read-only verification for an environment where DATABASE_URL is available.
 * It checks the migration ledger, the pgvector extension, and every required
 * application table without exposing connection details or application data.
 */
import pg from "pg";

const { Client } = pg;
const FALLBACK_DATABASE_URL_KEYS = ["NEON_SKY_PARK_DATABASE_URL", "NEO_DATABASE_URL"];
const REQUIRED_MIGRATIONS = Array.from({ length: 14 }, (_, index) => `${String(index + 1).padStart(4, "0")}_`);
const REQUIRED_TABLES = [
  "events_stream", "cdp_profiles", "agg_platform_hourly", "agg_user_daily",
  "shield_positions", "cards", "market_intelligence", "celebrity_whitelist",
  "gdelt_signals", "card_stats", "markets", "bets", "audit_log", "madx_accounts",
  "madx_ledger", "madx_supply", "siwe_nonces", "user_profiles", "customer_accounts",
  "customer_login_events", "customer_profile_audit", "perp_markets", "faces_simplex",
  "zeitgeist_slates", "zeitgeist_succession", "epiphany_models", "perp_positions",
  "portrait_keys", "portrait_key_destructions", "registrar_queue", "subject_replies",
  "subject_complaints", "subject_identity_map", "pause_state", "pause_events",
  "registry_readiness", "slot_auctions", "slot_nominations", "slot_bids",
];

const connectionString = process.env.DATABASE_URL
  ?? FALLBACK_DATABASE_URL_KEYS.map((key) => process.env[key]).find(Boolean);

if (!connectionString) {
  console.error("DATABASE_URL is required for schema verification.");
  process.exit(1);
}

const client = new Client({ connectionString });
try {
  await client.connect();
  const [{ rows: migrations }, { rows: extensions }, { rows: tables }] = await Promise.all([
    client.query("SELECT name FROM _migrations ORDER BY name"),
    client.query("SELECT extname FROM pg_extension WHERE extname = 'vector'"),
    client.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = ANY($1::text[])",
      [REQUIRED_TABLES],
    ),
  ]);

  const present = new Set(tables.map(({ tablename }) => tablename));
  const missing = REQUIRED_TABLES.filter((name) => !present.has(name));
  const appliedMigrations = new Set(migrations.map(({ name }) => name));
  const missingMigrations = REQUIRED_MIGRATIONS.filter((prefix) => ![...appliedMigrations].some((name) => name.startsWith(prefix)));
  const migrationCount = migrations.length;
  const vectorReady = extensions.length === 1;

  console.log(`Migrations recorded: ${migrationCount}`);
  console.log(`Application tables: ${present.size}/${REQUIRED_TABLES.length}`);
  console.log(`pgvector: ${vectorReady ? "ready" : "missing"}`);
  if (missing.length || !vectorReady || missingMigrations.length) {
    if (missing.length) console.error(`Missing tables: ${missing.join(", ")}`);
    if (!vectorReady) console.error("Missing extension: vector");
    if (missingMigrations.length) console.error(`Missing migration ledger entries: ${missingMigrations.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Schema readiness: verified");
  }
} catch (error) {
  console.error("Schema verification failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
