/**
 * MAD Gambit — live DB smoke test.
 *
 * Proves the real backend path end-to-end against DATABASE_URL: it writes and
 * reads a row in every core table the API depends on, then ROLLS BACK so no test
 * data persists. If this passes in CI (against the ephemeral Neon branch), the
 * schema is genuinely applied and the app's live read/write path works — this is
 * the check that separates a real backend from a demo-only facade.
 *
 *   DATABASE_URL=postgres://... node scripts/db-smoke.mjs
 */
import pg from "pg";

const { Client } = pg;
const ZERO = "0x0000000000000000000000000000000000000000";

function assert(cond, msg) {
  if (!cond) {
    console.error(`❌ smoke assert failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL ?? process.env.NEON_SKY_PARK_DATABASE_URL ?? process.env.NEO_DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not set — cannot smoke-test.");
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(
      `INSERT INTO events_stream (event_type, wallet_address, payload)
       VALUES ('smoke_test', $1, '{"smoke":true}')`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM events_stream WHERE event_type='smoke_test'`)).rows[0].n >= 1,
      "events_stream write+read",
    );

    await client.query(
      `INSERT INTO shield_positions (wallet_address, tier, stake_amount, premium_paid, status, return_window_hours)
       VALUES ($1, 'standard', 1000, 20, 'active', 2)`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM shield_positions WHERE wallet_address=$1`, [ZERO])).rows[0].n >= 1,
      "shield_positions write+read",
    );

    await client.query(
      `INSERT INTO cards (wallet_address, card_uid, rarity) VALUES ($1, 'smoke_card', 'Common')`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM cards WHERE card_uid='smoke_card'`)).rows[0].n >= 1,
      "cards write+read",
    );

    await client.query(`INSERT INTO celebrity_whitelist (name) VALUES ('smoke celeb') ON CONFLICT DO NOTHING`);
    await client.query(`INSERT INTO gdelt_signals (headline, perp_probability) VALUES ('smoke headline', 0.5)`);
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM gdelt_signals WHERE headline='smoke headline'`)).rows[0].n >= 1,
      "gdelt_signals write+read",
    );

    await client.query(`INSERT INTO market_intelligence (title, content) VALUES ('smoke title', 'smoke content')`);
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM market_intelligence WHERE title='smoke title'`)).rows[0].n >= 1,
      "market_intelligence write+read",
    );

    await client.query(
      `INSERT INTO card_stats (id, owner, evolution_level) VALUES ('smoke_card_stats', $1, 1)`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM card_stats WHERE id='smoke_card_stats'`)).rows[0].n >= 1,
      "card_stats write+read",
    );

    // 0027: a market cannot exist without a resolution spec, so the smoke market gets one (rolled back with the rest).
    const smokeHash = "a".repeat(64);
    await client.query(
      `INSERT INTO resolution_specs (id, family, schema_version, spec, spec_hash)
       VALUES ('rs_' || left($1::text, 16), 'smoke', 1, '{}'::jsonb, $1::text)`,
      [smokeHash],
    );
    await client.query(
      `INSERT INTO markets (id, title, creator_wallet, resolution_spec_id) VALUES ('smoke_market', 'Smoke market?', $1, $2)`,
      [ZERO, "rs_" + smokeHash.slice(0, 16)],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM markets WHERE id='smoke_market'`)).rows[0].n >= 1,
      "markets write+read",
    );

    await client.query(
      `INSERT INTO bets (market_id, wallet_address, side, amount, odds_at_bet)
       VALUES ('smoke_market', $1, 'YES', 100, 2.0)`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM bets WHERE market_id='smoke_market'`)).rows[0].n >= 1,
      "bets write+read",
    );

    await client.query(
      `INSERT INTO audit_log (entity_type, entity_id, action, details) VALUES ('market','smoke_market','create','{"smoke":true}')`,
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM audit_log WHERE entity_id='smoke_market'`)).rows[0].n >= 1,
      "audit_log write+read",
    );

    // gdelt url dedup — the unique index makes live ingest idempotent (Phase 1).
    await client.query(
      `INSERT INTO gdelt_signals (headline, url) VALUES ('smoke dedup', 'smoke://dedup')
       ON CONFLICT (url) WHERE url IS NOT NULL DO NOTHING`,
    );
    await client.query(
      `INSERT INTO gdelt_signals (headline, url) VALUES ('smoke dedup 2', 'smoke://dedup')
       ON CONFLICT (url) WHERE url IS NOT NULL DO NOTHING`,
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM gdelt_signals WHERE url='smoke://dedup'`)).rows[0].n === 1,
      "gdelt_signals url dedup (unique index)",
    );

    await client.query(`INSERT INTO madx_accounts (owner, balance, staked) VALUES ($1, 500, 100)`, [ZERO]);
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM madx_accounts WHERE owner=$1`, [ZERO])).rows[0].n >= 1,
      "madx_accounts write+read",
    );

    await client.query(`INSERT INTO madx_ledger (owner, kind, amount, note) VALUES ($1, 'welcome', 500, 'smoke')`, [ZERO]);
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM madx_ledger WHERE owner=$1`, [ZERO])).rows[0].n >= 1,
      "madx_ledger write+read",
    );

    assert(
      (await client.query(`SELECT count(*)::int AS n FROM madx_supply WHERE id=1`)).rows[0].n === 1,
      "madx_supply singleton present",
    );

    // SIWE nonce store. This is the table whose migration was missing, which
    // broke sign-in on every preview branch — cover it so that can't recur
    // silently. Exercises the real single-use contract, not just a write:
    // consumeNonce()'s DELETE ... RETURNING must match exactly once.
    await client.query(`INSERT INTO siwe_nonces (nonce) VALUES ('smoke_nonce')`);
    assert(
      (await client.query(
        `DELETE FROM siwe_nonces WHERE nonce='smoke_nonce'
           AND issued_at > now() - interval '5 minutes' RETURNING nonce`,
      )).rowCount === 1,
      "siwe_nonces issue + single-use consume",
    );
    assert(
      (await client.query(
        `DELETE FROM siwe_nonces WHERE nonce='smoke_nonce' RETURNING nonce`,
      )).rowCount === 0,
      "siwe_nonces second consume is a no-op (replay protection)",
    );

    await client.query(
      `INSERT INTO user_profiles (wallet_address, display_name, email) VALUES ($1, 'smoke player', 'smoke@example.test')`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM user_profiles WHERE wallet_address=$1`, [ZERO])).rows[0].n === 1,
      "user_profiles write+read",
    );
    // Case-insensitive uniqueness must actually bite — a differently-cased
    // duplicate email is how you'd otherwise squat another player's address.
    let dupeRejected = false;
    await client.query("SAVEPOINT sp_dupe");
    try {
      await client.query(
        `INSERT INTO user_profiles (wallet_address, email) VALUES ('0x00000000000000000000000000000000000000ff', 'SMOKE@EXAMPLE.TEST')`,
      );
    } catch {
      dupeRejected = true;
      await client.query("ROLLBACK TO SAVEPOINT sp_dupe");
    }
    assert(dupeRejected, "user_profiles rejects case-variant duplicate email");

    // System-asserted account state (0011). Deliberately coexists with
    // user_profiles above: same wallet key, different writer. user_profiles is
    // user-written; these three are written only by the auth path. See the
    // "One identity key, many projections" section in verify/sql/README.md.
    await client.query(
      `INSERT INTO customer_accounts (wallet_address, chain_id, last_login_at, login_count)
       VALUES ($1, 42170, now(), 1)
       ON CONFLICT (wallet_address) DO UPDATE SET last_login_at=now(), login_count=customer_accounts.login_count + 1`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM customer_accounts WHERE wallet_address=$1`, [ZERO])).rows[0].n === 1,
      "customer_accounts upsert+read",
    );

    await client.query(
      `INSERT INTO customer_login_events (wallet_address, chain_id, domain, user_agent_hash)
       VALUES ($1, 42170, 'smoke.local', 'smoke_hash')`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM customer_login_events WHERE wallet_address=$1`, [ZERO])).rows[0].n >= 1,
      "customer_login_events write+read",
    );

    await client.query(
      `INSERT INTO customer_profile_audit (wallet_address, actor_wallet, action, changes)
       VALUES ($1, $1, 'smoke', '{"smoke":true}')`,
      [ZERO],
    );
    assert(
      (await client.query(`SELECT count(*)::int AS n FROM customer_profile_audit WHERE wallet_address=$1`, [ZERO])).rows[0].n >= 1,
      "customer_profile_audit write+read",
    );

    console.log("✅ DB smoke passed — live read/write verified across all core tables");
  } catch (err) {
    console.error(`❌ smoke failed: ${err.message}`);
    await client.query("ROLLBACK").catch(() => {});
    await client.end();
    process.exit(1);
  }

  await client.query("ROLLBACK"); // leave no test data
  await client.end();
}

main().catch((err) => {
  console.error("❌ smoke crashed:", err);
  process.exit(1);
});
