/**
 * SIWE (EIP-4361) verification — closes the "signature verification
 * unwired" security gap. Server-side only.
 *
 * Uses the `siwe` + `viem` packages already in package.json.
 * Flow: client asks GET /api/v1/auth/nonce → signs a SiweMessage →
 * POST /api/v1/auth/verify { message, signature } → signed httpOnly session.
 *
 * Hard requirements enforced here (the ones that are usually skipped
 * and later exploited):
 *   1. signature actually recovers to message.address (siwe.verify)
 *   2. domain binding — message.domain must equal our host
 *   3. nonce is single-use and server-issued (replay protection) — now backed
 *      by a durable store (see nonce-store.ts) so it holds across instances
 *   4. chainId must be Arbitrum Nova (42170) — launch chain; MAD Shield
 *      vaults live on Arbitrum One (42161) but sign-in binds to Nova
 *   5. expirationTime / notBefore honored when present
 */
import { SiweMessage } from "siwe";
import { consumeNonce } from "./nonce-store";
import { SIGN_IN_CHAIN_ID } from "@/lib/chain";

// Re-exported so existing callers (auth/nonce route) keep importing from here.
export { issueNonce } from "./nonce-store";

/** Arbitrum Nova — launch/gameplay chain. Defined in lib/chain.ts because the
 *  browser needs the same value to BUILD the message this file then verifies,
 *  and this module is server-only (nonce-store pulls in node:crypto + pg). */
export const EXPECTED_CHAIN_ID = SIGN_IN_CHAIN_ID;

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

  // 3. server-issued, single-use nonce. Atomic consume burns it before the
  //    rest of validation, so a nonce is spent even on a failed attempt.
  if (!(await consumeNonce(siwe.nonce)))
    return { ok: false, error: "unknown, reused, or expired nonce" };

  // 2. domain binding
  if (siwe.domain !== expectedDomain)
    return { ok: false, error: `domain mismatch: ${siwe.domain} != ${expectedDomain}` };

  // 4. chain binding
  if (siwe.chainId !== EXPECTED_CHAIN_ID)
    return { ok: false, error: `wrong chain: ${siwe.chainId}, expected ${EXPECTED_CHAIN_ID} (Arbitrum Nova)` };

  // 1 + 5. cryptographic verification (recovers signer, checks time bounds)
  try {
    const result = await siwe.verify({ signature });
    if (!result.success) return { ok: false, error: "signature verification failed" };
  } catch (e) {
    return { ok: false, error: `verification error: ${e instanceof Error ? e.message : "unknown"}` };
  }

  return { ok: true, address: siwe.address as `0x${string}` };
}
