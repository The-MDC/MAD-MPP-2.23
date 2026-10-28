/**
 * MAD Gambit — private-beta gate.
 *
 * Shared by `proxy.ts` and the `/api/v1/beta/*` routes. Visitors without a pass
 * land on `/beta` (request access, or Creator Sign-in) instead of the browser's
 * Basic-auth popup. A successful Creator Sign-in sets an HttpOnly cookie holding
 * `user.expiry` plus an HMAC-SHA256 over it; the proxy re-checks the HMAC on
 * every request, so the cookie cannot be forged or extended client-side.
 *
 * Credentials are the same `GUEST_LOGINS` / `GUEST_USER`+`GUEST_PASS` env the
 * Basic gate always used — nothing new to configure. The signing key is
 * `SESSION_SECRET`; if it is unset the key falls back to a digest of the guest
 * list itself, which is still secret and rotates whenever a guest password does.
 *
 * Web Crypto only (`crypto.subtle`), so this runs unchanged in the proxy and in
 * Node route handlers.
 */

export const BETA_COOKIE = "mg_beta";
export const BETA_TTL_SECONDS = 7 * 24 * 60 * 60; // a week on the floor per sign-in

export function loadGuests(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of (process.env.GUEST_LOGINS ?? "").split(",")) {
    const pair = entry.trim();
    if (!pair) continue;
    const sep = pair.indexOf(":");
    if (sep <= 0 || sep === pair.length - 1) continue; // malformed: no user, or no pass
    out[pair.slice(0, sep)] = pair.slice(sep + 1);
  }
  if (process.env.GUEST_USER && process.env.GUEST_PASS) {
    out[process.env.GUEST_USER] = process.env.GUEST_PASS;
  }
  return out;
}

/** Length-independent comparison, so a wrong password leaks no prefix timing. */
function sameString(a: string, b: string): boolean {
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

export function guestValid(guests: Record<string, string>, user: string, pass: string): boolean {
  return Object.prototype.hasOwnProperty.call(guests, user) && sameString(guests[user], pass);
}

function keyMaterial(): string {
  return process.env.SESSION_SECRET || `mg-beta|${process.env.GUEST_LOGINS ?? ""}|${process.env.GUEST_PASS ?? ""}`;
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(keyMaterial()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** `base64url(user).expiry.hmac` */
export async function signPass(user: string, nowMs: number = Date.now()): Promise<string> {
  const exp = Math.floor(nowMs / 1000) + BETA_TTL_SECONDS;
  const body = `${btoa(user).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_")}.${exp}`;
  return `${body}.${await hmac(body)}`;
}

/** True when the cookie's HMAC checks out, it has not expired, and its user is still a guest. */
export async function verifyPass(value: string | undefined, guests: Record<string, string>, nowMs: number = Date.now()): Promise<boolean> {
  return (await passUser(value, guests, nowMs)) !== null;
}

/** The guest a valid pass belongs to, or null (same checks as verifyPass). */
export async function passUser(value: string | undefined, guests: Record<string, string>, nowMs: number = Date.now()): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [u, expStr, mac] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < nowMs) return null;
  if (!sameString(await hmac(`${u}.${expStr}`), mac)) return null;
  let user = "";
  try {
    user = atob(u.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
  // A guest removed from env loses access at the next request, not at expiry.
  return Object.prototype.hasOwnProperty.call(guests, user) ? user : null;
}

/**
 * Only same-origin relative paths survive as a post-sign-in destination.
 *
 * A prefix check alone is not enough: browsers treat `\` as `/` and strip tabs
 * and newlines from URLs, so `/\evil.com` and `/<TAB>/evil.com` both become
 * `//evil.com` — an open redirect. So control characters and backslashes are
 * refused outright, and the result is resolved against a sentinel origin and
 * must still be on it.
 */
export function safeNext(raw: string | null | undefined): string {
  const fallback = "/preview";
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  let u: URL;
  try {
    u = new URL(raw, "https://gate.invalid");
  } catch {
    return fallback;
  }
  if (u.origin !== "https://gate.invalid") return fallback;
  const out = u.pathname + u.search + u.hash;
  if (out.startsWith("//") || out.startsWith("/beta") || out.startsWith("/api/")) return fallback;
  return out;
}
