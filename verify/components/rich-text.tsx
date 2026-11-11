import React from "react";
import { parseMarkdown, type Block, type Inline } from "@/lib/mini-markdown";

/**
 * Renders an AI reply as safe elements (see lib/mini-markdown.ts for exactly what is supported). Inherits colour and
 * font from its parent. A reply with no Markdown renders as the same text in paragraphs, newlines preserved.
 */
function renderInline(nodes: Inline[]): React.ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.t) {
      case "text": return <React.Fragment key={i}>{n.v}</React.Fragment>;
      case "bold": return <strong key={i}>{renderInline(n.c)}</strong>;
      case "italic": return <em key={i}>{renderInline(n.c)}</em>;
      case "code": return <code key={i} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.92em", padding: "0 4px", borderRadius: 4, background: "rgba(127,127,127,.18)" }}>{n.v}</code>;
      case "link": return <a key={i} href={n.href} target="_blank" rel="noopener noreferrer nofollow" style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>{renderInline(n.c)}</a>;
    }
  });
}

function renderBlock(b: Block, i: number): React.ReactNode {
  if (b.t === "p") return <p key={i} style={{ margin: i === 0 ? 0 : "6px 0 0", whiteSpace: "pre-wrap" }}>{renderInline(b.c)}</p>;
  const List = b.t === "ul" ? "ul" : "ol";
  return (
    <List key={i} style={{ margin: i === 0 ? 0 : "6px 0 0", paddingLeft: 18 }}>
      {b.items.map((it, j) => <li key={j}>{renderInline(it)}</li>)}
    </List>
  );
}

export default function RichText({ text }: { text: string }) {
  const blocks = React.useMemo(() => parseMarkdown(text), [text]);
  return <>{blocks.map(renderBlock)}</>;
}
