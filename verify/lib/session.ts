/**
 * Signed session tokens for the SIWE auth boundary.
 *
 * Replaces the previous plaintext `mg_session = <address>` cookie, which any
 * client could forge. A session is now an HMAC-signed, expiring token:
 *
 *     <base64url(payload)>.<base64url(HMAC-SHA256(payload))>
 *
 * No external dependency — Node's `crypto` only. The signing key is
 * `SESSION_SECRET`; if it is unset the module fails CLOSED (issues/accepts
 * nothing) rather than falling back to a forgeable token.
 */
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.SESSION_SECRET;
const SESSION_TTL_S = 60 * 60 * 8; // 8h — matches the prior cookie maxAge

export interface SessionPayload {
  address: `0x${string}`;
  chainId: number;
  /** unix seconds */
  exp: number;
}

function sign(body: string): string {
  return createHmac('sha256', SECRET as string).update(body).digest('base64url');
}

/**
 * Mint a signed session token. Returns null when SESSION_SECRET is unset —
 * callers must treat that as "sessions disabled" and never set a cookie.
 */
export function createSession(address: string, chainId: number): string | null {
  if (!SECRET) return null;
  const payload: SessionPayload = {
    address: address.toLowerCase() as `0x${string}`,
    chainId,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_S,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body)}`;
}

/** Verify a token's signature + expiry. Returns the payload or null. */
export function verifySession(token: string | undefined | null): SessionPayload | null {
  if (!SECRET || !token) return null;
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (typeof payload.address !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = 'mg_session';
export const SESSION_MAX_AGE = SESSION_TTL_S;

/**
 * Read + verify the session from an incoming request's Cookie header.
 * Use at the top of any protected route:
 *
 *     const session = getSessionFromRequest(req);
 *     if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
 */
export function getSessionFromRequest(req: Request): SessionPayload | null {
  const cookie = req.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)mg_session=([^;]+)/);
  if (!match) return null;
  return verifySession(decodeURIComponent(match[1]));
}
