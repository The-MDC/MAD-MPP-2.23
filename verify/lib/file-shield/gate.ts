/**
 * File shield — LAYER 1: the gate.
 * ────────────────────────────────
 * Decides whether a file may be OPENED at all, from its bytes, before any parser touches it. Only three kinds are
 * accepted — Markdown, plain text and PDF — up to 25 MB, and each must prove what it is:
 *
 *   - name      reduced to a safe display name; path parts, control characters and deceptive double extensions
 *               (report.exe.pdf, notes.js.txt) are refused. The stored file never uses the user's name as a path.
 *   - type      the extension must be one of .md / .markdown / .txt / .pdf; a declared MIME type must agree with it.
 *   - magic     a PDF must start with %PDF-1.x or %PDF-2.x; text must not start like an executable, an archive, a PDF
 *               or a script, and must not contain NUL bytes or a binary-looking share of control characters.
 *   - signatures  executable headers anywhere (MZ/PE, ELF, Mach-O, ZIP/JAR), the EICAR test signature, and any SHA-256
 *               on the platform's blocklist are refused outright.
 *
 * The gate never executes, renders or interprets content. Layer 2 (./firewall.ts) cleans what is read; the PDF scanner
 * (./pdf.ts) adds the PDF-specific checks (JavaScript, launch actions, embedded files, encryption).
 */
import { createHash } from "node:crypto";

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export type FileKind = "pdf" | "markdown" | "text";

const EXT: Record<string, FileKind> = { ".pdf": "pdf", ".md": "markdown", ".markdown": "markdown", ".txt": "text" };
const MIME_OK: Record<FileKind, readonly string[]> = {
  pdf: ["application/pdf", "application/x-pdf"],
  markdown: ["text/markdown", "text/x-markdown", "text/plain"],
  text: ["text/plain"],
};
/** Inner extensions that make a double extension deceptive. */
const RISKY_INNER = /\.(exe|com|scr|pif|bat|cmd|ps1|psm1|vbs|vbe|js|jse|wsf|wsh|hta|html?|svg|jar|msi|dll|sh|bash|zsh|py|rb|pl|php|apk|app|dmg|iso|lnk|reg|docm|xlsm|pptm)$/i;

export interface GateInput { name: string; declaredType?: string | null; bytes: Uint8Array }
export interface GateResult {
  ok: boolean;
  kind: FileKind | null;
  safeName: string;
  size: number;
  sha256: string;
  reasons: string[];   // why it was refused (empty when ok)
  flags: string[];     // noted, not fatal; layer 2 handles them
}

export function safeDisplayName(raw: string): string {
  const base = String(raw ?? "").split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const clean = base.normalize("NFKC").replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, "").replace(/[^\w .()\-]/g, "_").replace(/\s+/g, " ").trim();
  return (clean || "file").slice(0, 120);
}

const startsWith = (b: Uint8Array, sig: number[], at = 0) => sig.every((x, i) => b[at + i] === x);
const ascii = (s: string) => Array.from(s, (c) => c.charCodeAt(0));

function indexOfBytes(hay: Uint8Array, needle: number[], from = 0, to = hay.length): number {
  outer: for (let i = from; i <= Math.min(to, hay.length) - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
}

/** The industry-standard antivirus test string. Any scanner worth the name refuses a file carrying it. */
const EICAR = ascii("X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*");
const DOS_STUB = ascii("This program cannot be run in DOS mode");

export function inspectFile(input: GateInput, blocklist: ReadonlySet<string> = new Set()): GateResult {
  const b = input.bytes;
  const reasons: string[] = [];
  const flags: string[] = [];
  const sha256 = createHash("sha256").update(b).digest("hex");
  const safeName = safeDisplayName(input.name);
  const lower = safeName.toLowerCase();
  const ext = Object.keys(EXT).find((e) => lower.endsWith(e)) ?? null;
  const kind = ext ? EXT[ext] : null;
  const result = (): GateResult => ({ ok: reasons.length === 0, kind, safeName, size: b.length, sha256, reasons, flags });

  if (b.length === 0) reasons.push("The file is empty.");
  if (b.length > MAX_FILE_BYTES) reasons.push("The file is larger than 25 MB.");
  if (!kind) { reasons.push("Only Markdown (.md), text (.txt) and PDF (.pdf) files are accepted."); return result(); }
  if (RISKY_INNER.test(lower.slice(0, lower.length - ext!.length))) reasons.push("The file name hides another file type (a double extension).");
  if (blocklist.has(sha256)) reasons.push("This exact file is on the platform's blocklist.");

  const declared = (input.declaredType ?? "").split(";")[0].trim().toLowerCase();
  if (declared && declared !== "application/octet-stream" && !MIME_OK[kind].includes(declared)) reasons.push(`The file says it is ${declared.slice(0, 40)}, which does not match its .${kind === "pdf" ? "pdf" : ext!.slice(1)} name.`);

  // Executable and archive signatures, at the start and (for PE) anywhere.
  if (startsWith(b, [0x4d, 0x5a]) || indexOfBytes(b, DOS_STUB) >= 0) reasons.push("The file contains a Windows executable.");
  if (startsWith(b, [0x7f, 0x45, 0x4c, 0x46])) reasons.push("The file is a Linux executable.");
  if (startsWith(b, [0xcf, 0xfa, 0xed, 0xfe]) || startsWith(b, [0xfe, 0xed, 0xfa, 0xce]) || startsWith(b, [0xca, 0xfe, 0xba, 0xbe])) reasons.push("The file is a macOS executable or Java class.");
  if (startsWith(b, [0x50, 0x4b, 0x03, 0x04]) || startsWith(b, [0x50, 0x4b, 0x05, 0x06])) reasons.push("The file is a ZIP archive (Office documents and JARs are ZIPs), not text or PDF.");
  if (indexOfBytes(b, EICAR) >= 0) reasons.push("The file carries a known malware test signature (EICAR).");

  if (kind === "pdf") {
    const head = indexOfBytes(b, ascii("%PDF-"), 0, 1024);
    if (head < 0 || !(b[head + 5] === 0x31 || b[head + 5] === 0x32)) reasons.push("The file does not start like a PDF.");
    else if (head > 0) flags.push("bytes before the PDF header");
    if (indexOfBytes(b, ascii("%%EOF"), Math.max(0, b.length - 4096)) < 0) flags.push("no end-of-file marker (truncated or appended data)");
  } else {
    if (startsWith(b, ascii("%PDF-"))) reasons.push("This is a PDF wearing a text extension.");
    if (startsWith(b, ascii("#!"))) flags.push("starts like a script (it is read as text, never run)");
    if (startsWith(b, ascii("<?php")) || /^\s*<!doctype html|^\s*<html/i.test(new TextDecoder("latin1").decode(b.subarray(0, 256)))) flags.push("contains HTML or a script header (it is read as text, never rendered)");
    let nul = 0, ctrl = 0;
    const n = Math.min(b.length, 1_000_000);
    for (let i = 0; i < n; i++) {
      const c = b[i];
      if (c === 0) nul++;
      else if (c < 0x09 || (c > 0x0d && c < 0x20)) ctrl++;
    }
    if (nul > 0) reasons.push("The file contains binary data (NUL bytes), so it is not text.");
    else if (n > 0 && ctrl / n > 0.01) reasons.push("The file looks binary, not text.");
  }
  return result();
}
