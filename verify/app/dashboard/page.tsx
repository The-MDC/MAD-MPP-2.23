import AnalyticsDashboard from "@/components/analytics-dashboard";
import RevenueStreamsPanel from "@/components/revenue-streams-panel";
import { INK } from "@/lib/gambit-design-tokens";

export const metadata = {
  title: "MAD Gambit — Dashboard",
  description: "Platform analytics + 5-stream revenue engine",
};

/**
 * /dashboard — the platform intelligence surface (V2): live analytics from the
 * Data Platform (V1) alongside the 5-stream revenue engine (Phase 4).
 * Additive route — does not touch the /gambit layout.
 */
export default function DashboardPage() {
  return (
    <main style={{ minHeight: "100vh", background: INK.bgDeep, padding: "24px 16px" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          alignItems: "start",
        }}
      >
        <AnalyticsDashboard />
        <RevenueStreamsPanel />
      </div>
    </main>
  );
}
