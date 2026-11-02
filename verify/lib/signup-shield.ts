/**
 * Signup shield — defense against automated and agentic signups.
 * ───────────────────────────────────────────────────────────────
 * Proven, privacy-friendly layers (no third-party CAPTCHA, no tracking), applied to every public form that creates
 * something: the beta waitlist, open-beta admission, invite redemption and support tickets.
 *
 *   1. PROOF OF WORK (the hashcash / ALTCHA approach). The server issues a signed challenge; the browser must find a
 *      nonce whose SHA-256 has DIFFICULTY leading zero bits. A person's browser spends well under a second; a bot farm
 *      pays it on every single attempt. Challenges are HMAC-signed, expire, and are single-use (replay is refused).
 *   2. TIME TRAP. The challenge carries its issue time inside the signature. A form submitted faster than a human can
 *      fill it (MIN_FILL_MS) is refused; so is one older than the challenge's life.
 *   3. HONEYPOT. Hidden fields no person sees or fills. A filled honeypot gets a quiet fake success (so the bot learns
 *      nothing) and nothing is stored.
 *   4. EMAIL HYGIENE. Disposable-mail domains are refused, and addresses are canonicalised (Gmail dots and +tags) so one
 *      inbox cannot become a thousand signups.
 *   5. The agent-defense client score and the per-IP rate limits apply on top (lib/agent-defense.ts, lib/rate-limit.ts).
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DIFFICULTY = 18;          // ~260k hashes on average: well under a second in a modern browser
export const CHALLENGE_TTL_MS = 20 * 60_000;
export const MIN_FILL_MS = 2_500;
export const HONEYPOT_FIELDS = ["website", "url", "company", "fax", "middle_name"] as const;

let devSecret: string | null = null;
export function shieldSecret(env: Record<string, string | undefined> = process.env): string {
  const s = env.SIGNUP_SHIELD_SECRET?.trim() || env.SESSION_SECRET?.trim();
  if (s && s.length >= 16) return s;
  devSecret ??= randomBytes(32).toString("hex"); // per instance: challenges still verify on the instance that issued them
  return devSecret;
}

export interface Challenge { salt: string; difficulty: number; issued: number; expires: number; sig: string }

const sign = (c: Omit<Challenge, "sig">, secret: string) => createHmac("sha256", secret).update(`${c.salt}|${c.difficulty}|${c.issued}|${c.expires}`).digest("hex");

export function issueChallenge(now = Date.now(), secret = shieldSecret(), difficulty = DIFFICULTY): Challenge {
  const base = { salt: randomBytes(12).toString("hex"), difficulty, issued: now, expires: now + CHALLENGE_TTL_MS };
  return { ...base, sig: sign(base, secret) };
}

export function leadingZeroBits(hex: string): number {
  let bits = 0;
  for (const ch of hex) {
    const v = parseInt(ch, 16);
    if (v === 0) { bits += 4; continue; }
    return bits + (v < 2 ? 3 : v < 4 ? 2 : v < 8 ? 1 : 0);
  }
  return bits;
}

export const powHash = (salt: string, nonce: string | number) => createHash("sha256").update(`${salt}:${nonce}`).digest("hex");

const used = new Map<string, number>(); // salt -> expiry, for replay refusal

export type ShieldFail = "missing" | "bad-signature" | "expired" | "too-fast" | "replayed" | "bad-work" | "weak";

/** Verify a solved challenge. Marks it used on success. */
export function verifyChallenge(raw: unknown, now = Date.now(), secret = shieldSecret(), minDifficulty = DIFFICULTY): { ok: true } | { ok: false; reason: ShieldFail } {
  if (!raw || typeof raw !== "object") return { ok: false, reason: "missing" };
  const c = raw as Record<string, unknown>;
  const salt = typeof c.salt === "string" && /^[a-f0-9]{24}$/.test(c.salt) ? c.salt : null;
  const difficulty = Number(c.difficulty), issued = Number(c.issued), expires = Number(c.expires);
  const nonce = typeof c.nonce === "string" || typeof c.nonce === "number" ? String(c.nonce).slice(0, 24) : null;
  if (!salt || !nonce || typeof c.sig !== "string") return { ok: false, reason: "missing" };
  if (!Number.isFinite(difficulty) || difficulty < minDifficulty) return { ok: false, reason: "weak" };
  const want = Buffer.from(sign({ salt, difficulty, issued, expires }, secret));
  const got = Buffer.from(c.sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return { ok: false, reason: "bad-signature" };
  if (now > expires) return { ok: false, reason: "expired" };
  if (now - issued < MIN_FILL_MS) return { ok: false, reason: "too-fast" };
  for (const [s, exp] of used) if (exp < now) used.delete(s);
  if (used.has(salt)) return { ok: false, reason: "replayed" };
  if (leadingZeroBits(powHash(salt, nonce)) < difficulty) return { ok: false, reason: "bad-work" };
  used.set(salt, expires);
  return { ok: true };
}

export const resetShield = () => used.clear();

export function honeypotTripped(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return HONEYPOT_FIELDS.some((f) => typeof b[f] === "string" && (b[f] as string).trim() !== "");
}

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.info", "sharklasers.com", "10minutemail.com", "10minutemail.net", "tempmail.com", "temp-mail.org",
  "temp-mail.io", "throwawaymail.com", "yopmail.com", "yopmail.net", "getnada.com", "nada.email", "trashmail.com", "dispostable.com", "maildrop.cc",
  "mintemail.com", "mohmal.com", "emailondeck.com", "fakeinbox.com", "tempinbox.com", "burnermail.io", "mailnesia.com", "spamgourmet.com",
  "moakt.com", "tempr.email", "discard.email", "inboxkitten.com", "mailcatch.com", "linshiyouxiang.net", "33mail.com", "anonaddy.me",
]);

export const isDisposableEmail = (email: string): boolean => DISPOSABLE.has(email.split("@")[1]?.toLowerCase() ?? "");

/** One inbox, one signup: lower-case, strip +tags everywhere, and dots for Gmail. */
export function canonicalEmail(email: string): string {
  const [local, domain] = email.trim().toLowerCase().split("@");
  if (!local || !domain) return email.trim().toLowerCase();
  let l = local.split("+")[0];
  const d = domain === "googlemail.com" ? "gmail.com" : domain;
  if (d === "gmail.com") l = l.replace(/\./g, "");
  return `${l}@${d}`;
}
