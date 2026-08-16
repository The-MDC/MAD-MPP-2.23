"use client";

/**
 * Root error boundary — the last line of defence.
 *
 * app/error.tsx cannot catch a throw in the root layout itself, because the
 * boundary lives *inside* that layout. global-error.tsx replaces the whole
 * document when the root fails, which is why it must render its own <html> and
 * <body>: at this point the real layout never mounted, so nothing else will.
 *
 * That also means no provider, no font, no global stylesheet and no Tailwind
 * preflight is guaranteed to be in scope here. Styling is therefore INLINE and
 * self-contained on purpose — a Tailwind class in this file would silently
 * render unstyled in exactly the failure it exists to handle.
 *
 * Same redaction rule as app/error.tsx: digest only in production, message in
 * development.
 */

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[global-error-boundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#030303",
          color: "#f5f5f5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          textAlign: "center",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
        }}
      >
        <div
          style={{
            maxWidth: 460,
            padding: 24,
            borderRadius: 12,
            border: "1px solid rgba(239,68,68,0.3)",
            background: "rgba(10,10,10,0.8)",
          }}
        >
          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              color: "#ef4444",
            }}
          >
            TOTAL FAULT
          </h2>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#d4d4d4",
            }}
          >
            Core Shell Unrecoverable
          </h3>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "#a3a3a3", lineHeight: 1.6 }}>
            The application shell itself failed to render. Reloading is the only recovery path.
          </p>

          {error.digest ? (
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#525252",
              }}
            >
              REF {error.digest}
            </p>
          ) : null}

          {process.env.NODE_ENV === "development" ? (
            <pre
              style={{
                textAlign: "left",
                fontSize: 10,
                color: "rgba(252,165,165,0.8)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: 160,
                overflow: "auto",
              }}
            >
              {error.message}
            </pre>
          ) : null}

          <button
            onClick={reset}
            style={{
              marginTop: 8,
              padding: "8px 16px",
              background: "rgba(69,10,10,0.4)",
              color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 4,
              textTransform: "uppercase",
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: "0.2em",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Reload Platform
          </button>
        </div>
      </body>
    </html>
  );
}
