import { NextResponse } from "next/server";
import { withRouteGuard } from "@/lib/with-route-guard";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { profileStatus } from "@/lib/support/eligibility";
import { AVATARS, avatarFor, cleanBio, cleanDisplayName, UPLOAD_MIN_COMPLETION } from "@/lib/profile";

const noStore = { "cache-control": "no-store" };

/** GET /api/v1/profile — your profile, its completion and what is still missing. */
export async function GET(req: Request) {
  const s = await profileStatus(req);
  return NextResponse.json({
    success: true,
    signedIn: s.signup.wallet,
    profile: { displayName: s.facts.displayName, avatar: s.facts.avatar, bio: s.facts.bio, email: s.facts.email, emailVerified: s.facts.emailVerified },
    completion: s.percent, missing: s.missing, uploadAllowed: s.uploadAllowed, uploadThreshold: UPLOAD_MIN_COMPLETION,
    avatars: Object.keys(AVATARS),
  }, { headers: noStore });
}

/** PUT /api/v1/profile — { displayName?, avatar?, bio? }. Email changes go through /api/v1/profile/email (verified). */
export const PUT = withRouteGuard({ mode: "session", bucket: "profile-update", limit: 20, windowMs: 60_000 }, async (req, { owner }) => {
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Profiles are offline for a moment." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  const name = "displayName" in body ? cleanDisplayName(body.displayName) : undefined;
  if (name === null) return NextResponse.json({ success: false, error: "Display names are 2 to 40 characters." }, { status: 400 });
  const avatar = "avatar" in body ? avatarFor(body.avatar) : undefined;
  if (avatar === null) return NextResponse.json({ success: false, error: "Pick one of the platform avatars." }, { status: 400 });
  const bio = "bio" in body ? cleanBio(body.bio) : undefined;
  try {
    await getDbPool().query(
      `INSERT INTO user_profiles (wallet_address, display_name, avatar_url, bio) VALUES (lower($1), $2, $3, $4)
       ON CONFLICT (wallet_address) DO UPDATE SET
         display_name = coalesce($2, user_profiles.display_name),
         avatar_url   = coalesce($3, user_profiles.avatar_url),
         bio          = coalesce($4, user_profiles.bio),
         updated_at   = now()`,
      [owner, name ?? null, avatar ?? null, bio ?? null],
    );
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch {
    return NextResponse.json({ success: false, error: "Could not save your profile." }, { status: 503 });
  }
});
