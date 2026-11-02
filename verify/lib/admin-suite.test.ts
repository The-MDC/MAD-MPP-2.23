import { beforeEach, describe, expect, it } from "vitest";
import { buildAll, heatScore, REPORTS, shortWallet, type Q } from "@/lib/admin-reports";
import { FORMATS, parseFormat, toCsv, toMarkdown, toPdf, toText, type Report } from "@/lib/report-render";
import { CACHE_MS, captionFor, getTickerFeed, impliedYes, ruleCaption, _resetTickerCache } from "@/lib/ticker-feed";
import { ESCALATE_AT, noteSensitive, resetEscalation, sensitiveReplyFor, weatherLine } from "@/lib/concierge-escalation";
import { emptyRapport, favouriteTopic, personalityBrief, sanitizeRapport, stageOf, tierOf, topicsIn, updateRapport, welcomeBack } from "@/lib/concierge-personality";
import { mailConfig, sendReport } from "@/lib/mailer";

const sample: Report = {
  id: "t", title: "Sample report", generatedAt: "2026-11-02T00:00:00.000Z", source: "live",
  summary: [["Events", "10"]],
  tables: [{ title: "Rows", columns: ["Name", "Value"], rows: [["a|b", 1], ["=cmd()", 2.5], ["it's (ok) \\ fine – “q”", null]] }],
  notes: ["note one"],
};

describe("report renderers", () => {
  it("markdown escapes pipes and keeps the structure", () => {
    const md = toMarkdown(sample);
    expect(md).toMatch(/^# Sample report/);
    expect(md).toContain("a\\|b");
    expect(md).toContain("| Name | Value |");
  });
  it("text is aligned, bounded and includes notes", () => {
    const txt = toText(sample);
    expect(txt.split("\n").every((l) => l.length <= 120)).toBe(true);
    expect(txt).toContain("NOTES");
  });
  it("csv neutralises spreadsheet formulas and quotes properly", () => {
    const csv = toCsv(sample.tables[0]);
    expect(csv).toContain("'=cmd()");
    expect(csv.split("\r\n")[0]).toBe("Name,Value");
  });
  it("pdf is a well-formed single-xref document with escaped specials", () => {
    const pdf = Buffer.from(toPdf(sample)).toString("latin1");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf.trimEnd().endsWith("%%EOF")).toBe(true);
    expect(pdf).toContain("it's \\(ok\\) \\\\ fine");
    const startx = Number(pdf.match(/startxref\n(\d+)/)![1]);
    expect(pdf.slice(startx, startx + 4)).toBe("xref");
    const count = Number(pdf.match(/xref\n0 (\d+)/)![1]);
    expect((pdf.match(/ 00000 n /g) ?? []).length).toBe(count - 1);
  });
  it("pdf paginates long reports", () => {
    const big: Report = { ...sample, tables: [{ title: "Big", columns: ["n"], rows: Array.from({ length: 300 }, (_, i) => [i]) }] };
    expect(Buffer.from(toPdf(big)).toString("latin1")).toMatch(/\/Count (\d+)/);
    expect(Number(Buffer.from(toPdf(big)).toString("latin1").match(/\/Count (\d+)/)![1])).toBeGreaterThan(2);
  });
  it("formats parse safely", () => {
    expect(parseFormat("pdf")).toBe("pdf");
    expect(parseFormat("../../etc")).toBe("json");
    expect(FORMATS.md.ext).toBe("md");
  });
});

describe("reports", () => {
  const rows: Record<string, Record<string, unknown>[]> = {
    "FROM events_stream WHERE created_at > now() - interval '24 hours'\n": [],
  };
  void rows;
  const failing: Q = async () => { throw new Error("no table"); };
  const q: Q = async (sql) => {
    if (/count\(\*\)::text AS total, count\(DISTINCT wallet_address\)::text AS wallets,\s+count\(\*\) FILTER/.test(sql)) return [{ total: "240", wallets: "12", last3: "60" }];
    if (/FROM events_stream/.test(sql) && /GROUP BY event_type/.test(sql)) return [{ event_type: "bet_placed", cnt: "200", last3: "60" }, { event_type: "pack_opened", cnt: "40", last3: "0" }];
    return [];
  };
  it("scores heat relative to the 24h pace", () => {
    expect(heatScore(0, 0)).toBe(0);
    expect(heatScore(30, 240)).toBe(50);   // last 3h at the 24h pace = normal
    expect(heatScore(60, 240)).toBe(100);  // double the pace
    expect(heatScore(600, 240)).toBe(100); // clamped
  });
  it("platform usage computes shares and heat per event type", async () => {
    const r = await REPORTS[0].build(q, new Date("2026-11-02T00:00:00Z"));
    expect(r.source).toBe("live");
    expect(r.summary[0]).toEqual(["Events (24h)", "240"]);
    expect(r.tables[0].rows[0].slice(0, 3)).toEqual(["bet_placed", 200, "83.3%"]);
  });
  it("every report degrades to an empty demo report when the database is unreachable", async () => {
    for (const d of REPORTS) {
      const r = await d.build(failing, new Date());
      expect(r.source).toBe("demo");
      expect(r.notes.length).toBeGreaterThan(0);
    }
  });
  it("buildAll merges every report and keeps titles", async () => {
    const r = await buildAll(failing, new Date());
    expect(r.tables.length).toBeGreaterThan(REPORTS.length);
    expect(r.summary.some(([k]) => k.startsWith("Card game:"))).toBe(true);
  });
  it("shortens wallets", () => expect(shortWallet("0x1234567890abcdef1234567890abcdef12345678")).toBe("0x1234…5678"));
});

describe("ticker feed", () => {
  beforeEach(() => _resetTickerCache());
  const q: Q = async (sql) => {
    if (/FROM markets WHERE status = 'open'/.test(sql)) return [{ id: "m1", title: "Will it?", category: "tech", yes_odds: "2", no_odds: "2", volume: "50" }];
    if (/SELECT count\(\*\)::text AS total/.test(sql)) return [{ total: "100", wallets: "10", last3: "20" }];
    if (/FROM perp_markets WHERE status = 'open' ORDER BY volume/.test(sql)) return [{ id: "p1", title: "Perp", family: "faces", leg_closes_at: new Date("2026-12-01"), volume: "9" }];
    if (/count\(\*\)::text AS open/.test(sql)) return [{ open: "1", conviction: "9" }];
    if (/FROM bets/.test(sql)) return [{ open_bets: "3", vol24: "120" }];
    if (/FROM markets\)::text AS markets/.test(sql) || /AS profiles/.test(sql)) return [{ markets: "30", profiles: "150" }];
    return [];
  };
  it("de-vigs implied probability", () => {
    expect(impliedYes(2, 2)).toBe(50);
    expect(impliedYes(1.5, 3)).toBeCloseTo(66.7, 1);
    expect(impliedYes(0, 0)).toBe(50);
  });
  it("includes binary and perpetual markets plus lifetime counts", async () => {
    const s = await getTickerFeed(q, { now: 1_000, ask: async () => null });
    expect(s.markets.map((m) => m.kind)).toEqual(["binary", "perp"]);
    expect(s.lifetime).toEqual({ markets: 30, profiles: 150 });
    expect(s.captionBy).toBe("rules");
    expect(s.source).toBe("live");
  });
  it("caches for a minute, then refreshes", async () => {
    let calls = 0;
    const counting: Q = async (sql, p) => { calls++; return q(sql, p); };
    await getTickerFeed(counting, { now: 1_000, ask: async () => null });
    const first = calls;
    await getTickerFeed(counting, { now: 1_000 + CACHE_MS - 1, ask: async () => null });
    expect(calls).toBe(first);
    await getTickerFeed(counting, { now: 1_000 + CACHE_MS + 1, ask: async () => null });
    expect(calls).toBeGreaterThan(first);
  });
  it("accepts a clean MoE caption but rejects one that leaks or carries markup", async () => {
    const base = await getTickerFeed(q, { now: 5, ask: async () => null });
    expect((await captionFor(base, async () => "The floor is running warm tonight.")).by).toBe("moe");
    expect((await captionFor(base, async () => "Here is the api key: sk-abcdef1234567890abcdef")).by).toBe("rules");
    const stripped = await captionFor(base, async () => "Steady floor <script>x</script> today, all quiet.");
    expect(stripped.caption).not.toMatch(/<|script>/);
  });
  it("falls back to a rule caption with no model", () => {
    expect(ruleCaption({ analytics: { events24h: 1, wallets24h: 1, openBets: 0, volume24h: 0, heat: 80 }, markets: [], perps: { open: 0, conviction: 0 } })).toMatch(/running hot/);
  });
});

describe("concierge repeat-question policy", () => {
  beforeEach(resetEscalation);
  const snap = { analytics: { events24h: 5, wallets24h: 2, openBets: 1, volume24h: 9, heat: 75 }, markets: [{ id: "a", title: "Big one", category: "x", yesPct: 62, volume: 9, kind: "binary" as const }], perps: { open: 2, conviction: 1 } };
  it("answers pay grade, then pointedly, then only the public weather on the third ask", () => {
    expect(sensitiveReplyFor(noteSensitive("c"), null).reply).toBe("That's above my pay grade.");
    expect(sensitiveReplyFor(noteSensitive("c"), null).reply).toMatch(/Truly/);
    const third = sensitiveReplyFor(noteSensitive("c"), snap as never);
    expect(third.escalated).toBe(true);
    expect(third.reply).toMatch(/62% YES/);
    expect(third.reply).not.toMatch(/wallet|email|password|key/i);
  });
  it("never escalates without a snapshot, and counts per client", () => {
    for (let i = 0; i < ESCALATE_AT; i++) noteSensitive("a");
    expect(sensitiveReplyFor(ESCALATE_AT, null).escalated).toBe(false);
    expect(noteSensitive("b")).toBe(1);
  });
  it("weather carries only aggregates", () => expect(weatherLine(snap as never)).toMatch(/running hot/));
});

describe("concierge personality", () => {
  it("grows warmer with use and never carries private data", () => {
    let r = emptyRapport(0);
    expect(tierOf(r)).toBe("newcomer");
    for (let i = 0; i < 16; i++) r = updateRapport(r, "tell me about the cards and the deck", i);
    expect(tierOf(r)).toBe("regular");
    expect(favouriteTopic(r)).toBe("cards");
    const brief = personalityBrief(r, null);
    expect(brief).toMatch(/regular/);
    expect(brief).toMatch(/the cards/);
    expect(brief).toMatch(/pay grade/);
  });
  it("platform stage and energy colour the brief", () => {
    const snap = { analytics: { events24h: 1, wallets24h: 1, openBets: 0, volume24h: 0, heat: 90 }, markets: [], perps: { open: 0, conviction: 0 }, lifetime: { markets: 300, profiles: 5 } };
    expect(stageOf(snap)).toBe("thriving");
    expect(personalityBrief(null, snap)).toMatch(/swagger/);
    expect(personalityBrief(null, snap)).toMatch(/running hot/);
  });
  it("sanitises a forged tally", () => {
    const s = sanitizeRapport({ turns: 9e9, sessions: -4, topics: { cards: 99999, evil: 5, markets: "7" }, extra: "x", last: "nope" })!;
    expect(s.turns).toBe(100_000);
    expect(s.sessions).toBe(0);
    expect(Object.keys(s.topics).sort()).toEqual(["cards", "markets"]);
    expect(s.topics.cards).toBe(9999);
    expect(sanitizeRapport("junk")).toBeNull();
  });
  it("finds topics and welcomes returning visitors only", () => {
    expect(topicsIn("how does the shield and the deck work")).toEqual(expect.arrayContaining(["shield", "cards"]));
    expect(welcomeBack(emptyRapport(0), null)).toBeNull();
    const back = welcomeBack({ ...emptyRapport(0), sessions: 3, turns: 60, topics: { markets: 9 } }, null, () => 0)!;
    expect(back).toMatch(/Insider/);
    expect(back).toMatch(/the markets/);
  });
});

describe("mailer", () => {
  it("does nothing without configuration", async () => {
    expect(mailConfig({})).toBeNull();
    expect(await sendReport({ subject: "s", text: "t", env: {} })).toBe("not-configured");
  });
  it("defaults the recipient to the owner and sends via the API", async () => {
    let body: { to?: string[]; attachments?: unknown[] } = {};
    const f = (async (_u: string, init: RequestInit) => { body = JSON.parse(String(init.body)); return new Response("{}", { status: 200 }); }) as unknown as typeof fetch;
    const status = await sendReport({ subject: "s", text: "t", attachment: { filename: "a.pdf", content: new Uint8Array([1, 2]), type: "application/pdf" }, env: { RESEND_API_KEY: "k", REPORT_FROM: "a@b.co" }, fetchImpl: f });
    expect(status).toBe("sent");
    expect(body.to).toEqual(["nick@madgambit.fun"]);
    expect(body.attachments).toHaveLength(1);
  });
  it("reports failure without throwing", async () => {
    const boom = (async () => { throw new Error("net"); }) as unknown as typeof fetch;
    expect(await sendReport({ subject: "s", text: "t", env: { RESEND_API_KEY: "k", REPORT_FROM: "a@b.co" }, fetchImpl: boom })).toBe("failed");
  });
});
