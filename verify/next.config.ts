import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

/**
 * Node server build — works directly in AI Studio and Google Cloud Run.
 * Produces a self-contained Node.js server in .next/standalone.
 * Run with: node .next/standalone/server.js
 * Deploy:   gcloud run deploy mad-gambit --source .
 */
const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    reactStrictMode: true,
    output: "standalone",
    distDir: isDev ? ".next-dev" : ".next",
    typescript: { ignoreBuildErrors: false },
    // Legacy uppercase bookmark → canonical lowercase route. Handled here rather
    // than as an app/MPP2.23 route so it can't collide (case-only) with
    // app/mpp2.23 under tsc's TS1149 casing rule. Source matching is
    // case-sensitive, so only the uppercase path is redirected.
    async redirects() {
      return [
        { source: "/MPP2.23", destination: "/mpp2.23", permanent: true },
      ];
    },
  };
};

export default nextConfig;
