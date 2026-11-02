/**
 * Beta programme: closed → extended open → general availability.
 * ───────────────────────────────────────────────────────────────
 *   closed    invite-only. Single-use codes, sent in waves (cohorts) from the waitlist by staff.
 *   open      the extended open beta. Anyone may self-admit from the beta page up to a capacity cap; invite codes
 *             still work and skip the queue. Known issues are published; feedback is actively requested.
 *   ga        general availability: the beta gate opens.
 *
 * The phase is an OPERATOR setting (env BETA_PHASE), read by the gate on every request, so it cannot be flipped by a
 * database write or a compromised admin session. Capacity (BETA_CAPACITY) is enforced at admission time.
 * Invite codes are stored only as SHA-256 hashes; the plaintext is shown to staff once.
 */
import { createHash, randomBytes } from "node:crypto";

export type BetaPhase = "closed" | "open" | "ga";

export function betaPhase(env: Record<string, string | undefined> = process.env): BetaPhase {
  const p = env.BETA_PHASE?.trim().toLowerCase();
  return p === "open" || p === "extended" || p === "extended-open" ? "open" : p === "ga" ? "ga" : "closed";
}

export function betaCapacity(env: Record<string, string | undefined> = process.env): number {
  const n = Math.floor(Number(env.BETA_CAPACITY));
  return Number.isFinite(n) && n > 0 ? n : 1000;
}

export const PHASE_COPY: Record<BetaPhase, { name: string; howToJoin: string }> = {
  closed: { name: "Closed beta", howToJoin: "It's invite-only right now. Join the waitlist on the beta page; invites go out in waves, creators first. Got a code? Redeem it on the same page." },
  open: { name: "Extended open beta", howToJoin: "The doors are open while spots last. Hit 'Enter the open beta' on the beta page. Invite codes still skip the queue." },
  ga: { name: "Live", howToJoin: "No velvet rope any more. Come on in." },
};

/** A human-friendly code: MAD-XXXX-XXXX (no look-alike characters). */
export function newInviteCode(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const b = randomBytes(8);
  const s = Array.from(b, (x) => a[x % a.length]).join("");
  return `MAD-${s.slice(0, 4)}-${s.slice(4, 8)}`;
}

export const normaliseCode = (c: unknown): string | null => {
  if (typeof c !== "string") return null;
  const v = c.trim().toUpperCase().replace(/[\s_]/g, "-");
  return /^MAD-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(v) ? v : null;
};

export const hashCode = (code: string): string => createHash("sha256").update(`mg-invite|${code}`).digest("hex");

/** The pass user name an invite or open-beta admission is issued under. HMAC-signed by the gate, never typed by a user. */
export const inviteUser = (kind: "invite" | "open", id: number | string): string => `${kind}:${String(id).replace(/[^\w-]/g, "").slice(0, 24)}`;
export const isInviteUser = (user: string): boolean => /^(invite|open):[\w-]{1,24}$/.test(user);
