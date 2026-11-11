import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown, plainText } from "./mini-markdown";

/**
 * The concierge prints model output. This must be SAFE (no HTML, links only http/https) and must leave plain replies
 * exactly as they were.
 *
 * THIS FILE MUST STAY UNDER `lib/` — vitest's `include` is `lib/**\/*.test.ts`.
 */
describe("plain text is untouched", () => {
  it("a reply with no Markdown is one paragraph with its own text", () => {
    const b = parseMarkdown("Hello there. The 1.88% fee applies to every market.");
    expect(b).toHaveLength(1);
    expect(b[0].t).toBe("p");
    if (b[0].t === "p") expect(plainText(b[0].c)).toBe("Hello there. The 1.88% fee applies to every market.");
  });

  it("keeps a single newline inside the paragraph and splits on blank lines", () => {
    const b = parseMarkdown("line one\nline two\n\nsecond paragraph");
    expect(b.map((x) => x.t)).toEqual(["p", "p"]);
    if (b[0].t === "p") expect(plainText(b[0].c)).toBe("line one\nline two");
  });

  it("snake_case words and a lone asterisk are not emphasis", () => {
    expect(plainText(parseInline("use my_var_name and 2 * 3 = 6"))).toBe("use my_var_name and 2 * 3 = 6");
  });
});

describe("the supported subset", () => {
  it("bold, italic and code", () => {
    const n = parseInline("a **bold** and *it* and `x`");
    expect(n.map((x) => x.t)).toEqual(["text", "bold", "text", "italic", "text", "code"]);
  });

  it("code spans protect their contents from further parsing", () => {
    const n = parseInline("`**not bold**`");
    expect(n).toEqual([{ t: "code", v: "**not bold**" }]);
  });

  it("bullet and numbered lists", () => {
    const b = parseMarkdown("- one\n- two\n\n1. first\n2. second");
    expect(b.map((x) => x.t)).toEqual(["ul", "ol"]);
    if (b[0].t === "ul") expect(b[0].items).toHaveLength(2);
    if (b[1].t === "ol") expect(b[1].items).toHaveLength(2);
  });

  it("an http(s) link becomes a link", () => {
    const n = parseInline("see [the docs](https://example.com/a?b=1)");
    expect(n[1]).toMatchObject({ t: "link", href: "https://example.com/a?b=1" });
  });
});

describe("safety", () => {
  it("javascript:, data: and relative links stay literal text, never links", () => {
    for (const bad of ["[x](javascript:alert(1))", "[x](data:text/html;base64,AAAA)", "[x](/relative)", "[x](//evil.com)", "[x](ftp://h/f)"]) {
      const n = parseInline(bad);
      expect(n.some((x) => x.t === "link")).toBe(false);
    }
  });

  it("HTML in a reply is just text (React escapes it; the tree has no raw-HTML node)", () => {
    const n = parseInline('<img src=x onerror=alert(1)> <script>alert(1)</script>');
    expect(n.every((x) => x.t === "text")).toBe(true);
    expect(plainText(n)).toContain("<script>");
  });

  it("unfinished syntax while a reply is still arriving stays literal", () => {
    expect(plainText(parseInline("this is **bol"))).toBe("this is **bol");
    expect(plainText(parseInline("see [the do"))).toBe("see [the do");
    expect(plainText(parseInline("run `npm"))).toBe("run `npm");
  });

  it("does not hang or blow up on hostile input", () => {
    const nasty = "*".repeat(5000) + "[" .repeat(2000) + "`".repeat(3000) + "_a_".repeat(2000);
    const t0 = Date.now();
    parseMarkdown(nasty);
    expect(Date.now() - t0).toBeLessThan(2000);
  });
});
