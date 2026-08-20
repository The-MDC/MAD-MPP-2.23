import { describe, it, expect } from "vitest";
import { htmlToText, extractArticleImages, ingestArticle } from "./article-ingest";

const BASE = "https://example.com/news/story-1";

describe("htmlToText", () => {
  it("strips scripts and styles with their contents", () => {
    const t = htmlToText(
      "<p>Real body</p><script>var evil='not text'</script><style>.x{color:red}</style>",
    );
    expect(t).toContain("Real body");
    expect(t).not.toContain("evil");
    expect(t).not.toContain("color:red");
  });

  it("strips chrome elements (nav/aside/footer)", () => {
    const t = htmlToText("<nav>Home About</nav><p>Story text</p><footer>Copyright</footer>");
    expect(t).toContain("Story text");
    expect(t).not.toContain("Copyright");
  });

  it("prefers <article> when it carries real length", () => {
    const filler = "Article body sentence. ".repeat(30);
    const t = htmlToText(`<div>sidebar junk</div><article><p>${filler}</p></article>`);
    expect(t).toContain("Article body sentence");
    expect(t).not.toContain("sidebar junk");
  });

  it("does not fuse sentences across block boundaries", () => {
    expect(htmlToText("<p>One</p><p>Two</p>")).toMatch(/One\s+Two/);
  });

  it("decodes entities", () => {
    const t = htmlToText("<p>Tom &amp; Jerry &mdash; it&#39;s &quot;fine&quot;</p>");
    expect(t).toContain("Tom & Jerry");
    expect(t).toContain("—");
    expect(t).toContain("it's");
    expect(t).toContain('"fine"');
  });

  it("collapses whitespace", () => {
    expect(htmlToText("<p>a\n\n\n   \t  b</p>")).toBe("a b");
  });

  it("returns empty string for empty input rather than throwing", () => {
    expect(htmlToText("")).toBe("");
  });
});

describe("extractArticleImages", () => {
  it("prefers og:image", () => {
    const html = '<meta property="og:image" content="https://cdn.example.com/hero.jpg">';
    expect(extractArticleImages(html, BASE, 2)).toEqual(["https://cdn.example.com/hero.jpg"]);
  });

  it("accepts twitter:image", () => {
    const html = '<meta name="twitter:image" content="https://cdn.example.com/tw.jpg">';
    expect(extractArticleImages(html, BASE, 2)).toEqual(["https://cdn.example.com/tw.jpg"]);
  });

  it("returns at most max images", () => {
    const html = `
      <meta property="og:image" content="https://cdn.example.com/a.jpg">
      <meta name="twitter:image" content="https://cdn.example.com/b.jpg">
      <article><img src="https://cdn.example.com/c.jpg"></article>`;
    expect(extractArticleImages(html, BASE, 2)).toHaveLength(2);
  });

  it("absolutizes relative srcs against the article URL", () => {
    const html = "<article><img src=/img/photo.jpg></article>";
    expect(extractArticleImages(html, BASE, 2)).toEqual(["https://example.com/img/photo.jpg"]);
  });

  it("filters junk (logos, sprites, tracking pixels)", () => {
    const html = `<article>
      <img src="https://cdn.example.com/logo.png">
      <img src="https://cdn.example.com/pixel.gif">
      <img src="https://cdn.example.com/real-photo.jpg">
    </article>`;
    expect(extractArticleImages(html, BASE, 2)).toEqual(["https://cdn.example.com/real-photo.jpg"]);
  });

  it("dedupes repeated urls", () => {
    const html = `<meta property="og:image" content="https://cdn.example.com/x.jpg">
      <article><img src="https://cdn.example.com/x.jpg"></article>`;
    expect(extractArticleImages(html, BASE, 2)).toEqual(["https://cdn.example.com/x.jpg"]);
  });

  it("honours lazy-loading data-src", () => {
    const html = '<article><img data-src="https://cdn.example.com/lazy.jpg"></article>';
    expect(extractArticleImages(html, BASE, 2)).toEqual(["https://cdn.example.com/lazy.jpg"]);
  });

  it("skips data: URIs", () => {
    const html = '<article><img src="data:image/gif;base64,R0lGOD"></article>';
    expect(extractArticleImages(html, BASE, 2)).toEqual([]);
  });

  it("returns [] when there are no images", () => {
    expect(extractArticleImages("<p>text only</p>", BASE, 2)).toEqual([]);
  });
});

describe("ingestArticle", () => {
  it("rejects non-http urls without fetching", async () => {
    const r = await ingestArticle("file:///etc/passwd");
    expect(r.failed).toBe(true);
    expect(r.text).toBe("");
    expect(r.images).toEqual([]);
  });

  it("returns a failed partial for an empty url rather than throwing", async () => {
    const r = await ingestArticle("");
    expect(r.failed).toBe(true);
  });
});
