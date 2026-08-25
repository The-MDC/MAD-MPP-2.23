"use client";

/**
 * MAD Gambit — browser side of SIWE sign-in.
 * ────────────────────────────────────────────────────────────────
 * The server half has been complete and unreachable. `GET /api/v1/auth/nonce`
 * issues a durable single-use nonce, `POST /api/v1/auth/verify` checks the
 * signature, the domain binding, the nonce and the chain, then sets a signed
 * httpOnly session cookie — and it fails closed if SESSION_SECRET is unset
 * rather than issuing a forgeable one.
 *
 * Nothing in the UI ever called either route. `wallet-gateway.tsx` ran a 1.5s
 * setTimeout and wrote the literal string "0xMAD...8888" into React state, and
 * every financial surface gated on that boolean. This module is the missing
 * half: a real EIP-1193 request, a real SiweMessage, a real personal_sign.
 *
 * No new dependency — `siwe` and `viem` are already in package.json, and
 * `SiweMessage` is isomorphic. That matters here: the npm registry is 403 from
 * the build container, so a solution needing a new package could not ship.
 *
 * The chain id comes from lib/chain.ts, NOT from lib/siwe-verify.ts — that
 * module imports node:crypto and the pg pool and must never reach the browser.
 */

import { SiweMessage } from "siwe";
import { SIGN_IN_CHAIN_ID, SIGN_IN_CHAIN_NAME } from "@/lib/chain";

/** The slice of EIP-1193 we actually use. Injected wallets provide far more. */
interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

export interface SessionInfo {
  authenticated: boolean;
  address: string | null;
  chainId: number | null;
}

export type SignInResult =
  | { ok: true; address: string }
  | { ok: false; error: string };

function injectedProvider(): Eip1193Provider | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
  return eth && typeof eth.request === "function" ? eth : null;
}

/** True when a browser wallet is present at all. Drives the UI's empty state. */
export function hasInjectedWallet(): boolean {
  return injectedProvider() !== null;
}

/** Ask the server who we are. Never throws; never 401s. */
export async function readSession(): Promise<SessionInfo> {
  try {
    const res = await fetch("/api/v1/auth/session", { cache: "no-store" });
    const d = await res.json();
    return {
      authenticated: Boolean(d?.authenticated),
      address: typeof d?.address === "string" ? d.address : null,
      chainId: typeof d?.chainId === "number" ? d.chainId : null,
    };
  } catch {
    return { authenticated: false, address: null, chainId: null };
  }
}

/**
 * Full sign-in: connect → nonce → sign → verify → httpOnly cookie.
 *
 * Returns a typed failure rather than throwing, because every failure here is
 * something the user needs to read: no wallet installed, they rejected the
 * signature, the nonce expired, the domain did not match.
 */
export async function signInWithEthereum(): Promise<SignInResult> {
  const provider = injectedProvider();
  if (!provider) {
    return { ok: false, error: "No browser wallet found. Install one to sign in." };
  }

  let address: string;
  try {
    const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return { ok: false, error: "Wallet returned no accounts." };
    }
    address = accounts[0];
  } catch {
    return { ok: false, error: "Wallet connection was rejected." };
  }

  let nonce: string;
  try {
    const res = await fetch("/api/v1/auth/nonce", { cache: "no-store" });
    const d = await res.json();
    if (typeof d?.nonce !== "string") return { ok: false, error: "Could not get a sign-in nonce." };
    nonce = d.nonce;
  } catch {
    return { ok: false, error: "Could not reach the sign-in service." };
  }

  // `domain` must equal the host the server sees, or verifySiwe rejects it —
  // that binding is what stops a signature harvested on another site from
  // working here. window.location.host is exactly that value.
  const message = new SiweMessage({
    domain: window.location.host,
    address,
    statement: `Sign in to MAD Gambit on ${SIGN_IN_CHAIN_NAME}. This does not authorise any transaction.`,
    uri: window.location.origin,
    version: "1",
    chainId: SIGN_IN_CHAIN_ID,
    nonce,
    issuedAt: new Date().toISOString(),
  }).prepareMessage();

  let signature: string;
  try {
    signature = (await provider.request({
      method: "personal_sign",
      params: [message, address],
    })) as string;
  } catch {
    return { ok: false, error: "Signature rejected." };
  }

  try {
    const res = await fetch("/api/v1/auth/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, signature }),
    });
    const d = await res.json();
    if (!res.ok || !d?.ok) {
      return { ok: false, error: typeof d?.error === "string" ? d.error : "Sign-in failed." };
    }
    // The server answers ok:true with session:false when SESSION_SECRET is
    // unset. That is a real deployment fault, not a successful sign-in — say so
    // instead of showing a connected state no route will honour.
    if (d.session === false) {
      return { ok: false, error: "Sessions are disabled on this deployment (SESSION_SECRET unset)." };
    }
    return { ok: true, address: typeof d.address === "string" ? d.address : address };
  } catch {
    return { ok: false, error: "Sign-in failed." };
  }
}

/** Clear the session cookie server-side. React state alone never signed anyone out. */
export async function signOut(): Promise<void> {
  try {
    await fetch("/api/v1/auth/logout", { method: "POST" });
  } catch {
    /* best effort — the caller clears local state either way */
  }
}
