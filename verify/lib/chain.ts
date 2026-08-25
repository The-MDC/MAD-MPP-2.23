/**
 * Chain constants that BOTH sides need.
 * ────────────────────────────────────────────────────────────────
 * `lib/siwe-verify.ts` cannot be imported from a client component — it pulls in
 * `lib/nonce-store.ts`, which imports `node:crypto` and the `pg` pool. But the
 * browser has to build a SIWE message with the same chainId the server will
 * check, and `verifySiwe` rejects any other value outright.
 *
 * Hard-coding 42170 in a second place would work right up until someone moved
 * the chain and only found the copy that mattered. This file is the one source;
 * siwe-verify re-exports from here.
 */

/** Arbitrum Nova — the launch/gameplay chain that sign-in binds to. */
export const SIGN_IN_CHAIN_ID = 42170;

export const SIGN_IN_CHAIN_NAME = "Arbitrum Nova";

/**
 * MAD Shield vaults live on Arbitrum One (42161), NOT here. Sign-in binding and
 * vault custody are deliberately different chains; don't "fix" one to match the
 * other without reading lib/siwe-verify.ts's header first.
 */
export const VAULT_CHAIN_ID = 42161;
