/**
 * MAD Gambit — Data Platform: CDP profiles (V1)
 * A wallet's rolling profile, upserted on each event. Raw `pg` over Neon.
 */
import type { Pool } from "pg";
import type { CdpProfile, PlatformEvent } from "./types";

interface ProfileRow {
  wallet_address: string;
  first_seen: Date | string;
  last_seen: Date | string;
  event_count: string;
  traits: Record<string, unknown> | null;
  segments: unknown;
}

function toProfile(r: ProfileRow): CdpProfile {
  return {
    walletAddress: r.wallet_address,
    firstSeen: r.first_seen instanceof Date ? r.first_seen.toISOString() : String(r.first_seen),
    lastSeen: r.last_seen instanceof Date ? r.last_seen.toISOString() : String(r.last_seen),
    eventCount: Number(r.event_count),
    traits: r.traits ?? {},
    segments: Array.isArray(r.segments) ? (r.segments as string[]) : [],
  };
}

/** Upsert the wallet's profile on each event (bumps last_seen + event_count). */
export async function upsertProfileFromEvent(pool: Pool, e: PlatformEvent): Promise<void> {
  if (!e.walletAddress) return;
  const wallet = e.walletAddress.toLowerCase();
  await pool.query(
    `INSERT INTO cdp_profiles (wallet_address, first_seen, last_seen, event_count)
     VALUES ($1, now(), now(), 1)
     ON CONFLICT (wallet_address) DO UPDATE
       SET last_seen = now(), event_count = cdp_profiles.event_count + 1`,
    [wallet],
  );
}

export async function getProfile(pool: Pool, walletAddress: string): Promise<CdpProfile | null> {
  const res = await pool.query(
    `SELECT wallet_address, first_seen, last_seen, event_count, traits, segments
     FROM cdp_profiles WHERE wallet_address = $1`,
    [walletAddress.toLowerCase()],
  );
  if (res.rows.length === 0) return null;
  return toProfile(res.rows[0] as ProfileRow);
}
