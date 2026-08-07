"use client";

import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030303] text-neutral-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(220,38,38,0.05),transparent)] pointer-events-none" />
      <div className="z-10 max-w-md p-6 rounded-xl border border-red-500/30 bg-neutral-950/80 backdrop-blur-md space-y-4">
        <h2 className="text-3xl font-black font-sans tracking-tight text-red-500">404</h2>
        <h3 className="text-lg font-bold font-mono tracking-widest text-neutral-300 uppercase">COORDINATES EXPIRED</h3>
        <p className="text-xs text-neutral-400">
          The requested ledger segment or conviction loop does not exist in the active stochastic matrix.
        </p>
        <div className="pt-2">
          <Link 
            href="/" 
            className="inline-flex items-center justify-center px-4 py-2 bg-red-950/40 text-red-300 border border-red-500/30 rounded hover:bg-red-900/60 transition-colors uppercase font-mono font-bold text-[10px] tracking-widest duration-300"
          >
            Return to Core Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
