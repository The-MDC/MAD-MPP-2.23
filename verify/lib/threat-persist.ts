/**
 * Wires the threat monitor to the admin audit log, and reads the shared picture back (cached 15s), so every server
 * instance agrees on the colour. Imported by the routes that report threats and by the status endpoint.
 */
import { audit } from "@/lib/admin-store";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { setThreatPersister, threatStatus, type ThreatSnapshot } from "@/lib/threat-status";

setThreatPersister(async (kind, label) => {
  if (!hasDatabaseUrl()) return;
  await audit(getDbPool(), "system", `threat-${kind}`, label);
});

let cache: { at: number; shared: { scans: number; attacks: number } } | null = null;

export async function sharedThreatStatus(now = Date.now()): Promise<ThreatSnapshot> {
  if (!cache || now - cache.at > 15_000) {
    let shared = { scans: 0, attacks: 0 };
    if (hasDatabaseUrl()) {
      try {
        const r = await getDbPool().query(
          `SELECT count(*) FILTER (WHERE action = 'threat-scan')::int AS scans,
                  count(*) FILTER (WHERE action IN ('threat-attack','agent-breaker'))::int AS attacks
             FROM admin_audit WHERE created_at > now() - interval '10 minutes' AND actor = 'system'`,
        );
        // Each shared row stands for at least a minute of activity on some instance: weight scans so one row reads as yellow.
        shared = { scans: (r.rows[0]?.scans ?? 0) * 3, attacks: r.rows[0]?.attacks ?? 0 };
      } catch { /* table missing: local view only */ }
    }
    cache = { at: now, shared };
  }
  return threatStatus({ now, shared: cache.shared });
}
