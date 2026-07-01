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
    eslint: { ignoreDuringBuilds: true },
    typescript: { ignoreBuildErrors: false },
  };
};

export default nextConfig;
