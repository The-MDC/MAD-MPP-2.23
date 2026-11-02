/**
 * Weekly security-intel scan.
 * ───────────────────────────
 * Once a week the engine looks across the most active public sources for security upgrades that are PROVEN, not
 * fashionable, and lists them in the owner's weekly report. "Proven" is enforced by source and by evidence:
 *
 *   1. OSV.dev + the GitHub Advisory Database   published advisories (GHSA / CVE) for the packages this app declares
 *   2. CISA Known Exploited Vulnerabilities     vulnerabilities attackers are using in the wild right now
 *   3. Release feeds (GitHub, GitLab, Codeberg, GitBook-hosted changelogs, Node.js' security feed)
 *                                                what the maintainers of our stack shipped lately, flagged when they mention security
 *
 * Nothing here is applied automatically. Items that affect a dependency we declare rank first and become a
 * high-priority recommendation. Everything fetched is untrusted text: only an allowlisted https host is contacted,
 * responses are size-capped and timed out, markup is stripped, lengths are capped, and the text is never handed to a
 * model or used as an instruction.
 */

export interface IntelItem {
  source: "osv" | "github-advisory" | "cisa-kev" | "release-feed" | "feed";
  title: string;
  why: string;
  link: string;
  severity?: "critical" | "high" | "medium" | "low";
  affectsUs: boolean;
  rank: number;
  date?: string;
}

const SUFFIXES = ["github.com", "githubusercontent.com", "gitlab.com", "codeberg.org", "gitbook.io", "gitbook.com", "nodejs.org", "cisa.gov", "osv.dev", "npmjs.org", "npmjs.com", "openssf.org", "owasp.org", "vercel.com", "postgresql.org"];
export const allowedHost = (host: string): boolean => SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));

export function allowedUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    return u.protocol === "https:" && !u.username && !u.password && (u.port === "" || u.port === "443") && allowedHost(u.hostname) ? u : null;
  } catch { return null; }
}

export const DEFAULT_FEEDS = [
  "https://nodejs.org/en/feed/vulnerability.xml",
  "https://github.com/vercel/next.js/releases.atom",
  "https://github.com/brianc/node-postgres/releases.atom",
  "https://github.com/facebook/react/releases.atom",
  "https://github.com/OWASP/www-project-top-10-for-large-language-model-applications/releases.atom",
];

const MAX_BYTES = 2_000_000;
const TIMEOUT_MS = 10_000;
type Fetch = typeof fetch;

/** Strip markup and control characters, collapse whitespace, cap length. */
export const plain = (s: unknown, max = 220): string =>
  String(s ?? "").replace(/<[^>]*>/g, " ").replace(/&(amp|lt|gt|quot|#39);/g, (_, e: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[e] ?? "")
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮﻿]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

async function getText(f: Fetch, url: string, init?: RequestInit): Promise<string | null> {
  const u = allowedUrl(url);
  if (!u) return null;
  try {
    const res = await f(u.toString(), { ...init, redirect: "error", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { "user-agent": "madgambit-security-intel", accept: "application/json, application/atom+xml, application/xml, text/xml", ...(init?.headers ?? {}) } });
    if (!res.ok) return null;
    return (await res.text()).slice(0, MAX_BYTES);
  } catch { return null; }
}

/* ── declared dependencies ──────────────────────────────────────────── */

export function declaredDeps(pkg: { dependencies?: Record<string, string> }): { name: string; version: string }[] {
  return Object.entries(pkg.dependencies ?? {})
    .map(([name, range]) => ({ name, version: String(range).replace(/^[\^~>=<\s]+/, "").split(/[\s|]/)[0] }))
    .filter((d) => /^\d+\.\d+\.\d+/.test(d.version));
}

/* ── OSV (covers GitHub Advisory Database, npm advisories and CVEs) ─── */

const sevOf = (v: unknown): IntelItem["severity"] => {
  const s = String(v ?? "").toLowerCase();
  return s === "critical" || s === "high" || s === "medium" || s === "low" ? s : undefined;
};

export async function scanOsv(f: Fetch, deps: { name: string; version: string }[]): Promise<IntelItem[]> {
  if (!deps.length) return [];
  const batch = await getText(f, "https://api.osv.dev/v1/querybatch", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ queries: deps.map((d) => ({ package: { name: d.name, ecosystem: "npm" }, version: d.version })) }),
  });
  if (!batch) return [];
  let results: { vulns?: { id: string }[] }[] = [];
  try { results = JSON.parse(batch).results ?? []; } catch { return []; }

  const ids = new Map<string, string>(); // advisory id -> package
  results.forEach((r, i) => { for (const v of r.vulns ?? []) if (/^[A-Za-z0-9-]{4,40}$/.test(v.id) && !ids.has(v.id)) ids.set(v.id, deps[i].name); });

  const out: IntelItem[] = [];
  for (const [id, pkgName] of [...ids].slice(0, 20)) {
    const raw = await getText(f, `https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`);
    if (!raw) continue;
    try {
      const v = JSON.parse(raw) as { summary?: string; modified?: string; published?: string; database_specific?: { severity?: string }; affected?: { ranges?: { events?: { fixed?: string }[] }[] }[]; withdrawn?: string };
      if (v.withdrawn) continue;
      const fixed = (v.affected ?? []).flatMap((a) => (a.ranges ?? []).flatMap((r) => (r.events ?? []).map((e) => e.fixed).filter(Boolean)))[0];
      const sev = sevOf(v.database_specific?.severity);
      out.push({
        source: id.startsWith("GHSA") ? "github-advisory" : "osv",
        title: `${id}: ${plain(v.summary, 140) || "advisory"} (${pkgName})`,
        why: `Affects the ${pkgName} range this app declares${fixed ? `; fixed in ${plain(fixed, 20)}. Raise the declared minimum to at least that version` : "; see the advisory for the fix"}.`,
        link: `https://osv.dev/vulnerability/${encodeURIComponent(id)}`,
        severity: sev, affectsUs: true, date: plain(v.published ?? v.modified, 10),
        rank: 100 + (sev === "critical" ? 40 : sev === "high" ? 30 : sev === "medium" ? 15 : 5),
      });
    } catch { /* skip an unreadable advisory */ }
  }
  return out;
}

/* ── CISA Known Exploited Vulnerabilities ───────────────────────────── */

const STACK = /\b(node\.?js|next\.?js|react|vercel|postgres(ql)?|npm|openssl|chromium|chrome|cloudflare|nginx|linux kernel|curl|ssh|git|docker)\b/i;

export async function scanKev(f: Fetch, now = Date.now()): Promise<IntelItem[]> {
  const raw = await getText(f, "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json");
  if (!raw) return [];
  try {
    const list = (JSON.parse(raw).vulnerabilities ?? []) as { cveID: string; vendorProject: string; product: string; vulnerabilityName: string; dateAdded: string; requiredAction: string }[];
    return list
      .filter((v) => now - Date.parse(v.dateAdded) <= 30 * 86_400_000 && STACK.test(`${v.vendorProject} ${v.product}`))
      .slice(0, 10)
      .map((v): IntelItem => ({
        source: "cisa-kev",
        title: `${plain(v.cveID, 20)}: ${plain(v.vulnerabilityName, 130)} (${plain(v.vendorProject, 40)} ${plain(v.product, 40)})`,
        why: `Exploited in the wild (CISA KEV, added ${plain(v.dateAdded, 10)}). If any part of the stack or its host uses it: ${plain(v.requiredAction, 140)}`,
        link: `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(plain(v.cveID, 20))}`,
        severity: "high", affectsUs: false, date: plain(v.dateAdded, 10), rank: 60,
      }));
  } catch { return []; }
}

/* ── release / advisory feeds (GitHub, GitLab, Codeberg, GitBook, Node.js) ── */

const SECURITY_WORDS = /\b(security|cve-\d{4}-\d+|vulnerab|exploit|xss|csrf|ssrf|injection|rce|advisory|ghsa-)/i;

export function parseFeed(xml: string): { title: string; link: string; date: string; text: string }[] {
  const out: { title: string; link: string; date: string; text: string }[] = [];
  const blocks = xml.match(/<(entry|item)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  for (const b of blocks.slice(0, 15)) {
    const pick = (tag: string) => (b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"))?.[1] ?? "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
    const link = b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? pick("link");
    out.push({ title: plain(pick("title"), 140), link: plain(link, 300), date: plain(pick("updated") || pick("pubDate") || pick("published"), 40), text: plain(pick("content") || pick("description") || pick("summary"), 400) });
  }
  return out;
}

export async function scanFeeds(f: Fetch, feeds: string[], now = Date.now()): Promise<IntelItem[]> {
  const settled = await Promise.allSettled(feeds.map(async (url) => ({ url, xml: await getText(f, url) })));
  const out: IntelItem[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled" || !s.value.xml) continue;
    const host = new URL(s.value.url).hostname;
    for (const e of parseFeed(s.value.xml)) {
      const t = Date.parse(e.date);
      if (Number.isFinite(t) && now - t > 14 * 86_400_000) continue;
      const sec = SECURITY_WORDS.test(`${e.title} ${e.text}`);
      if (!sec && !/releases\.atom$/.test(s.value.url)) continue; // advisory-style feeds are all relevant; release feeds only if they mention security
      if (!sec) continue;
      const link = allowedUrl(e.link)?.toString() ?? s.value.url;
      out.push({
        source: /releases\.atom$/.test(s.value.url) ? "release-feed" : "feed",
        title: e.title || "(untitled)", why: `Maintainers flagged security content${e.text ? `: ${e.text.slice(0, 160)}` : ""}`,
        link, affectsUs: /next\.js|react|node-postgres|nodejs/i.test(`${s.value.url} ${e.title}`), date: e.date.slice(0, 10), rank: 40 + (host.endsWith("nodejs.org") ? 10 : 0),
      });
    }
  }
  return out;
}

/** Feeds the owner adds (e.g. a GitBook changelog, a GitLab or Codeberg tags feed) on top of the defaults. Invalid or off-allowlist entries are dropped. */
export function configuredFeeds(env: Record<string, string | undefined> = process.env): string[] {
  const extra = (env.SECURITY_INTEL_FEEDS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return [...new Set([...DEFAULT_FEEDS, ...extra])].filter((u) => allowedUrl(u) !== null);
}

/** The whole weekly scan. Never throws: a source that fails simply contributes nothing. */
export async function scanSecurityIntel(opts: { deps: { name: string; version: string }[]; fetchImpl?: Fetch; feeds?: string[]; now?: number }): Promise<IntelItem[]> {
  const f = opts.fetchImpl ?? fetch;
  const [osv, kev, feeds] = await Promise.all([
    scanOsv(f, opts.deps).catch(() => [] as IntelItem[]),
    scanKev(f, opts.now).catch(() => [] as IntelItem[]),
    scanFeeds(f, opts.feeds ?? configuredFeeds(), opts.now).catch(() => [] as IntelItem[]),
  ]);
  const seen = new Set<string>();
  return [...osv, ...kev, ...feeds]
    .filter((i) => (seen.has(i.link + i.title) ? false : (seen.add(i.link + i.title), true)))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, 25);
}
