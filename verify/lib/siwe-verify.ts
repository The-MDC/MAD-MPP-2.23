/**
 * SIWE (EIP-4361) verification — closes the "signature verification
 * unwired" security gap. Server-side only.
 *
 * Uses the `siwe` + `viem` packages already in package.json.
 * Flow: client asks GET /api/v1/auth/nonce → signs a SiweMessage →
 * POST /api/v1/auth/verify { message, signature } → httpOnly session.
 *
 * Hard requirements enforced here (the ones that are usually skipped
 * and later exploited):
 *   1. signature actually recovers to message.address (siwe.verify)
 *   2. domain binding — message.domain must equal our host
 *   3. nonce is single-use and server-issued (replay protection)
 *   4. chainId must be Arbitrum One (42161) per foundry.toml canon
 *   5. expirationTime / notBefore honored when present
 */
import { SiweMessage } from "siwe";
import { randomBytes } from "crypto";

export const EXPECTED_CHAIN_ID = 42161; // Arbitrum One — matches contracts
const NONCE_TTL_MS = 5 * 60 * 1000;

// In-memory nonce store. NOTE: single-instance only — swap for your
// KV/Redis when scaling horizontally. Map<nonce, issuedAt>.
const nonces = new Map<string, number>();

export function issueNonce(): string {
  // prune expired
  const now = Date.now();
  nonces.forEach((t, n) => { if (now - t > NONCE_TTL_MS) nonces.delete(n); });
  const nonce = randomBytes(16).toString("hex");
  nonces.set(nonce, now);
  return nonce;
}

export interface SiweVerifyResult {
  ok: boolean;
  address?: `0x${string}`;
  error?: string;
}

export async function verifySiwe(
  message: string,
  signature: string,
  expectedDomain: string
): Promise<SiweVerifyResult> {
  let siwe: SiweMessage;
  try {
    siwe = new SiweMessage(message);
  } catch {
    return { ok: false, error: "malformed SIWE message" };
  }

  // 3. server-issued, single-use nonce
  const issued = nonces.get(siwe.nonce);
  if (issued === undefined) return { ok: false, error: "unknown or reused nonce" };
  if (Date.now() - issued > NONCE_TTL_MS) {
    nonces.delete(siwe.nonce);
    return { ok: false, error: "nonce expired" };
  }
  nonces.delete(siwe.nonce); // burn before verify — single use even on failure

  // 2. domain binding
  if (siwe.domain !== expectedDomain)
    return { ok: false, error: `domain mismatch: ${siwe.domain} != ${expectedDomain}` };

  // 4. chain binding
  if (siwe.chainId !== EXPECTED_CHAIN_ID)
    return { ok: false, error: `wrong chain: ${siwe.chainId}, expected ${EXPECTED_CHAIN_ID} (Arbitrum One)` };

  // 1 + 5. cryptographic verification (recovers signer, checks time bounds)
  try {
    const result = await siwe.verify({ signature });
    if (!result.success) return { ok: false, error: "signature verification failed" };
  } catch (e) {
    return { ok: false, error: `verification error: ${e instanceof Error ? e.message : "unknown"}` };
  }

  return { ok: true, address: siwe.address as `0x${string}` };
}
