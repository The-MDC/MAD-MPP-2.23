import { createHash } from "crypto";
import { getDbPool } from "./db";
import { hasDatabaseUrl } from "@/lib/database-url";

function normalizeWallet(address: string): `0x${string}` {
  return address.toLowerCase() as `0x${string}`;
}

function sha256OrNull(value: string | null): string | null {
  if (!value) return null;
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Persist a successful SIWE login without storing signatures, raw session
 * tokens, raw IPs, or other credentials. Auth should remain available even if
 * this audit write fails, so callers intentionally catch/log errors.
 */
export async function recordSuccessfulLogin(address: string, chainId: number, req: Request): Promise<void> {
  if (!hasDatabaseUrl()) return;

  const wallet = normalizeWallet(address);
  const domain = req.headers.get("host")?.slice(0, 255) ?? null;
  const userAgentHash = sha256OrNull(req.headers.get("user-agent"));
  const pool = getDbPool();

  await pool.query(
    `INSERT INTO customer_accounts (wallet_address, chain_id, first_seen, last_login_at, login_count)
     VALUES ($1, $2, now(), now(), 1)
     ON CONFLICT (wallet_address) DO UPDATE
       SET chain_id = EXCLUDED.chain_id,
           last_login_at = now(),
           login_count = customer_accounts.login_count + 1,
           updated_at = now()`,
    [wallet, chainId],
  );

  await pool.query(
    `INSERT INTO customer_login_events (wallet_address, chain_id, domain, user_agent_hash)
     VALUES ($1, $2, $3, $4)`,
    [wallet, chainId, domain, userAgentHash],
  );
}
