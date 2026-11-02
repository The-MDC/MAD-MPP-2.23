/**
 * First-line support: classify, prioritise, redact and answer.
 * ────────────────────────────────────────────────────────────
 * Built on the common first-line pattern that holds up in practice: deflect what self-help can solve, capture a
 * structured ticket for what it cannot, prioritise by user impact (P1 → P4), route to the right lane, redact
 * personal data before anything is stored, and never let a person in distress (a compromised account, lost funds)
 * wait behind a how-to question.
 *
 * Deterministic on purpose: the triage decision is code, so it is testable, explainable and cannot be talked out of
 * escalating a security report. The model may phrase replies; it never decides priority.
 */

export type Category = "security" | "access" | "wallet" | "balance" | "market" | "bug" | "abuse" | "feedback" | "account" | "beta" | "how-to";
export type Severity = "P1" | "P2" | "P3" | "P4";
/** Which team's queue: support staff (user lane) or developers (dev lane). Staff-internal tickets use "staff". */
export type Lane = "user" | "dev" | "staff";

export interface Triage {
  isSupport: boolean;
  category: Category;
  severity: Severity;
  lane: Lane;
  /** File a ticket now, without waiting to be asked. */
  autoTicket: boolean;
  wantsTicket: boolean;
  /** Safety warnings to show first (e.g. a pasted seed phrase). */
  warnings: string[];
  selfHelp: string;
}

const RULES: { cat: Category; sev: Severity; re: RegExp }[] = [
  { cat: "security", sev: "P1", re: /\b(hack(ed)?|compromis|stolen|drained|phish|someone (logged|got) into|unauthori[sz]ed|account takeover|vulnerab|exploit|security (issue|bug|hole)|bug bounty|leak(ed)? (data|keys?))\b/i },
  { cat: "balance", sev: "P2", re: /\b(missing|lost|disappeared|gone|wrong|incorrect|not (credited|showing|received)|didn'?t (get|receive))\b.{0,40}\b(madx|balance|funds?|tokens?|payout|winnings|credits?)\b|\b(madx|balance|payout|winnings)\b.{0,40}\b(missing|wrong|gone|zero|not (showing|updated))\b/i },
  { cat: "access", sev: "P2", re: /\b(can'?t|cannot|unable to|won'?t let me|locked out|keeps? (asking|logging me out)|stuck at)\b.{0,40}\b(log ?in|sign ?in|get in|access|enter|pass|beta)\b|\b(invite|access) code\b.{0,30}\b(not working|invalid|expired|wrong)\b/i },
  { cat: "wallet", sev: "P2", re: /\b(wallet|metamask|rabby|coinbase wallet|siwe|sign(ing)? message|connect(ing)? (my )?wallet)\b.{0,40}\b(won'?t|doesn'?t|not|fail|error|stuck|can'?t)\b/i },
  { cat: "market", sev: "P3", re: /\b(dispute|wrong (outcome|result|resolution)|resolved (wrong|incorrectly)|unfair (resolution|market)|market (is )?(broken|stuck|frozen))\b/i },
  { cat: "abuse", sev: "P2", re: /\b(report (a |this )?(user|bot|scam|abuse)|harass|threat|scam(mer)?|impersonat|spam(ming)?|cheat(ing)?|manipulat|bot (is )?(trading|spamming))\b/i },
  { cat: "bug", sev: "P3", re: /\b(bug|error|crash(ed|es)?|broken|doesn'?t (work|load)|not (working|loading)|blank (page|screen)|500|404|glitch|frozen|freez(es|ing)|white screen|keeps? (failing|spinning))\b/i },
  { cat: "account", sev: "P3", re: /\b(delete my (account|data)|close my account|change my (email|handle|name)|export my data|privacy request|gdpr|ccpa)\b/i },
  { cat: "beta", sev: "P4", re: /\b(beta|invite|waitlist|wait list|when (do|will) i get (in|access)|open beta|closed beta|cohort|wave)\b/i },
  { cat: "feedback", sev: "P4", re: /\b(feature request|suggestion|idea|feedback|it would be (nice|cool|great)|you should add|please add|wish (it|you) (had|could))\b/i },
  { cat: "how-to", sev: "P4", re: /\b(how (do|can) i|where (do|can) i|what does .{1,30} mean|help me)\b/i },
];

const HELP: Record<Category, string> = {
  security: "I've flagged this as urgent for the team. Right now: don't share codes, passwords or seed phrases with anyone (staff will never ask), disconnect your wallet from unfamiliar sites, and if a wallet may be compromised, move what you can to a fresh wallet.",
  balance: "Balances update after the bet or swap settles. Refresh your profile once. If a free-play $MADx amount still looks wrong, I'll open a ticket with the details so the team can check the ledger.",
  access: "Try Creator Sign-in again with the exact pass you were given (it is case-sensitive), or redeem your invite code on the beta page. Private windows and blocked cookies stop the pass from sticking.",
  wallet: "Unlock your wallet first, make sure it is on the right network, then reconnect and approve the sign-in message (it costs nothing and moves nothing). If the prompt never appears, try another browser or disable conflicting wallet extensions.",
  market: "Every market resolves from the source and rules on its card. If you think one resolved wrong, I'll open a dispute ticket with the market name and why, and the team reviews it before anything is final.",
  abuse: "Thanks for flagging it. I'm passing it to the team with what you told me. Don't engage with the account in the meantime.",
  bug: "Sorry about that. A hard refresh fixes a surprising amount. If it doesn't, tell me what you clicked and what you saw, and I'll file it for the devs.",
  account: "Account and privacy requests are handled by a person. I'll open a ticket so the team can verify it is you and act on it.",
  beta: "We're running a closed beta first, then an extended open beta. Join the waitlist on the beta page; invites go out in waves. If you have an invite code, redeem it on the same page.",
  feedback: "Love it. I'll pass that to the team as feedback; the good ones end up on the roadmap.",
  "how-to": "",
};

const LANE: Record<Category, Lane> = {
  security: "dev", bug: "dev", balance: "user", access: "user", wallet: "user", market: "user", abuse: "user", account: "user", beta: "user", feedback: "user", "how-to": "user",
};

export const WANTS_TICKET = /\b(open|file|create|raise|submit|make)\b.{0,12}\b(a )?(ticket|report|case|support request)\b|\b(talk|speak) to (a )?(human|person|someone|support|staff)\b|\bcontact support\b/i;

/** 12 or 24 lowercase words in a row looks like a seed phrase someone is about to give away. */
export const looksLikeSeedPhrase = (t: string): boolean => /(?:\b[a-z]{3,8}\b[\s,]+){11,23}\b[a-z]{3,8}\b/.test(t.toLowerCase()) && !/[.?!]\s/.test(t);

export function triage(text: string): Triage {
  const warnings: string[] = [];
  if (looksLikeSeedPhrase(text)) warnings.push("That looks like a seed phrase. Never share it with anyone, including me. If you've posted it anywhere, treat that wallet as compromised and move your funds.");
  if (/\b(password|passcode|private key)\b\s*(is|:)/i.test(text)) warnings.push("Please don't share passwords or keys here. Nobody from MAD Gambit will ever ask for them.");

  const wantsTicket = WANTS_TICKET.test(text);
  const hit = RULES.find((r) => r.re.test(text));
  const category: Category = hit?.cat ?? (wantsTicket ? "bug" : "how-to");
  let severity: Severity = hit?.sev ?? "P4";
  if (warnings.length && severity !== "P1") severity = "P1"; // a leaked secret is an emergency whatever else they asked
  const isSupport = !!hit && category !== "how-to" || wantsTicket || warnings.length > 0;
  return {
    isSupport,
    category: warnings.length ? "security" : category,
    severity,
    lane: warnings.length ? "dev" : LANE[category],
    autoTicket: isSupport && (severity === "P1" || severity === "P2"),
    wantsTicket,
    warnings,
    selfHelp: HELP[warnings.length ? "security" : category],
  };
}

/* ── redaction: nothing personal is stored or shown to staff that need not be ── */

export function redact(text: string): string {
  return text
    .replace(/(?:\b[a-z]{3,8}\b[\s,]+){11,23}\b[a-z]{3,8}\b/gi, "[redacted: possible seed phrase]")
    .replace(/\b0x[a-fA-F0-9]{64}\b/g, "[redacted: private key]")
    .replace(/\b(password|passcode|private key|pass)\b(\s*(is|:)\s*)\S+/gi, "$1$2[redacted]")
    .replace(/\b0x[a-fA-F0-9]{40}\b/g, (w) => `${w.slice(0, 6)}…${w.slice(-4)}`)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[redacted: card-like number]")
    .replace(/\+?\d[\d ()-]{8,}\d/g, "[phone]")
    .slice(0, 2000);
}

export const SEVERITY_LABEL: Record<Severity, string> = { P1: "urgent", P2: "high", P3: "normal", P4: "low" };

/** What the user is told, in order: safety warnings, self-help, then the ticket. */
export function supportReply(t: Triage, ticket: { ref: string; token: string } | null): string {
  const parts = [...t.warnings];
  if (t.selfHelp) parts.push(t.selfHelp);
  if (ticket) parts.push(`I've opened ticket ${ticket.ref} (${SEVERITY_LABEL[t.severity]} priority). Keep this code to check on it: ${ticket.token}. A person on the team will pick it up.`);
  else if (t.isSupport && !t.autoTicket) parts.push(`If that doesn't sort it, say "open a ticket" and I'll hand it to the team.`);
  return parts.join(" ");
}
