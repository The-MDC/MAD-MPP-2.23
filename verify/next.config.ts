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
        // /gambit was retired when the earlier hub theme moved to /mpp2.23.
        // Config redirects preserve the query string, so existing deep links
        // like /gambit?tab=floor resolve to /mpp2.23?tab=floor.
        { source: "/gambit", destination: "/mpp2.23", permanent: true },
      ];
    },
    async headers() {
      return [{ source: "/:path*", headers: SECURITY_HEADERS }];
    },
  };
};

/**
 * Content-Security-Policy, deliberately split into ENFORCED and REPORT-ONLY.
 *
 * The enforced policy carries only directives that cannot break a working page:
 * they restrict capabilities this app never uses. frame-ancestors kills
 * clickjacking (and unlike X-Frame-Options it understands multiple origins),
 * base-uri stops an injected <base> from re-pointing every relative URL,
 * object-src blocks legacy plugin embeds, and form-action stops a form from
 * POSTing credentials off-origin.
 *
 * script-src and style-src are the two that actually stop XSS — and the two
 * that white-screen an app when they are wrong. Next.js injects inline
 * bootstrap scripts, Tailwind injects inline styles, and wallet extensions
 * inject their own providers; getting that set wrong is indistinguishable from
 * an outage. There is no browser in this sandbox to verify against (no
 * node_modules, npm registry 403), so shipping them enforced would be guessing
 * with production as the test.
 *
 * They therefore ship as Report-Only first. The browser evaluates the full
 * policy and reports what WOULD have broken, while breaking nothing. Once the
 * reports are quiet, move the directives into the enforced list — that promotion
 * is a two-line change and is the intended follow-up.
 *
 * connect-src is the one directive worth reviewing before promotion: the app
 * talks to Neon (server-side only, so not listed), Vercel Speed Insights, and
 * an Arbitrum RPC from the client via viem. If RELAYER_RPC_URL is pointed at a
 * dedicated provider (Alchemy/Infura), that host must be added here or wallet
 * reads will fail once enforced.
 */
// NOTE: `default-src` is deliberately ABSENT here, and that is the whole point.
//
// A previous revision of this file listed `default-src 'self'` in the enforced
// policy alongside a comment claiming the enforced set "cannot break a working
// page". That was wrong, and badly so. `default-src` is the FALLBACK for every
// fetch directive that is not otherwise specified — script-src, style-src,
// img-src, font-src and connect-src all inherit from it. Since none of those
// were listed in the enforced policy, `default-src 'self'` silently became:
//
//   script-src 'self'   → Next's inline hydration/flight bootstrap BLOCKED
//   style-src  'self'   → Tailwind's injected inline styles BLOCKED
//   img-src    'self'   → data: and blob: images BLOCKED
//   connect-src 'self'  → every off-origin fetch BLOCKED
//
// i.e. a blank, unhydrated page. Report-Only is a SEPARATE policy: the
// 'unsafe-inline' allowances below do not relax the enforced one.
//
// So the enforced list contains only directives that gate capabilities this app
// genuinely never uses, and no fallback directive that could reach the ones it
// does. Anything governing normal page resources belongs in Report-Only until
// its violation reports are quiet.
const CSP_ENFORCED = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const CSP_REPORT_ONLY = [
  "default-src 'self'",
  // 'unsafe-inline' is required by Next's inline bootstrap until a nonce is
  // threaded through proxy.ts; tightening that is a separate change.
  "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://vitals.vercel-insights.com https://arb1.arbitrum.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP_ENFORCED },
  { key: "Content-Security-Policy-Report-Only", value: CSP_REPORT_ONLY },
  // Stops MIME sniffing turning an uploaded blob into executable script.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer leaks wallet addresses when they appear in a path; send origin
  // only cross-site, keep the full path for same-origin analytics.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Deny hardware this app never requests, so an injected iframe cannot ask.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Belt-and-braces alongside frame-ancestors for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
];

export default nextConfig;
