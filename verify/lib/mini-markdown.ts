/**
 * A small, safe Markdown subset for AI replies (the concierge shows the model's text; models write Markdown).
 *
 * Supported: paragraphs, `- ` / `* ` bullet lists, `1. ` numbered lists, **bold**, *italic* / _italic_, `code`,
 * and [text](https://…) links. Nothing else is interpreted: no HTML, no images, no headings, no tables. Output is a
 * plain data tree that React renders as elements, so a reply can never inject markup, and a link can only be
 * http(s). Text with no Markdown in it comes back as exactly its own paragraphs, so nothing changes for plain replies.
 *
 * Native by design (no react-markdown / streamdown dependency; the lockfile cannot be updated in the build sandbox).
 * Unfinished syntax while a reply is still arriving ("**bol") is left as literal text, not guessed at.
 */
export type Inline =
  | { t: "text"; v: string }
  | { t: "bold"; c: Inline[] }
  | { t: "italic"; c: Inline[] }
  | { t: "code"; v: string }
  | { t: "link"; href: string; c: Inline[] };

export type Block =
  | { t: "p"; c: Inline[] }
  | { t: "ul"; items: Inline[][] }
  | { t: "ol"; items: Inline[][] };

const SAFE_HREF = /^https?:\/\/[^\s<>"']+$/i;

/** Parse inline syntax. Order of attempts: code, link, bold, italic, so code spans protect their contents. */
export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let buf = "";
  const flush = () => {
    if (buf) { out.push({ t: "text", v: buf }); buf = ""; }
  };
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i + 1) { flush(); out.push({ t: "code", v: src.slice(i + 1, end) }); i = end + 1; continue; }
    }
    if (ch === "[") {
      const m = /^\[([^\]\n]{1,200})\]\(([^)\s]{1,500})\)/.exec(src.slice(i));
      if (m && SAFE_HREF.test(m[2])) { flush(); out.push({ t: "link", href: m[2], c: parseInline(m[1]) }); i += m[0].length; continue; }
    }
    if (ch === "*" && src[i + 1] === "*") {
      const end = src.indexOf("**", i + 2);
      if (end > i + 2) { flush(); out.push({ t: "bold", c: parseInline(src.slice(i + 2, end)) }); i = end + 2; continue; }
    }
    if ((ch === "*" || ch === "_") && src[i + 1] !== ch && src[i + 1] !== " " && src[i + 1] !== undefined) {
      const end = src.indexOf(ch, i + 1);
      // a word-internal underscore (snake_case) is not emphasis
      const prev = i > 0 ? src[i - 1] : " ";
      if (end > i + 1 && src[end - 1] !== " " && !(ch === "_" && /\w/.test(prev))) {
        flush(); out.push({ t: "italic", c: parseInline(src.slice(i + 1, end)) }); i = end + 1; continue;
      }
    }
    buf += ch;
    i++;
  }
  flush();
  return out;
}

const BULLET = /^\s{0,3}[-*]\s+(.*)$/;
const NUMBERED = /^\s{0,3}\d{1,3}[.)]\s+(.*)$/;

/** Parse a whole reply into blocks. Blank lines separate paragraphs; a single newline stays inside a paragraph. */
export function parseMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const endPara = () => {
    if (para.length) { blocks.push({ t: "p", c: parseInline(para.join("\n")) }); para = []; }
  };
  const endList = () => {
    if (list) { blocks.push({ t: list.kind, items: list.items.map(parseInline) }); list = null; }
  };
  for (const line of lines) {
    if (line.trim() === "") { endPara(); endList(); continue; }
    const b = BULLET.exec(line);
    const n = b ? null : NUMBERED.exec(line);
    const item = b ?? n;
    if (item) {
      const kind = b ? "ul" : "ol";
      endPara();
      if (list && list.kind !== kind) endList();
      if (!list) list = { kind, items: [] };
      list.items.push(item[1]);
      continue;
    }
    endList();
    para.push(line);
  }
  endPara();
  endList();
  return blocks;
}

/** The text of a tree with all syntax removed. Handy for tests and for screen-reader/clipboard fallbacks. */
export function plainText(nodes: Inline[]): string {
  return nodes.map((n) => (n.t === "text" || n.t === "code" ? n.v : plainText(n.c))).join("");
}
