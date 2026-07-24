import AnalyticsDashboard from "@/components/analytics-dashboard";
import RevenueStreamsPanel from "@/components/revenue-streams-panel";
import ShieldPanel from "@/components/shield-panel";
import CardLifecyclePanel from "@/components/card-lifecycle-panel";
import BayesianPanel from "@/components/bayesian-panel";
import CardStatsDisplay from "@/components/card-stats-display";
import MarketsPanel from "@/components/markets-panel";
import DopamineMetricsCarousel from "@/components/dopamine-metrics-carousel";
import ReflexionVisualizer from "@/components/reflexion-visualizer";
import MadxWalletPanel from "@/components/madx-wallet-panel";
import MarketsForTodayPanel from "@/components/markets-for-today-panel";
import DashboardShell from "@/components/dashboard-shell";

export const metadata = {
  title: "MAD Gambit — Dashboard",
  description: "Live pulse + markets + Shield + cards + Bayesian + activity ledger (dual-theme)",
};

/**
 * /dashboard — the platform intelligence surface (V2): live analytics from the
 * Data Platform (V1) alongside the 5-stream revenue engine (Phase 4).
 * Additive route — does not touch the /gambit layout.
 */
export default function DashboardPage() {
  return (
    <DashboardShell>
      <DopamineMetricsCarousel />
      <MadxWalletPanel />
      <MarketsForTodayPanel />
      <AnalyticsDashboard />
      <MarketsPanel />
      <ShieldPanel />
      <CardLifecyclePanel />
      <BayesianPanel />
      <CardStatsDisplay />
      <RevenueStreamsPanel />
      <ReflexionVisualizer />
    </DashboardShell>
  );
}
