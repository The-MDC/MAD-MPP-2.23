/**
 * MAD Gambit — Data Platform types (V1)
 * Shared shapes for the event stream, CDP profiles, and analytics rollups.
 */

/** An event to record on the platform stream (e.g. bet_placed, pack_opened). */
export interface PlatformEvent {
  eventType: string;
  walletAddress?: string | null;
  sessionId?: string | null;
  payload?: Record<string, unknown>;
}

/** A persisted event as read back from events_stream. */
export interface StoredEvent {
  id: number;
  eventType: string;
  walletAddress: string | null;
  sessionId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

/** A CDP (customer data platform) profile aggregated from events. */
export interface CdpProfile {
  walletAddress: string;
  firstSeen: string;
  lastSeen: string;
  eventCount: number;
  traits: Record<string, unknown>;
  segments: string[];
}

/** Platform-wide analytics summary over a rolling window. */
export interface PlatformSummary {
  windowHours: number;
  totalEvents: number;
  uniqueWallets: number;
  byType: Record<string, number>;
  hourly: { bucket: string; events: number }[];
  source: "live" | "demo";
}

/** Per-user analytics/intelligence. */
export interface UserIntelligence {
  walletAddress: string;
  eventCount: number;
  firstSeen: string | null;
  lastSeen: string | null;
  segments: string[];
  daily: { day: string; events: number }[];
  source: "live" | "demo";
}

/** Row shapes as returned by pg (snake_case), typed to avoid `any`. */
export interface EventRow {
  id: string;
  event_type: string;
  wallet_address: string | null;
  session_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: Date | string;
}
