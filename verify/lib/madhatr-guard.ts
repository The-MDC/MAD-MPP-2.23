/**
 * MADHAT'r sensitive-question guard.
 * ──────────────────────────────────
 * Anything that asks for a secret, an internal, a private figure or a private person gets exactly one answer —
 * "That's above my pay grade." — from CODE, before the knowledge file is searched and before any model (NIM or
 * Gemini) is called. The model never sees the question, so it cannot be talked into answering it.
 *
 * It is deliberately a blunt, readable list, not a classifier. A false positive costs one shrug; a false negative
 * costs a leak. The knowledge file is also kept free of secrets, and `looksLikeLeak` screens model output as a last
 * line of defence.
 */
export const SENSITIVE_REPLY = "That's above my pay grade.";

const norm = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/\s+/g, " ").trim();

const SENSITIVE: readonly RegExp[] = [
  // credentials, keys and infrastructure
  /\b(api|access|auth|bearer|session|oidc|jwt|admin|service)[ -]?(key|token|secret)s?\b/,
  /\b(password|passcode|passphrase|credential|credentials|private key|secret key|seed phrase|mnemonic)s?\b.*\b(your|the|admin|guest|beta|team|company|founder|nick|server|database|login)\b/,
  /\b(admin|guest|beta|team|server|database|nick'?s?|founder'?s?)\b.*\b(password|passcode|credentials?|login|private key)\b/,
  /\b(env(ironment)?[ -]?var(iable)?s?|\.env|connection string|database url|db url|supabase|neon|postgres|vercel|render|cloudflare|aws)\b.*\b(key|token|secret|password|url|credential|access|config)\b/,
  /\b(guest|beta)[ -]?(login|logins|pass|passcode|credentials?)\b/,
  // prompt and file extraction
  /\b(system|hidden|secret|original|initial) (prompt|instructions?)\b/,
  /\bignore (all |any |your |the )?(previous|prior|above|earlier) (instructions?|rules|prompts?)\b/,
  /\b(reveal|show|print|dump|repeat|leak|read out|output) (me )?(your|the) (prompt|instructions?|knowledge|file|rules|config)\b/,
  /\bknowledge (base|file)\b.*\b(show|print|dump|full|entire|whole|contents?)\b/,
  // money, fundraising and company internals
  /\b(valuation|pre-?money|post-?money|cap table|term sheet|runway|burn rate|burn|use of proceeds|data room (login|password|access link))\b/,
  /\bhow much (has|have|did|does|is|are) (mad gambit|the company|the team|nick|the founders?|the mdc|the maddao|maddegens|you)\b.*\b(rais|made|earn|rev|worth|funded|fund|profit|cash|treasury|valu)/,
  /\b(who|which)\b.*\b(invest(ed|ors?)|backers?|funded|vcs?|angels?)\b/,
  /\b(raise|raised|raising|funding round|seed round|investment round|fundraise|fundraising)\b.*\b(amount|size|how much|terms?|price|figure|close|target)\b/,
  /\b(revenue|profit|mrr|arr|ebitda|income|salary|salaries|payroll|compensation|equity split|vesting schedule|founder allocation|team allocation|treasury balance)\b.*\b(company|team|founders?|mad gambit|nick|carlo|zena|mdc|maddao|actual|real|current)\b/,
  /\b(how many|number of)\b.*\b(sign-?ups?|users?|members?|wallets?|holders?|subscribers?|waitlist|customers?)\b/,
  // proprietary maths
  /\b(exact|actual|real|secret|hidden|server-?side|proprietary)\b.*\b(coefficients?|weights?|exponents?|parameters?|constants?|formula|omega|alpha|beta)\b/,
  /\b(coefficients?|exponents?|weights?)\b.*\b(madconv|garch|z-?liar|conviction|emotion|scandal velocity|shield|lmsr)\b/,
  // security and abuse
  /\b(vulnerabilit(y|ies)|exploit|backdoor|bypass|jailbreak|hack|crack|sql injection|xss|rce|exfiltrat)\w*\b.*\b(mad gambit|madgambit|the app|the site|the platform|your|beta|server|contract|vault)\b/,
  /\b(private|internal|unreleased|confidential)\b.*\b(repo|repository|document|docs?|roadmap|plans?|contracts?|code|keys?)\b/,
  /\b(nda|non-?disclosure)\b/,
  // private people and private data
  /\b(home|house|street|mailing|personal) address\b/,
  /\b(phone|cell|mobile|whatsapp|telegram|signal|personal email|private email|email address|dm)\b.*\b(nick|carlo|zena|zainab|founder|ceo|coo|cfo|team|member|user)\b/,
  /\b(nick|carlo|zena|zainab|founder|ceo|coo|cfo)\b.*\b(phone|cell|mobile|whatsapp|home|address|personal email|private email|email address|girlfriend|wife|husband|kids?|children|family|passport|ssn|social security|birthday|age)\b/,
  /\b(other|another|someone'?s?|everyone'?s?|all) (users?|members?|players?|wallets?|accounts?)\b.*\b(balance|email|data|wallet|address|identity|name|positions?|holdings)\b/,
  /\b(list|dump|export|give me)\b.*\b(users?|emails?|wallets?|members?|accounts?|customers?)\b/,
  /\bdox+\b/,
];

/** True when the question asks for something the concierge must never answer. */
export function isSensitiveQuery(text: string): boolean {
  const t = norm(text);
  if (!t) return false;
  return SENSITIVE.some((re) => re.test(t));
}

const LEAK: readonly RegExp[] = [
  /nvapi-[A-Za-z0-9_-]{8,}/,
  /\bsk-[A-Za-z0-9_-]{16,}/,
  /\brnd_[A-Za-z0-9]{16,}/,
  /\bAIza[0-9A-Za-z_-]{20,}/,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./, // a JWT
  /\b[0-9a-fA-F]{64}\b/, // 256-bit hex: a key, a hash, or a private key
  /\bGUEST_(LOGINS|USER|PASS)\b/,
  /\b(NIM|GOOGLE|OPENAI|SUPABASE|DATABASE)_[A-Z_]*(KEY|URL|SECRET|TOKEN|PASS)\b/,
  /\b(password|passcode|api key|secret)\s*(is|=|:)\s*\S{6,}/i,
];

/** Last line of defence on model output: a reply that looks like it contains a secret is never sent. */
export function looksLikeLeak(reply: string): boolean {
  return LEAK.some((re) => re.test(reply));
}
