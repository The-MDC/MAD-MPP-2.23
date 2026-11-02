/**
 * MAD Gambit admin suite — authentication core.
 * ─────────────────────────────────────────────
 * One master admin (the owner) and any number of subordinate admins the master creates. Pure, dependency-free
 * crypto (node:crypto): scrypt password hashing, an HMAC-signed session token, and a role → permission table.
 *
 *   ADMIN_MASTER_EMAIL          the master's email (e.g. nick@madgambit.fun)
 *   ADMIN_MASTER_PASSWORD_HASH  a scrypt hash from `hashPassword` — the password itself never lives in the environment
 *   ADMIN_SESSION_SECRET        32+ random characters; signs the session cookie
 *
 * The master lives in the environment, not the database, so a database problem can never lock the owner out and a
 * database leak can never yield the owner's credential. Subordinates live in `admin_users` (sql/0018).
 */
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string, salt: Buffer, keylen: number, opts: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

/* ── roles and permissions ───────────────────────────────────────────── */

/**
 * Staff roles, kept separate by job:
 *   master   the owner: everything
 *   admin    platform administrators: reports, exports, the assistant, both support lanes and the beta programme
 *   support  support staff: the USER lane of the support queue only (user onboarding, access, wallets, disputes)
 *   dev      developers: the DEV lane (bugs, security) and the STAFF lane (internal platform issues), plus reports
 *   viewer   read-only reports
 */
export type AdminRole = "master" | "admin" | "support" | "dev" | "viewer";
export type Perm =
  | "reports:read" | "reports:export" | "assistant:use" | "audit:read" | "admins:manage"
  | "support:user" | "support:dev" | "beta:manage";

const PERMS: Record<AdminRole, readonly Perm[]> = {
  master: ["reports:read", "reports:export", "assistant:use", "audit:read", "admins:manage", "support:user", "support:dev", "beta:manage"],
  admin: ["reports:read", "reports:export", "assistant:use", "support:user", "support:dev", "beta:manage"],
  support: ["support:user"],
  dev: ["reports:read", "support:dev"],
  viewer: ["reports:read"],
};

export const can = (role: AdminRole, perm: Perm): boolean => PERMS[role]?.includes(perm) ?? false;
export const SUBORDINATE_ROLES = ["admin", "support", "dev", "viewer"] as const;
export const isSubordinateRole = (r: unknown): r is (typeof SUBORDINATE_ROLES)[number] =>
  typeof r === "string" && (SUBORDINATE_ROLES as readonly string[]).includes(r);

/* ── passwords ───────────────────────────────────────────────────────── */

const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;
export const MIN_PASSWORD = 12;

/** A reason the password is unacceptable, or null. */
export function passwordProblem(pw: unknown): string | null {
  if (typeof pw !== "string") return "Password required.";
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 200) return "Password too long.";
  if (new Set(pw).size < 6) return "Use a more varied password.";
  return null;
}

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 64, SCRYPT);
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(pw: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [alg, N, r, p, saltB64, keyB64] = stored.split("$");
  if (alg !== "scrypt" || !saltB64 || !keyB64) return false;
  const params = { N: Number(N), r: Number(r), p: Number(p), maxmem: SCRYPT.maxmem };
  if (![params.N, params.r, params.p].every((n) => Number.isInteger(n) && n > 0)) return false;
  try {
    const want = Buffer.from(keyB64, "base64");
    const got = await scrypt(pw, Buffer.from(saltB64, "base64"), want.length, params);
    return got.length === want.length && timingSafeEqual(got, want);
  } catch {
    return false;
  }
}

/** A hash to verify against when the account does not exist, so "no such admin" and "wrong password" cost the same. */
export const DUMMY_HASH =
  "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

/** A strong generated password from an alphabet without look-alike characters. */
export function generatePassword(length = 20): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(length * 2);
  let out = "";
  for (let i = 0; out.length < length; i++) {
    const b = bytes[i % bytes.length];
    if (b < 256 - (256 % alphabet.length)) out += alphabet[b % alphabet.length]; // reject the modulo-biased tail
    if (i >= bytes.length * 4) throw new Error("generatePassword: entropy loop");
  }
  return out;
}

/* ── sessions ────────────────────────────────────────────────────────── */

export const ADMIN_COOKIE = "mg_admin";
export const SESSION_TTL_S = 8 * 60 * 60;

export interface AdminSession { sub: string; role: AdminRole; iat: number; exp: number }

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");

function mac(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function signSession(s: AdminSession, secret: string): string {
  const body = b64u(JSON.stringify(s));
  return `v1.${body}.${mac(`v1.${body}`, secret)}`;
}

export function verifySession(token: string | undefined | null, secret: string | undefined | null, now = Date.now()): AdminSession | null {
  if (!token || !secret || secret.length < 32) return null;
  const [v, body, sig] = token.split(".");
  if (v !== "v1" || !body || !sig) return null;
  const want = Buffer.from(mac(`v1.${body}`, secret));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminSession;
    if (typeof s.sub !== "string" || !(s.role in PERMS)) return null;
    if (!(Number.isFinite(s.exp) && s.exp * 1000 > now)) return null;
    return s;
  } catch {
    return null;
  }
}

export function newSession(sub: string, role: AdminRole, now = Date.now()): AdminSession {
  const iat = Math.floor(now / 1000);
  return { sub, role, iat, exp: iat + SESSION_TTL_S };
}

export function sessionSecret(env: Record<string, string | undefined> = process.env): string | null {
  const s = env.ADMIN_SESSION_SECRET?.trim();
  return s && s.length >= 32 ? s : null;
}

/**
 * Staff accounts — and with them the admin-level concierge — are strictly tied to company email: madgambit.fun or
 * madgambit.io, exact domains, nothing else. Enforced at account creation, at sign-in and on every request.
 */
export const STAFF_DOMAINS = ["madgambit.fun", "madgambit.io"] as const;
export const isStaffEmail = (e: unknown): boolean =>
  typeof e === "string" && /^[^\s@]{1,64}@[^\s@]+$/.test(e) && (STAFF_DOMAINS as readonly string[]).includes(e.trim().toLowerCase().split("@")[1] ?? "");

export function masterConfig(env: Record<string, string | undefined> = process.env): { email: string; hash: string } | null {
  const email = env.ADMIN_MASTER_EMAIL?.trim().toLowerCase();
  const hash = env.ADMIN_MASTER_PASSWORD_HASH?.trim();
  return email && hash && isStaffEmail(email) ? { email, hash } : null;
}

export const normaliseEmail = (e: unknown): string | null => {
  if (typeof e !== "string") return null;
  const v = e.trim().toLowerCase();
  return /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/.test(v) && v.length <= 254 ? v : null;
};

/** Only same-site admin destinations may be a post-sign-in redirect. */
export function safeAdminNext(next: unknown): string {
  return typeof next === "string" && /^\/(admin|dashboard)(\/[\w\-./]*)?(\?[\w=&%\-.]*)?$/.test(next) && !next.includes("//") ? next : "/admin";
}
