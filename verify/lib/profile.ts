/**
 * Profiles: completion, safe fields and the email policy.
 * ──────────────────────────────────────────────────────
 * COMPLETION is weighted to 100. File upload in the concierge needs signup complete AND at least 90%, so a member can
 * skip at most one of the two cosmetic items (avatar or bio), never an identity item.
 *
 *   beta pass 15 · wallet 15 · display name 15 · email on file 15 · email verified 20 · avatar 10 · bio 10
 *
 * EMAIL is accepted only when it can be verified:
 *   - a personal address at a known mailbox provider (Gmail, Outlook, iCloud, Proton, Yahoo…), or
 *   - an address at a domain that publishes mail exchangers (MX records), i.e. a real, mail-receiving domain;
 *   and never a disposable or role inbox (noreply@, admin@, postmaster@…). Then it must be PROVEN: a six-digit code is
 *   mailed to it and only its hash is stored. Unverified email counts 15, not 35.
 *
 * AVATARS are picked from the platform's own brand set. No arbitrary image URLs: an avatar URL is a tracking pixel or
 * an SVG payload waiting to happen.
 */
import { createHash, randomInt } from "node:crypto";
import { isDisposableEmail } from "@/lib/signup-shield";

export const UPLOAD_MIN_COMPLETION = 90;

export const AVATARS = Object.freeze({
  "madhatr": "/brand/madhatr-bust.png",
  "madhatr-logo": "/brand/madhatr-logo.png",
}) as Readonly<Record<string, string>>;

export interface ProfileFacts { beta: boolean; wallet: boolean; displayName: string | null; email: string | null; emailVerified: boolean; avatar: string | null; bio: string | null }

export const COMPLETION_WEIGHTS = { beta: 15, wallet: 15, displayName: 15, email: 15, emailVerified: 20, avatar: 10, bio: 10 } as const;

export function profileCompletion(p: ProfileFacts): { percent: number; missing: string[] } {
  const have: Record<keyof typeof COMPLETION_WEIGHTS, boolean> = {
    beta: p.beta, wallet: p.wallet, displayName: !!p.displayName?.trim(), email: !!p.email, emailVerified: !!p.email && p.emailVerified,
    avatar: !!p.avatar, bio: !!p.bio && p.bio.trim().length >= 10,
  };
  let percent = 0;
  const missing: string[] = [];
  const LABEL: Record<string, string> = { beta: "beta access", wallet: "wallet sign-in", displayName: "display name", email: "email", emailVerified: "email verification", avatar: "avatar", bio: "short bio" };
  for (const [k, w] of Object.entries(COMPLETION_WEIGHTS) as [keyof typeof COMPLETION_WEIGHTS, number][]) {
    if (have[k]) percent += w; else missing.push(LABEL[k]);
  }
  return { percent, missing };
}

/* ── safe fields ─────────────────────────────────────────────────────── */

// eslint-disable-next-line no-control-regex
const CTRL = /[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g;

export function cleanDisplayName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.normalize("NFKC").replace(CTRL, "").replace(/[<>"'`]/g, "").replace(/\s+/g, " ").trim();
  return s.length >= 2 && s.length <= 40 ? s : null;
}

export function cleanBio(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.normalize("NFKC").replace(CTRL, "").replace(/<[^>]*>/g, "").replace(/https?:\/\/\S+/gi, "").replace(/\s+/g, " ").trim();
  return s.length <= 280 ? s : s.slice(0, 280);
}

export const avatarFor = (key: unknown): string | null => (typeof key === "string" && Object.prototype.hasOwnProperty.call(AVATARS, key) ? AVATARS[key] : null);

/* ── email policy ────────────────────────────────────────────────────── */

export const PERSONAL_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "icloud.com", "me.com", "mac.com",
  "yahoo.com", "ymail.com", "aol.com", "proton.me", "protonmail.com", "pm.me", "zoho.com", "fastmail.com", "gmx.com", "gmx.net",
  "mail.com", "yandex.com", "tutanota.com", "tuta.io", "hey.com",
]);
const ROLE_LOCAL = /^(no-?reply|do-?not-?reply|admin|administrator|postmaster|hostmaster|webmaster|abuse|root|mailer-daemon|info|support|sales|billing|security|test)$/i;
const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$/;

export type MxResolver = (domain: string) => Promise<{ exchange: string; priority: number }[]>;

export interface EmailVerdict { ok: boolean; email: string | null; kind: "personal" | "domain" | null; reason?: string }

/** Is this an address we can verify? Personal providers pass on the list; any other domain must publish MX records. */
export async function checkEmail(raw: unknown, resolveMx: MxResolver): Promise<EmailVerdict> {
  if (typeof raw !== "string") return { ok: false, email: null, kind: null, reason: "Enter an email address." };
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, email: null, kind: null, reason: "That email doesn't look right." };
  const [local, domain] = email.split("@");
  if (ROLE_LOCAL.test(local.split("+")[0])) return { ok: false, email: null, kind: null, reason: "Use a personal address, not a shared or no-reply inbox." };
  if (isDisposableEmail(email)) return { ok: false, email: null, kind: null, reason: "Disposable email addresses can't be verified." };
  if (PERSONAL_PROVIDERS.has(domain)) return { ok: true, email, kind: "personal" };
  try {
    const mx = await resolveMx(domain);
    const real = mx.filter((r) => r.exchange && r.exchange !== "." && r.exchange !== "localhost");
    if (real.length) return { ok: true, email, kind: "domain" };
    return { ok: false, email: null, kind: null, reason: "That domain doesn't receive email (it has no mail servers)." };
  } catch {
    return { ok: false, email: null, kind: null, reason: "That domain doesn't receive email, so it can't be verified." };
  }
}

/* ── verification codes ──────────────────────────────────────────────── */

export const CODE_TTL_MS = 15 * 60_000;
export const CODE_MAX_ATTEMPTS = 5;

export function newEmailCode(): string { return String(randomInt(0, 1_000_000)).padStart(6, "0"); }
export function hashEmailCode(code: string, wallet: string, email: string, pepper = process.env.SESSION_SECRET ?? "mg-email"): string {
  return createHash("sha256").update(`${pepper}|${wallet.toLowerCase()}|${email}|${code}`).digest("hex");
}
