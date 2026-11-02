import { beforeEach, describe, expect, it } from "vitest";
import { looksLikeSeedPhrase, redact, supportReply, triage } from "@/lib/support/triage";
import { betaPhase, hashCode, inviteUser, isInviteUser, newInviteCode, normaliseCode } from "@/lib/support/beta";
import {
  canonicalEmail, honeypotTripped, isDisposableEmail, issueChallenge, leadingZeroBits, MIN_FILL_MS, powHash,
  resetShield, verifyChallenge,
} from "@/lib/signup-shield";
import { noteThreat, resetThreats, threatStatus, RED_SCANS } from "@/lib/threat-status";
import { reportThreat, resetBreaker, LOCKDOWN_AT } from "@/lib/agent-defense";
import { parseSkill, runSkill, SKILLS } from "@/lib/concierge-skills";
import { loadKnowledge } from "@/lib/madhatr-knowledge";
import { buildPurgeLog, memorySubject, RETENTION_MS } from "@/lib/concierge-memory";
import { buildPlatformLog, buildUserLog, dayBounds, yesterday } from "@/lib/information-market/daily-log";
import type { Q } from "@/lib/admin-reports";

describe("first-line triage", () => {
  it("escalates security and compromised accounts to P1 on the dev lane, and files at once", () => {
    const t = triage("my account got hacked and my wallet was drained");
    expect(t).toMatchObject({ isSupport: true, category: "security", severity: "P1", lane: "dev", autoTicket: true });
  });
  it("treats a pasted seed phrase as an emergency and warns first", () => {
    const phrase = "apple banana cherry dog eagle fox grape house ice jungle kite lemon";
    expect(looksLikeSeedPhrase(phrase)).toBe(true);
    const t = triage(`help my wallet won't connect ${phrase}`);
    expect(t.severity).toBe("P1");
    expect(t.warnings[0]).toMatch(/seed phrase/);
    expect(redact(phrase)).toBe("[redacted: possible seed phrase]");
  });
  it("routes access, balance and disputes to the user lane", () => {
    expect(triage("I can't log in to the beta, my invite code is not working")).toMatchObject({ category: "access", severity: "P2", lane: "user" });
    expect(triage("my madx balance is missing after the bet")).toMatchObject({ category: "balance", lane: "user" });
    expect(triage("this market resolved wrong")).toMatchObject({ category: "market", severity: "P3", autoTicket: false });
  });
  it("leaves ordinary questions to the concierge, and honours 'open a ticket'", () => {
    expect(triage("how do I make a market?").isSupport).toBe(false);
    expect(triage("tell me a joke about fees").isSupport).toBe(false);
    const t = triage("the chart page is broken, please open a ticket");
    expect(t).toMatchObject({ isSupport: true, category: "bug", wantsTicket: true });
  });
  it("redacts personal data before anything is stored", () => {
    const r = redact("email me at nick@example.com, card 4111 1111 1111 1111, wallet 0x1234567890abcdef1234567890abcdef12345678, password: hunter2");
    expect(r).not.toMatch(/nick@example\.com|4111|hunter2/);
    expect(r).toContain("0x1234…5678");
  });
  it("tells the user the ticket number and code", () => {
    expect(supportReply(triage("my account was hacked"), { ref: "MG-ABCDEF", token: "XYZ" })).toMatch(/MG-ABCDEF.*XYZ/);
  });
});

describe("beta programme", () => {
  it("defaults to the closed beta and reads the phase from the environment", () => {
    expect(betaPhase({})).toBe("closed");
    expect(betaPhase({ BETA_PHASE: "extended-open" })).toBe("open");
    expect(betaPhase({ BETA_PHASE: "GA" })).toBe("ga");
  });
  it("makes readable codes, normalises input and hashes for storage", () => {
    const c = newInviteCode();
    expect(c).toMatch(/^MAD-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(normaliseCode(` ${c.toLowerCase().replace(/-/g, " ")} `)).toBe(c);
    expect(normaliseCode("MAD-0000-OOOO")).toBeNull();
    expect(hashCode(c)).toHaveLength(64);
    expect(hashCode(c)).not.toContain(c);
  });
  it("issues pass names the gate accepts, and nothing else", () => {
    expect(isInviteUser(inviteUser("invite", 42))).toBe(true);
    expect(isInviteUser(inviteUser("open", "7"))).toBe(true);
    for (const bad of ["admin", "invite:", "invite:../x", "open:a b"]) expect(isInviteUser(bad)).toBe(false);
  });
});

describe("signup shield", () => {
  beforeEach(resetShield);
  const SECRET = "s".repeat(32);
  // Tests solve at a low difficulty so they stay fast; production always demands DIFFICULTY (the default minimum).
  const D = 10;
  const solve = (salt: string, difficulty: number) => { for (let n = 0; ; n++) if (leadingZeroBits(powHash(salt, n)) >= difficulty) return String(n); };

  it("accepts a solved, signed, unexpired challenge once, and only once", () => {
    const now = 1_000_000;
    const c = issueChallenge(now, SECRET, D);
    const sol = { ...c, nonce: solve(c.salt, D) };
    expect(verifyChallenge(sol, now + MIN_FILL_MS + 1, SECRET)).toEqual({ ok: false, reason: "weak" }); // production minimum
    expect(verifyChallenge(sol, now + MIN_FILL_MS + 1, SECRET, D)).toEqual({ ok: true });
    expect(verifyChallenge(sol, now + MIN_FILL_MS + 2, SECRET, D)).toEqual({ ok: false, reason: "replayed" });
  });
  it("refuses forged, weakened, too-fast, expired and unsolved challenges", () => {
    const now = 2_000_000;
    const c = issueChallenge(now, SECRET, D);
    const nonce = solve(c.salt, D);
    expect(verifyChallenge({ ...c, nonce, difficulty: 4 }, now + 5000, SECRET, D)).toMatchObject({ ok: false }); // re-signed difficulty fails the signature
    expect(verifyChallenge({ ...c, nonce, sig: "0".repeat(64) }, now + 5000, SECRET, D)).toMatchObject({ reason: "bad-signature" });
    expect(verifyChallenge({ ...c, nonce }, now + 100, SECRET, D)).toMatchObject({ reason: "too-fast" });
    expect(verifyChallenge({ ...c, nonce }, now + 3600_000, SECRET, D)).toMatchObject({ reason: "expired" });
    expect(verifyChallenge({ ...c, nonce: "definitely-wrong" }, now + 5000, SECRET, D)).toMatchObject({ reason: "bad-work" });
    expect(verifyChallenge(null, now, SECRET)).toMatchObject({ reason: "missing" });
  });
  it("trips the honeypot only when a hidden field is filled", () => {
    expect(honeypotTripped({ email: "a@b.co" })).toBe(false);
    expect(honeypotTripped({ email: "a@b.co", website: "http://spam" })).toBe(true);
    expect(honeypotTripped({ company: " " })).toBe(false);
  });
  it("refuses disposable mail and collapses aliases", () => {
    expect(isDisposableEmail("x@mailinator.com")).toBe(true);
    expect(isDisposableEmail("x@madgambit.fun")).toBe(false);
    expect(canonicalEmail("Nick.J.McLeod+beta@GoogleMail.com")).toBe("nickjmcleod@gmail.com");
    expect(canonicalEmail("a.b+c@example.com")).toBe("a.b@example.com");
  });
});

describe("threat colour", () => {
  beforeEach(() => { resetThreats(); resetBreaker(); });
  it("is green when quiet, yellow when scanned, red when attacked", () => {
    const t = 5_000_000;
    expect(threatStatus({ now: t }).colour).toBe("green");
    for (let i = 0; i < 3; i++) noteThreat("scan", "honeypot", t);
    expect(threatStatus({ now: t }).colour).toBe("yellow");
    noteThreat("attack", "ban", t);
    noteThreat("attack", "canary", t);
    expect(threatStatus({ now: t }).colour).toBe("red");
    expect(threatStatus({ now: t + 11 * 60_000 }).colour).toBe("green");
  });
  it("goes red on a scan flood or a breaker lockdown, and counts shared signals from other instances", () => {
    const t = 9_000_000;
    for (let i = 0; i < RED_SCANS; i++) noteThreat("scan", "cross-origin", t);
    expect(threatStatus({ now: t }).colour).toBe("red");
    resetThreats();
    reportThreat(LOCKDOWN_AT, t);
    expect(threatStatus({ now: t + 1 }).colour).toBe("red");
    resetBreaker();
    expect(threatStatus({ now: t, shared: { scans: 3, attacks: 0 } }).colour).toBe("yellow");
  });
});

describe("concierge skills", () => {
  const kb = loadKnowledge();
  it("parses slash commands and ignores everything else", () => {
    expect(parseSkill("/odds 62")?.skill.id).toBe("odds");
    expect(parseSkill("odds 62")).toBeNull();
    expect(parseSkill("/rm -rf")).toBeNull();
  });
  it("calculates from the canonical maths", () => {
    expect(runSkill("/odds 50", { kb })).toMatch(/fair odds of 2.*1\.96/);
    expect(runSkill("/fee 10000", { kb })).toMatch(/188.*community 54\.14.*protocol 133\.86/);
    expect(runSkill("/fee 10000 28.8", { kb })).toMatch(/creator 54\.14, community 38\.55, protocol 95\.31/);
    expect(runSkill("/kelly 50 2.0", { kb })).toMatch(/no edge/);
    expect(runSkill("/kelly 60 2.0", { kb })).toMatch(/10% of your bankroll/);
    expect(runSkill("/stake 1000", { kb })).toMatch(/Silver: 18\.8% APY/);
    expect(runSkill("/shield 100 50 0.2", { kb })).toMatch(/28\.8|40/);
    expect(runSkill("/moon", { kb, now: Date.parse("2026-11-02T00:00:00Z") })).toMatch(/lit.*multiplier.*Leg/);
  });
  it("teaches from the knowledge base in plain words", () => {
    expect(runSkill("/explain volatility", { kb })).toMatch(/swing|lurch/i);
    expect(runSkill("/explain market maker", { kb })).toMatch(/formula|see-saw/i);
    expect(runSkill("/sources lmsr", { kb })).toMatch(/Hanson/);
    expect(runSkill("/help", { kb })).toMatch(/\/odds/);
    expect(SKILLS.length).toBeGreaterThanOrEqual(14);
  });
  it("never throws on bad input", () => {
    for (const bad of ["/odds", "/odds banana", "/fee -5", "/kelly 200 0.5", "/stake", "/shield x"]) expect(typeof runSkill(bad, { kb })).toBe("string");
  });
});

describe("concierge memory", () => {
  it("keeps users 48 hours and staff, admins, devs and VIPs a week", () => {
    expect(RETENTION_MS.user).toBe(48 * 3600_000);
    expect(RETENTION_MS.staff).toBe(7 * 86_400_000);
    expect(RETENTION_MS.vip).toBe(7 * 86_400_000);
  });
  it("hashes the person, never stores them raw", () => {
    const s = memorySubject("0xABCDEF0000000000000000000000000000000001", { MEMORY_PEPPER: "p" });
    expect(s).toHaveLength(32);
    expect(s).toBe(memorySubject("0xabcdef0000000000000000000000000000000001", { MEMORY_PEPPER: "p" }));
    expect(s).not.toBe(memorySubject("0xabcdef0000000000000000000000000000000001", { MEMORY_PEPPER: "q" }));
  });
  it("writes a readable log of what the weekly dump removes", () => {
    const log = buildPurgeLog([
      { subject: "a".repeat(32), tier: "staff", role: "user", content: "how are the markets", created_at: "2026-10-26T10:00:00.000Z" },
      { subject: "a".repeat(32), tier: "staff", role: "assistant", content: "busy", created_at: "2026-10-26T10:00:05.000Z" },
    ], new Date("2026-11-02T03:30:00Z"));
    expect(log).toMatch(/weekly dump log/);
    expect(log).toMatch(/2 turns from 1/);
    expect(log).toMatch(/staff · 2 turns/);
  });
});

describe("information market daily logs", () => {
  it("computes yesterday and the day's bounds in UTC", () => {
    expect(yesterday(new Date("2026-11-02T00:20:00Z"))).toBe("2026-11-01");
    expect(dayBounds("2026-11-01")).toEqual(["2026-11-01T00:00:00.000Z", "2026-11-02T00:00:00.000Z"]);
  });
  it("builds a platform log with a header, records and warehouse metrics, naming missing sources", async () => {
    const q: Q = async (sql) => {
      if (sql.includes("FROM events_stream") && sql.includes("event_type AS key")) return [{ key: "bet_placed", n: 12, wallets: 4 }];
      if (sql.includes("FROM cards")) throw new Error("no table");
      return [];
    };
    const { log, metrics } = await buildPlatformLog(q, "2026-11-01");
    const lines = log.body.trim().split("\n").map((l) => JSON.parse(l));
    expect(lines[0]).toMatchObject({ type: "header", log: "platform", day: "2026-11-01", initiated_by: "madhatr-concierge" });
    expect(lines[0].unavailable).toContain("cards_minted");
    expect(lines[1]).toMatchObject({ section: "events_by_type", key: "bet_placed", n: 12 });
    expect(metrics["events_by_type:bet_placed"]).toBe(12);
    expect(log.path).toBe("logs/platform/2026-11-01.jsonl");
    expect(log.sha256).toHaveLength(64);
  });
  it("builds a user log keyed by hashed subjects with no raw wallets", async () => {
    const w = "0xabcdef0000000000000000000000000000000001";
    const q: Q = async (sql) => {
      if (sql.includes("FROM events_stream")) return [{ w, event_type: "bet_placed", n: 3, f: new Date("2026-11-01T01:00:00Z"), l: new Date("2026-11-01T05:00:00Z") }];
      if (sql.includes("FROM bets")) return [{ w, n: 2, a: 50 }];
      return [];
    };
    const { log, rows } = await buildUserLog(q, "2026-11-01");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ events: 3, bets: 2, wagered: 50, eventTypes: { bet_placed: 3 } });
    expect(log.body).not.toContain(w);
    expect(log.path).toBe("logs/users/2026-11-01.jsonl");
  });
});
