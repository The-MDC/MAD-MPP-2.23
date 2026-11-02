"use client";

/**
 * Browser side of the signup shield: fetch a challenge and solve its proof of work with WebCrypto, in small batches so
 * the page never freezes. Returns the solved challenge to send with the form, or null if the shield is unreachable.
 */
export interface SolvedChallenge { salt: string; difficulty: number; issued: number; expires: number; sig: string; nonce: string }

function zeroBits(bytes: Uint8Array): number {
  let bits = 0;
  for (const b of bytes) {
    if (b === 0) { bits += 8; continue; }
    return bits + Math.clz32(b) - 24;
  }
  return bits;
}

export async function solveSignupChallenge(signal?: AbortSignal): Promise<SolvedChallenge | null> {
  try {
    const res = await fetch("/api/v1/beta/challenge", { cache: "no-store", signal });
    if (!res.ok) return null;
    const c = (await res.json()) as Omit<SolvedChallenge, "nonce">;
    const enc = new TextEncoder();
    for (let n = 0; n < 50_000_000; n++) {
      const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(`${c.salt}:${n}`)));
      if (zeroBits(digest) >= c.difficulty) return { ...c, nonce: String(n) };
      if (n % 2000 === 0) {
        if (signal?.aborted) return null;
        await new Promise((r) => setTimeout(r, 0)); // yield to the page
      }
    }
    return null;
  } catch {
    return null;
  }
}

/** Hidden honeypot inputs: rendered off-screen, skipped by keyboards and screen readers, never filled by a person. */
export const HONEYPOT_STYLE: React.CSSProperties = { position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" };
