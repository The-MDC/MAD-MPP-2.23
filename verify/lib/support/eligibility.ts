/**
 * Has this visitor finished signing up? The concierge's Support and Knowledge base buttons appear only when they have,
 * and the endpoints behind those buttons check the same thing on the server (hiding a button is not access control).
 *
 *   beta     a valid beta pass (creator sign-in, invite code or open-beta admission)
 *   wallet   a signed-in wallet session (SIWE)
 *   profile  a profile with a display name; only required when SIGNUP_REQUIRES_PROFILE=1
 *
 * File upload asks for more: signup complete AND a profile at least 90% complete (lib/profile.ts), which includes a
 * verified email.
 */
import { BETA_COOKIE, loadGuests, passUser } from "@/lib/beta-gate";
import { getSessionFromRequest } from "@/lib/session";
import { readCookie } from "@/lib/admin-guard";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { profileCompletion, UPLOAD_MIN_COMPLETION, type ProfileFacts } from "@/lib/profile";

export interface SignupStatus { beta: boolean; wallet: boolean; profile: boolean; profileRequired: boolean; complete: boolean; wallet_address: string | null }

export async function signupStatus(req: Request, env: Record<string, string | undefined> = process.env): Promise<SignupStatus> {
  const beta = (await passUser(readCookie(req, BETA_COOKIE), loadGuests())) !== null;
  const session = getSessionFromRequest(req);
  const wallet = !!session;
  const profileRequired = env.SIGNUP_REQUIRES_PROFILE === "1";
  let profile = !profileRequired;
  if (profileRequired && session && hasDatabaseUrl()) {
    try {
      const r = await getDbPool().query("SELECT display_name FROM user_profiles WHERE wallet_address = lower($1)", [session.address]);
      profile = typeof r.rows[0]?.display_name === "string" && r.rows[0].display_name.trim().length > 0;
    } catch { profile = false; }
  }
  return { beta, wallet, profile, profileRequired, complete: beta && wallet && profile, wallet_address: session?.address?.toLowerCase() ?? null };
}

export interface ProfileStatus { signup: SignupStatus; facts: ProfileFacts; percent: number; missing: string[]; uploadAllowed: boolean }

/** Signup plus the weighted profile completion, read from user_profiles for the signed-in wallet. */
export async function profileStatus(req: Request): Promise<ProfileStatus> {
  const signup = await signupStatus(req);
  const facts: ProfileFacts = { beta: signup.beta, wallet: signup.wallet, displayName: null, email: null, emailVerified: false, avatar: null, bio: null };
  if (signup.wallet_address && hasDatabaseUrl()) {
    try {
      const r = await getDbPool().query("SELECT display_name, avatar_url, bio, email, email_verified_at FROM user_profiles WHERE wallet_address = lower($1)", [signup.wallet_address]);
      const p = r.rows[0];
      if (p) Object.assign(facts, { displayName: p.display_name ?? null, avatar: p.avatar_url ?? null, bio: p.bio ?? null, email: p.email ?? null, emailVerified: !!p.email_verified_at });
    } catch { /* no profile table yet */ }
  }
  const { percent, missing } = profileCompletion(facts);
  return { signup, facts, percent, missing, uploadAllowed: signup.complete && percent >= UPLOAD_MIN_COMPLETION };
}
