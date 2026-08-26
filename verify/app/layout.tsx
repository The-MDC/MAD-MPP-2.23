import React from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/context/workspace-context";
import { MppProvider } from "@/context/mpp-context";
import { ThemeProvider } from "@/context/theme-context";
import { SpeedInsights } from '@vercel/speed-insights/next';
import Script from "next/script";
import LunarVars from "@/components/lunar-vars";
import DeviceFrame from "@/components/device-frame";
import HoldHintProvider from "@/components/hold-hint-provider";

// Display typography uses local/system fallbacks so builds do not depend on Google Fonts availability.
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
        <LunarVars />
        <ThemeProvider>
          <WorkspaceProvider>
            <MppProvider>
              {/* DeviceFrame is global, here, for every route — which is what
                  its own header always described it as: "one responsive
                  presentation shell for the whole dApp". Until now it wrapped
                  /mpp2.23 only, so nine of the ten routes rendered unframed.

                  It is a client component taking children; the pages passed
                  through it stay server components, since children arrive as a
                  prop rather than being imported into the client boundary.

                  All responsive behaviour is CSS (.mg-workbench / .mg-device in
                  globals.css): full-bleed under 768px, a centred 680px card on
                  tablet, and a 440px phone bezel at 1024px+. */}
              {/* HoldHintProvider wraps DeviceFrame rather than sitting inside
                  it: the hint surface portals to document.body and must not be
                  clipped or transformed by the frame it is explaining. One
                  provider here gives every route the affordance — the same
                  reasoning that moved DeviceFrame itself up to this level. */}
              <HoldHintProvider>
                <DeviceFrame>{children}</DeviceFrame>
              </HoldHintProvider>
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
