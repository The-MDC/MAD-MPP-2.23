/**
 * File shield — the PDF scanner and text extractor. Dependency-free, bounded, never executes anything.
 *
 * SCAN (part of layer 1). The pdfid approach (Didier Stevens), which is how PDF malware is triaged in practice: look
 * for the names that make a PDF *do* something rather than *show* something. Names are de-obfuscated first (/J#61vaScript
 * is /JavaScript), and compressed streams are inflated so keywords hidden in object streams are found too.
 *   refuse   /JavaScript /JS, /Launch, /EmbeddedFile(s), /RichMedia, /XFA, /SubmitForm, /ImportData, /GoToE, /Encrypt
 *            (an encrypted PDF cannot be scanned, so it is not opened)
 *   note     /OpenAction, /AA, /AcroForm, /URI, /ObjStm — common in harmless PDFs; refused only alongside JavaScript
 *
 * EXTRACT. Text only: string operands of the text operators (Tj, TJ, ', ") inside inflated content streams, with
 * line breaks at text-positioning operators. No fonts, images, forms or scripts are interpreted.
 *
 * Bomb guards: at most MAX_STREAMS streams, MAX_STREAM_OUT bytes inflated per stream and MAX_TOTAL_OUT in all.
 */
import { inflateSync } from "node:zlib";

export const MAX_STREAMS = 5000;
export const MAX_STREAM_OUT = 8 * 1024 * 1024;
export const MAX_TOTAL_OUT = 64 * 1024 * 1024;
export const MAX_TEXT_CHARS = 2_000_000;

const REFUSE = ["JavaScript", "JS", "Launch", "EmbeddedFile", "EmbeddedFiles", "RichMedia", "XFA", "SubmitForm", "ImportData", "GoToE", "Encrypt"] as const;
const NOTE = ["OpenAction", "AA", "AcroForm", "URI", "ObjStm"] as const;

export interface PdfScan { refused: string[]; noted: string[]; counts: Record<string, number>; text: string; streams: number; inflatedBytes: number; textLayer: boolean; bombGuardTripped: boolean }

/** /J#61vaScript → /JavaScript: PDF names may hex-escape any character, the oldest way to hide a keyword. */
export const deobfuscateNames = (s: string) => s.replace(/\/([A-Za-z0-9#]+)/g, (_, n: string) => "/" + n.replace(/#([0-9A-Fa-f]{2})/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16))));

function countNames(text: string, into: Record<string, number>) {
  const t = deobfuscateNames(text);
  for (const k of [...REFUSE, ...NOTE]) {
    const re = new RegExp(`/${k}(?![A-Za-z])`, "g");
    const n = (t.match(re) ?? []).length;
    if (n) into[k] = (into[k] ?? 0) + n;
  }
}

/** Decode a PDF literal string's escapes. */
function literal(s: string): string {
  return s.replace(/\\(\d{1,3}|.)/gs, (_, e: string) => {
    if (/^\d/.test(e)) return String.fromCharCode(parseInt(e, 8) & 0xff);
    return ({ n: "\n", r: "\r", t: "\t", b: "", f: "", "(": "(", ")": ")", "\\": "\\", "\n": "", "\r": "" } as Record<string, string>)[e] ?? e;
  });
}
function hexString(h: string): string {
  const clean = h.replace(/[^0-9A-Fa-f]/g, "");
  let out = "";
  for (let i = 0; i + 1 < clean.length; i += 2) out += String.fromCharCode(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

/** Pull text from one content stream. Deliberately small: text operators only. */
export function textFromContent(content: string): string {
  if (!/\bBT\b/.test(content)) return "";
  const out: string[] = [];
  const re = /\((?:\\.|[^\\)])*\)\s*(?:Tj|'|")|\[((?:\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>|[^\]])*)\]\s*TJ|<([0-9A-Fa-f\s]+)>\s*Tj|(T\*|\b(?:Td|TD|Tm|ET)\b)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const whole = m[0];
    // groups: 1 = a TJ array, 2 = a hex Tj string, 3 = a text-positioning operator (a line break)
    if (m[3]) { out.push("\n"); continue; }
    if (m[2]) { out.push(hexString(m[2])); continue; }
    if (m[1] !== undefined) {
      for (const part of m[1].match(/\((?:\\.|[^\\)])*\)|<[0-9A-Fa-f\s]*>|-?\d+(\.\d+)?/g) ?? []) {
        if (part.startsWith("(")) out.push(literal(part.slice(1, -1)));
        else if (part.startsWith("<")) out.push(hexString(part.slice(1, -1)));
        else if (Number(part) < -200) out.push(" "); // a wide negative kern is a word gap
      }
      continue;
    }
    const lit = whole.match(/^\(((?:\\.|[^\\)])*)\)/);
    if (lit) { out.push(literal(lit[1])); if (/['"]$/.test(whole.trim())) out.push("\n"); }
  }
  return out.join("");
}

export function scanPdf(bytes: Uint8Array): PdfScan {
  const raw = Buffer.from(bytes).toString("latin1");
  const counts: Record<string, number> = {};
  countNames(raw, counts);
  const texts: string[] = [];
  let streams = 0, inflatedBytes = 0, bomb = false;

  const re = /<<((?:[^<>]|<(?!<)|>(?!>)|<<(?:[^<>]|<(?!<)|>(?!>))*>>)*)>>\s*stream\r?\n/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    if (++streams > MAX_STREAMS) { bomb = true; break; }
    const dict = deobfuscateNames(m[1]);
    const start = m.index + m[0].length;
    const end = raw.indexOf("endstream", start);
    if (end < 0) break;
    re.lastIndex = end;
    const filters = dict.match(/\/Filter\s*(\[[^\]]*\]|\/\w+)/)?.[1] ?? "";
    if (filters && !/^\[?\s*\/FlateDecode\s*\]?$/.test(filters.trim())) continue; // images and other encodings: not text
    let data = Buffer.from(raw.slice(start, end).replace(/\r?\n$/, ""), "latin1");
    if (filters) {
      if (inflatedBytes >= MAX_TOTAL_OUT) { bomb = true; break; }
      try {
        data = inflateSync(data, { maxOutputLength: Math.min(MAX_STREAM_OUT, MAX_TOTAL_OUT - inflatedBytes) });
      } catch (e) {
        if (String((e as Error)?.message).includes("maxOutputLength") || (e as { code?: string })?.code === "ERR_BUFFER_TOO_LARGE") bomb = true;
        continue;
      }
      inflatedBytes += data.length;
    }
    const s = data.toString("latin1");
    countNames(s, counts);
    const t = textFromContent(s);
    if (t) texts.push(t);
  }

  const refused = REFUSE.filter((k) => counts[k]);
  const noted = NOTE.filter((k) => counts[k]);
  if (bomb) refused.push("decompression limit exceeded" as never);
  let text = texts.join("\n").replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);
  return { refused: refused as string[], noted: noted as string[], counts, text, streams, inflatedBytes, textLayer: text.length > 0, bombGuardTripped: bomb };
}
