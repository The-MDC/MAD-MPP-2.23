import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { WorkspaceProvider } from "@/context/workspace-context";
import { MppProvider } from "@/context/mpp-context";

export const metadata: Metadata = {
  title: "Mad Gambit Conviction Workspace",
  description: "High-fidelity neon quantitative workspace with custom mathematical models.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[#030303] text-neutral-100 min-h-screen">
        <WorkspaceProvider>
          <MppProvider>
            {children}
          </MppProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
