"use client";

/**
 * Route-segment error boundary.
 *
 * Without this file a thrown render error in any route under app/ unmounts the
 * tree to a blank page — no message, no way back, and nothing tying the user's
 * report to a server log line. Next.js only wires a boundary in if the file
 * exists; there is no implicit default.
 *
 * Deliberately does NOT print `error.message` in production. For errors thrown
 * on the server, Next already replaces the message with a generic string and
 * exposes only `digest` (a hash correlating to the server log). Client-side
 * throws are NOT redacted, so printing the raw message would leak internals —
 * route paths, column names, upstream failure text — straight into the UI. The
 * digest is the safe, actionable identifier; the raw message is dev-only.
 */

import React from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surfaces in the Vercel runtime log alongside the digest, so a user
    // reporting the short code below is traceable to the actual stack.
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#030303] text-neutral-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(220,38,38,0.05),transparent)] pointer-events-none" />
      <div className="z-10 max-w-md p-6 rounded-xl border border-red-500/30 bg-neutral-950/80 backdrop-blur-md space-y-4">
        <h2 className="text-3xl font-black font-sans tracking-tight text-red-500">FAULT</h2>
        <h3 className="text-lg font-bold font-mono tracking-widest text-neutral-300 uppercase">
          CONVICTION LOOP DESTABILISED
        </h3>
        <p className="text-xs text-neutral-400">
          This segment threw while rendering. The rest of the platform is unaffected — retry the
          segment, or fall back to the core workspace.
        </p>

        {error.digest ? (
          <p className="text-[10px] font-mono tracking-widest text-neutral-600 uppercase">
            REF {error.digest}
          </p>
        ) : null}

        {process.env.NODE_ENV === "development" ? (
          <pre className="text-left text-[10px] font-mono text-red-300/80 whitespace-pre-wrap break-words max-h-40 overflow-auto">
            {error.message}
          </pre>
        ) : null}

        <div className="pt-2 flex items-center justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-4 py-2 bg-red-950/40 text-red-300 border border-red-500/30 rounded hover:bg-red-900/60 transition-colors uppercase font-mono font-bold text-[10px] tracking-widest duration-300"
          >
            Retry Segment
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900/60 text-neutral-300 border border-neutral-700/50 rounded hover:bg-neutral-800/60 transition-colors uppercase font-mono font-bold text-[10px] tracking-widest duration-300"
          >
            Core Workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
