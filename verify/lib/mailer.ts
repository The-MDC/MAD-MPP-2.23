/**
 * Outbound mail for owner reports, via the Resend HTTP API (no dependency).
 *
 *   RESEND_API_KEY  required; with none set, nothing is sent and the caller is told "not-configured"
 *   REPORT_FROM     the verified sender, e.g. "MAD Gambit <reports@madgambit.fun>"
 *   REPORT_TO       recipient; defaults to the owner (nick@madgambit.fun)
 *
 * `sendReport` never throws and never logs the key or the body.
 */
export const DEFAULT_REPORT_TO = "nick@madgambit.fun";

export type MailStatus = "sent" | "not-configured" | "failed";

export function mailConfig(env: Record<string, string | undefined> = process.env): { key: string; from: string; to: string } | null {
  const key = env.RESEND_API_KEY?.trim(), from = env.REPORT_FROM?.trim();
  if (!key || !from) return null;
  return { key, from, to: env.REPORT_TO?.trim() || DEFAULT_REPORT_TO };
}

export async function sendReport(opts: {
  subject: string;
  text: string;
  attachment?: { filename: string; content: Uint8Array; type: string };
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): Promise<MailStatus> {
  const cfg = mailConfig(opts.env);
  if (!cfg) return "not-configured";
  try {
    const res = await (opts.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify({
        from: cfg.from, to: [cfg.to], subject: opts.subject, text: opts.text,
        ...(opts.attachment ? { attachments: [{ filename: opts.attachment.filename, content: Buffer.from(opts.attachment.content).toString("base64") }] } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}
