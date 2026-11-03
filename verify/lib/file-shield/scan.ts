/**
 * File shield — the pipeline. Two layers, in order, and an optional third-party scanner between them.
 *
 *   LAYER 1  gate.ts   what the bytes ARE: type, magic, size, name, executable and malware signatures, blocklist;
 *            pdf.ts    for PDFs, active-content names (JavaScript, launch, embedded files, encryption) after
 *                      de-obfuscation and decompression, with bomb guards
 *   (1b)     MALWARE_SCAN_URL, when configured: the bytes are sent to an antivirus service (for example a ClamAV REST
 *            sidecar) and anything it does not call clean is refused. Fails CLOSED if the service errors.
 *   LAYER 2  firewall.ts what the text SAYS: normalised, defanged, instruction-like lines neutralised, personal data
 *            redacted; a file that is mostly instructions to an AI is quarantined.
 *
 * Output: either a refusal with reasons, or plain sanitised text. The original bytes are never stored, rendered or run.
 */
import { inspectFile, type FileKind } from "@/lib/file-shield/gate";
import { scanPdf } from "@/lib/file-shield/pdf";
import { firewallText, type FirewallResult } from "@/lib/file-shield/firewall";

export interface ScanOutcome {
  verdict: "accepted" | "refused" | "quarantined";
  kind: FileKind | null;
  name: string;
  size: number;
  sha256: string;
  reasons: string[];
  notes: string[];
  text: string;
  risk: FirewallResult["risk"] | "high";
}

export type ExternalScanner = (bytes: Uint8Array, name: string) => Promise<{ clean: boolean; detail?: string }>;

/** The optional antivirus hop. Off unless MALWARE_SCAN_URL is set; when on, an error means "not clean". */
export function externalScannerFromEnv(env: Record<string, string | undefined> = process.env, fetchImpl: typeof fetch = fetch): ExternalScanner | null {
  const url = env.MALWARE_SCAN_URL?.trim();
  if (!url || !/^https:\/\//.test(url)) return null;
  return async (bytes, name) => {
    try {
      const res = await fetchImpl(url, {
        method: "POST",
        headers: { "content-type": "application/octet-stream", "x-file-name": encodeURIComponent(name), ...(env.MALWARE_SCAN_TOKEN ? { authorization: `Bearer ${env.MALWARE_SCAN_TOKEN}` } : {}) },
        body: bytes as unknown as BodyInit,
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) return { clean: false, detail: `scanner returned ${res.status}` };
      const d = (await res.json().catch(() => ({}))) as { clean?: unknown; infected?: unknown; viruses?: unknown };
      const clean = d.clean === true || d.infected === false;
      return { clean, detail: clean ? undefined : "the antivirus scanner flagged this file" };
    } catch {
      return { clean: false, detail: "the antivirus scanner could not be reached" };
    }
  };
}

function decodeText(bytes: Uint8Array): { text: string; note?: string } {
  let b = bytes;
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) b = b.subarray(3);
  try { return { text: new TextDecoder("utf-8", { fatal: true }).decode(b) }; }
  catch { return { text: new TextDecoder("windows-1252").decode(b), note: "not UTF-8; read as Windows-1252" }; }
}

export async function scanUpload(input: { name: string; declaredType?: string | null; bytes: Uint8Array }, opts: { blocklist?: ReadonlySet<string>; external?: ExternalScanner | null } = {}): Promise<ScanOutcome> {
  // LAYER 1
  const g = inspectFile(input, opts.blocklist);
  const base = { kind: g.kind, name: g.safeName, size: g.size, sha256: g.sha256, text: "" };
  if (!g.ok) return { ...base, verdict: "refused", reasons: g.reasons, notes: g.flags, risk: "high" };

  const notes = [...g.flags];
  let raw = "";
  if (g.kind === "pdf") {
    const pdf = scanPdf(input.bytes);
    if (pdf.refused.length) {
      return { ...base, verdict: "refused", reasons: [`The PDF contains active content that is never opened here: ${pdf.refused.join(", ")}.`], notes, risk: "high" };
    }
    if (pdf.noted.length) notes.push(`PDF features noted (inert here): ${pdf.noted.join(", ")}`);
    if (!pdf.textLayer) notes.push("no text layer (a scanned or image-only PDF); there is nothing to read");
    raw = pdf.text;
  } else {
    const d = decodeText(input.bytes);
    if (d.note) notes.push(d.note);
    raw = d.text;
  }

  // (1b) optional antivirus service
  if (opts.external) {
    const av = await opts.external(input.bytes, g.safeName);
    if (!av.clean) return { ...base, verdict: "refused", reasons: [`Refused by the antivirus scan: ${av.detail ?? "not clean"}.`], notes, risk: "high" };
    notes.push("antivirus scan: clean");
  }

  // LAYER 2
  const fw = firewallText(raw.slice(0, 2_000_000));
  if (fw.quarantine) {
    return { ...base, verdict: "quarantined", reasons: ["The file is mostly instructions aimed at an AI, so it was quarantined instead of read."], notes: [...notes, `instruction-like lines: ${fw.removed.injectionLines}`], risk: "high" };
  }
  const r = fw.removed;
  if (r.injectionLines) notes.push(`${r.injectionLines} instruction-like line(s) neutralised`);
  if (r.scripts) notes.push(`${r.scripts} script or active element(s) removed`);
  if (r.html) notes.push(`${r.html} HTML tag(s) removed`);
  if (r.links) notes.push(`${r.links} link(s) defanged`);
  if (r.images) notes.push(`${r.images} image link(s) removed`);
  if (r.controls) notes.push(`${r.controls} hidden or control character(s) removed`);
  return { ...base, verdict: "accepted", reasons: [], notes, text: fw.text, risk: fw.risk };
}
