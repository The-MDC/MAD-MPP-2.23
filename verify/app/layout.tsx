import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/context/workspace-context";
import { MppProvider } from "@/context/mpp-context";
import { ThemeProvider } from "@/context/theme-context";
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from "next/script";

export const metadata: Metadata = {
  title: "Mad Gambit Conviction Workspace",
  description: "High-fidelity neon quantitative workspace with custom mathematical models.",
};

// viewport-fit=cover is REQUIRED for env(safe-area-inset-*) to return real
// values on iOS. Pinch-zoom is left enabled (no maximum-scale/user-scalable)
// — disabling it is a WCAG 1.4.4 failure and iOS Safari ignores it anyway.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-neutral-100 min-h-screen" style={{ backgroundColor: "var(--mg-bg, #030303)" }}>
        <ThemeProvider>
          <WorkspaceProvider>
            <MppProvider>
              {children}
            </MppProvider>
          </WorkspaceProvider>
        </ThemeProvider>
        <SpeedInsights />
        {/* Vercel Web Analytics — first-party script (equivalent to the
            @vercel/analytics <Analytics/> component; used directly because the
            build sandbox can't reach npm to update the lockfile). Counts
            visitors + page views, incl. App Router client navigations, once Web
            Analytics is enabled for the project. */}
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
