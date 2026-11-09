#!/usr/bin/env node
/**
 * Fails (report-only for now — see ci.yml) if a mutating API route handler
 * (POST/PUT/PATCH/DELETE) has no recognizable AUTHORIZATION guard.
 *
 * Why this exists: an audit found 33 of 53 mutating routes under app/api had
 * no protection at all, not by decision — each route.ts is independently
 * responsible for remembering to call a guard, and most didn't. This makes
 * that failure mode visible in CI instead of only in a manual audit.
 *
 * ── A RATE LIMIT IS NOT AUTHORIZATION ────────────────────────────────────
 * This script used to list `enforceRateLimit(` alongside the auth guards, and
 * that single line cost it the thing it was built to catch. It printed
 *
 *     ✅ all mutating routes are guarded (95 route files scanned)
 *
 * while 26 mutating routes had no identity check of any kind — among them
 * `cards/collect`, which read `walletAddress` AND `rarity` from the request
 * body and wrote the row, so any anonymous caller could mint a Legendary into
 * any wallet at 30 requests a minute. The paid path next door authenticated
 * properly. The check reported both as protected.
 *
 * A rate limit governs HOW FAST an anonymous caller can act. It never
 * establishes WHO they are. The two are different guarantees and are now
 * counted separately:
 *
 *   AUTH_CALLS — establishes identity or a shared secret. Satisfies the check.
 *   COST_CALLS — caps spend/abuse. Does NOT satisfy it on its own.
 *
 * A route with only a cost guard must carry `// PUBLIC-ROUTE: <reason>`, the
 * same as a route with no guard at all — because that is what it is. The
 * marker makes each deliberate exemption visible in review rather than
 * silently absorbed into a green tick.
 *
 * ── Reading the output ───────────────────────────────────────────────────
 * The summary prints the scanned file count and the exempt count. A count of
 * zero scanned files means the walk found nothing and the tick is meaningless
 * — this repo has been bitten three separate times by a green gate that was
 * looking at an empty set, so the number is printed every run, and a zero
 * scan is a hard failure rather than a pass.
 *
 * ── THE LEDGER CHECK (T1 phase 3) ────────────────────────────────────────
 * Authorization answers "who is calling?". It says nothing about whether the
 * call moves value through the one $MADx ledger (lib/madx-web2.ts). T1 found five
 * routes — perps/convict, faces/stake, shield/opt-in, zeitgeist/auction and the
 * bets route — that took or promised value and wrote their own state with no
 * debit, and the auth check above passed every one of them. This is the second
 * check, and it is mechanical on purpose:
 *
 *   1. REGISTRY HYGIENE — every module in LEDGER_ENTRYPOINTS exists and still
 *      exports every symbol listed. A rename would otherwise quietly turn the
 *      whole check into a no-op, which is the failure this repo keeps having.
 *   2. REGISTRY COMPLETENESS — any lib/ or app/ module that imports a
 *      value-moving function from madx-web2 must itself be registered. This is
 *      what stops a NEW wrapper (the next perp-store) from being invisible here.
 *   3. PINNED ROUTES — the routes T1 fixed must still call a registered ledger
 *      entrypoint. Refactor the debit out and this fails, whatever the route says.
 *   4. UNPRICED VALUE — any other mutating route that reads a monetary field
 *      (amount, deposit, premium, payout, bid …) must call the ledger, carry a
 *      `// LEDGER-FREE: <reason>`, or be in KNOWN_LEDGER_FREE.
 *
 * A call counts only if the symbol is IMPORTED from its registered module and
 * then CALLED — a word match on `transfer(` or `fill(` would credit `Array.fill`.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// `--root <dir>` points the check at another copy of the app (the unit test
// mutates a copy and asserts this script fails on it — see
// lib/route-ledger-guard.test.ts). Default: the app this script lives in.
const ROOT = (() => {
  const i = process.argv.indexOf("--root");
  return i !== -1 && process.argv[i + 1]
    ? path.resolve(process.argv[i + 1])
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
})();
const API_DIR = path.join(ROOT, "app", "api");
const APP_DIR = path.join(ROOT, "app");
const LIB_DIR = path.join(ROOT, "lib");

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/** Establishes identity, ownership, or a shared secret. Satisfies the check. */
const AUTH_CALLS = [
  "requireMadxRouteAuth(",
  "requireBearerSecret(",
  // Admin suite: verifies the signed admin session cookie and the role permission (lib/admin-guard.ts).
  "requireAdmin(",
  "getSessionFromRequest(",
  'mode: "session"',
  'mode: "bearer"',
  // A role credential carried in a named header — `x-pause-guardian`,
  // `x-registrar`. Timing-safe, and fails CLOSED when its env var is unset
  // rather than degrading to session auth. This is the general form of the
  // guardianAuthorised special case below, and a real auth guard.
  "requireHeaderSecret(",
  // registrar/pause carries its own guardian check against PAUSE_GUARDIAN_TOKEN
  // rather than going through requireBearerSecret, because the pause credential
  // is a separate custody model from CRON_SECRET. It is a real auth guard and
  // was being reported as unguarded purely because it is spelled differently.
  "guardianAuthorised(",
];

/**
 * Caps cost or abuse. Necessary on public routes, never sufficient on its own.
 * `mode: "public"` is withRouteGuard's own name for exactly this — deliberately
 * open, still rate-limited — so it belongs here and not with the auth calls.
 */
const COST_CALLS = ["enforceRateLimit(", 'mode: "public"'];

/**
 * Matches both comment styles. Several routes wrote the exemption inside a
 * JSDoc block as ` * PUBLIC-ROUTE: …` — a perfectly clear, reviewable marker
 * that the old exact-string test for `// PUBLIC-ROUTE:` silently missed, so
 * auth/logout was reported as a failure while carrying a written-out reason.
 */
const OPT_OUT = /(?:\/\/|\*)\s*PUBLIC-ROUTE:/;

/**
 * KNOWN COST-ONLY ROUTES — a ratchet, not an amnesty.
 *
 * Each of these mutates state or spends money with a rate limit and no identity
 * check. Every one of them needs a decision that is a PRODUCT decision, not an
 * engineering one — who is allowed to create a market, whether the concierge is
 * free to anonymous visitors, whether GDELT ingestion is an operator action —
 * and guessing at those in a security pass would be inventing policy.
 *
 * So they are enumerated here and reported every run, and the check does not
 * fail on them. It DOES fail on anything not in this list, which is the point:
 * the debt is fixed in size, visible by name, and cannot grow. Deleting a line
 * from this list is how a route graduates; adding one should require an
 * argument in review.
 *
 * When the decision lands, the fix is `withRouteGuard({ mode: "session" | "bearer" })`
 * or a `// PUBLIC-ROUTE:` marker — and the line comes out of here.
 */
const KNOWN_COST_ONLY = new Set([
  // Empty, and the aim is to keep it that way. Every entry that was here has
  // been resolved: four session-guarded, three bearer-guarded, one marked
  // PUBLIC-ROUTE because the openness was already a written-down decision, and
  // one route deleted outright. A new line here should require an argument.
]);

/** Normalise to a repo-relative POSIX path so the allowlist is CWD-independent. */
function relKey(file) {
  const i = file.lastIndexOf(`${path.sep}app${path.sep}api${path.sep}`);
  return i === -1 ? file : file.slice(i + 1).split(path.sep).join("/");
}

async function findRouteFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findRouteFiles(full)));
    } else if (entry.name === "route.ts") {
      files.push(full);
    }
  }
  return files;
}

function exportsMutatingMethod(source) {
  return MUTATING_METHODS.filter((method) => {
    const patterns = [
      new RegExp(`export\\s+async\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s+const\\s+${method}\\s*=`),
      new RegExp(`export\\s*\\{[^}]*\\bas\\s+${method}\\b`),
    ];
    return patterns.some((re) => re.test(source));
  });
}


/* ────────────────────────────────────────────────────────────────────────────
 * THE LEDGER CHECK
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * module (basename under lib/) → the exports through which value moves.
 *
 *   madx-web2           the ledger itself. `round6`, `getAccount`, `getSupply` are
 *                       reads/helpers and deliberately absent.
 *   market-book         fill() — a swap against the book.
 *   perp-store          stakeConviction() — perp / faces conviction.
 *   shield              chargeAndInsertShieldPosition() — the Shield premium.
 *   slot-auction-store  commitSealedBid() / clearAndSettle() — the auction deposit.
 *
 * ADDING A WRAPPER: a lib module that calls spendWithin / refundWithin must be
 * listed here with the exports a route would call, or check 2 fails. That is the
 * point — registering it is the moment someone decides which routes must use it.
 */
const LEDGER_ENTRYPOINTS = {
  "madx-web2": ["onboard", "buy", "transfer", "stake", "unstake", "claim", "spend", "spendWithin", "refundWithin"],
  "market-book": ["fill"],
  "perp-store": ["stakeConviction"],
  shield: ["chargeAndInsertShieldPosition"],
  "slot-auction-store": ["commitSealedBid", "clearAndSettle"],
};
const LEDGER_MODULE = "madx-web2";

/**
 * Routes that MUST reach the ledger. Each moves $MADx today; if the call is ever
 * refactored out they fail here even when the route no longer mentions a
 * monetary word. Keep this in step with MASTER PART 0 §5, T1.
 */
const PINNED_LEDGER_ROUTES = new Set([
  "app/api/v1/madx/onboard/route.ts",
  "app/api/v1/madx/buy/route.ts",
  "app/api/v1/madx/claim/route.ts",
  "app/api/v1/madx/stake/route.ts",
  "app/api/v1/madx/unstake/route.ts",
  "app/api/v1/madx/transfer/route.ts",
  "app/api/v1/markets/[id]/swap/route.ts",
  "app/api/v1/cards/open-pack/route.ts",
  "app/api/v1/perps/convict/route.ts",
  "app/api/v1/faces/stake/route.ts",
  "app/api/v1/shield/opt-in/route.ts",
  "app/api/v1/zeitgeist/auction/route.ts",
]);

/**
 * A mutating route that reads one of these as request input is taking or
 * promising value. `cost`, `fee`, `balance`, `conviction` are left out on
 * purpose: they appear in dozens of routes as response fields and labels, and a
 * detector that cries wolf on every one gets switched off.
 */
const VALUE_TOKENS = /\b(amount|stakeAmount|deposit|premium|wager|payout|bid|spend)\b/;

/** `// LEDGER-FREE: <reason>` — like PUBLIC-ROUTE, a decision made visible in review. */
const LEDGER_FREE = /(?:\/\/|\*)\s*LEDGER-FREE:/;

/**
 * KNOWN LEDGER-FREE VALUE ROUTES — a ratchet, not an amnesty, same as
 * KNOWN_COST_ONLY above. Each takes or promises value and moves none through the
 * ledger, and each needs a PRODUCT decision rather than an engineering one. The
 * list is fixed in size and reported every run; a route that starts calling the
 * ledger must be taken off it (the check fails until it is).
 *
 * The first two were FOUND BY THIS CHECK on its first run — neither was in the
 * T1 inventory. The last three are the compute-only routes T1 already named.
 */
const KNOWN_LEDGER_FREE = new Map([
  [
    "app/api/v1/bets/route.ts",
    "records a bet and bumps market volume with NO debit (placeBet in lib/markets.ts). " +
      "Legacy path beside markets/[id]/swap, which debits through fill(). Route it through fill() or retire it.",
  ],
  [
    "app/api/v1/faces/exit/route.ts",
    "`redeem` returns a payout and credits NOTHING, while perps/convict and faces/stake now DEBIT the " +
      "stake (T1 phase 1): a staked position can be redeemed but never paid. Needs the payout's source " +
      "defined (who funds a redemption?) before a credit leg is written.",
  ],
  ["app/api/v1/staking/yield/route.ts", "compute-only; presented as a position (MASTER T1) — real backend or stop."],
  ["app/api/v1/tournament/match/route.ts", "compute-only; presented as a position (MASTER T1) — real backend or stop."],
  ["app/api/v1/cards/evolve/route.ts", "compute-only; presented as a position (MASTER T1) — real backend or stop."],
]);

/**
 * Remove `//` and `/* *\/` comments, leaving string, template and regex literals alone.
 *
 * This used to be two regexes, and the line-comment one ate everything from any `//` to the end
 * of the line — including a `//` INSIDE a regex literal (`/a\/\//`) or a template (`${base}//p`).
 * Code after it on that line vanished from the analysis: a ledger call could disappear (a false
 * failure) and, worse, a monetary field could disappear from an unpriced route (a silent pass,
 * in the one script whose job is not to pass silently). So it is a small scanner: it tracks
 * whether it is inside a string or template (with `${ }` nesting) and recognises a regex literal
 * by the token before the slash, so only real comments are dropped.
 */
function stripComments(src) {
  const n = src.length;
  // After one of these a `/` begins a regex literal; after an identifier, `)` or `]` it is division.
  const REGEX_AFTER = new Set(["(", ",", "=", ":", "[", "!", "&", "|", "?", "{", "}", ";", "+", "-", "*", "%", "<", ">", "~", "^"]);
  let out = "";
  let i = 0;
  let prev = ""; // the last non-space character emitted
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === "/" && d === "/") {
      while (i < n && src[i] !== "\n") i += 1;
      continue;
    }
    if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? n : end + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && src[j] !== c && src[j] !== "\n") j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
      prev = c;
      continue;
    }
    if (c === "`") {
      let j = i + 1;
      let depth = 0;
      while (j < n) {
        const ch = src[j];
        if (ch === "\\") {
          j += 2;
          continue;
        }
        if (depth === 0 && ch === "`") break;
        if (ch === "$" && src[j + 1] === "{") {
          depth += 1;
          j += 2;
          continue;
        }
        if (depth > 0 && ch === "{") depth += 1;
        else if (depth > 0 && ch === "}") depth -= 1;
        j += 1;
      }
      out += src.slice(i, j + 1);
      i = j + 1;
      prev = "`";
      continue;
    }
    if (c === "/" && (prev === "" || REGEX_AFTER.has(prev))) {
      let j = i + 1;
      let inClass = false;
      while (j < n && src[j] !== "\n") {
        const ch = src[j];
        if (ch === "\\") {
          j += 2;
          continue;
        }
        if (ch === "[") inClass = true;
        else if (ch === "]") inClass = false;
        else if (ch === "/" && !inClass) break;
        j += 1;
      }
      out += src.slice(i, j + 1);
      i = j + 1;
      prev = "/";
      continue;
    }
    out += c;
    if (!/\s/.test(c)) prev = c;
    i += 1;
  }
  return out;
}

/**
 * `import { a, b as c } from "<path>"` → local name → { mod, orig }, where `mod`
 * is the lib basename for `@/lib/x`, `./x` and `../lib/x`, and null otherwise.
 */
function importedBindings(src) {
  const out = new Map();
  const re = /import\s+(?!type\b)\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src))) {
    const spec = /^(?:@\/lib\/|\.\/|\.\.\/lib\/)([\w-]+)$/.exec(m[2]);
    if (!spec) continue;
    for (const part of m[1].split(",")) {
      const t = part.trim();
      if (!t || t.startsWith("type ")) continue;
      const [orig, alias] = t.split(/\s+as\s+/);
      out.set((alias ?? orig).trim(), { mod: spec[1], orig: orig.trim() });
    }
  }
  return out;
}

/** Registered ledger entrypoints this source imports AND calls. */
function ledgerCallsIn(source) {
  const src = stripComments(source);
  const called = [];
  for (const [local, { mod, orig }] of importedBindings(src)) {
    if (!(LEDGER_ENTRYPOINTS[mod] ?? []).includes(orig)) continue;
    if (new RegExp(`(?<![.\\w])${local}\\s*\\(`).test(src)) called.push(`${mod}.${orig}`);
  }
  return called;
}

async function findFiles(dir, accept) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await findFiles(full, accept)));
    else if (accept(e.name)) out.push(full);
  }
  return out;
}

async function ledgerCheck(routeFiles) {
  const failures = [];
  const posix = (f) => path.relative(ROOT, f).split(path.sep).join("/");

  // 1. Registry hygiene.
  let registrySymbols = 0;
  for (const [mod, symbols] of Object.entries(LEDGER_ENTRYPOINTS)) {
    let src;
    try {
      src = await readFile(path.join(LIB_DIR, `${mod}.ts`), "utf8");
    } catch {
      failures.push(`registry: lib/${mod}.ts does not exist — update LEDGER_ENTRYPOINTS`);
      continue;
    }
    for (const sym of symbols) {
      registrySymbols += 1;
      if (!new RegExp(`export\\s+(?:async\\s+)?(?:function|const)\\s+${sym}\\b`).test(src)) {
        failures.push(`registry: lib/${mod}.ts no longer exports ${sym}() — a renamed ledger entrypoint blinds this check`);
      }
    }
  }

  // 2. Registry completeness: who else imports a value-moving function from the ledger?
  const moving = LEDGER_ENTRYPOINTS[LEDGER_MODULE];
  const modules = [
    ...(await findFiles(LIB_DIR, (n) => n.endsWith(".ts") && !n.endsWith(".test.ts"))),
    ...(await findFiles(APP_DIR, (n) => n.endsWith(".ts") && n !== "route.ts" && !n.endsWith(".test.ts"))),
  ];
  for (const f of modules) {
    const base = path.basename(f, ".ts");
    if (base === LEDGER_MODULE || base in LEDGER_ENTRYPOINTS) continue;
    const src = stripComments(await readFile(f, "utf8"));
    const used = [...importedBindings(src).values()]
      .filter((b) => b.mod === LEDGER_MODULE && moving.includes(b.orig))
      .map((b) => b.orig);
    if (used.length) {
      failures.push(
        `registry: ${posix(f)} moves $MADx (${[...new Set(used)].join(", ")}) but is not in LEDGER_ENTRYPOINTS — ` +
          "register the exports a route would call, so the routes that use it are checked",
      );
    }
  }

  // 3 + 4. Routes.
  const seen = new Set();
  let viaLedger = 0;
  let exempt = 0;
  const knownDebt = [];
  for (const file of routeFiles) {
    const raw = await readFile(file, "utf8");
    if (exportsMutatingMethod(raw).length === 0) continue;
    const key = relKey(file);
    seen.add(key);
    const calls = ledgerCallsIn(raw);
    const pinned = PINNED_LEDGER_ROUTES.has(key);
    const free = KNOWN_LEDGER_FREE.has(key);
    const hasSignal = VALUE_TOKENS.test(stripComments(raw));

    if (calls.length) {
      viaLedger += 1;
      if (free) failures.push(`${key} now calls the ledger (${calls.join(", ")}) — remove it from KNOWN_LEDGER_FREE`);
      continue;
    }
    if (pinned) {
      failures.push(`${key} is PINNED to the ledger and no longer calls a registered entrypoint — its debit was removed or renamed`);
      continue;
    }
    if (LEDGER_FREE.test(raw)) {
      exempt += 1;
      continue;
    }
    if (free) {
      knownDebt.push(key);
      continue;
    }
    if (hasSignal) {
      failures.push(
        `${key} reads a monetary field and moves nothing through the ledger. Debit it with spendWithin/` +
          "refundWithin (copy lib/market-book.ts#fill), or — if it genuinely moves no value — add " +
          "`// LEDGER-FREE: <reason>`",
      );
    }
  }

  // Stale pins / debt: a list entry describing a route that is gone is a silent hole.
  for (const key of PINNED_LEDGER_ROUTES) {
    if (!seen.has(key)) failures.push(`${key} is pinned but is not a mutating route in this tree — remove or fix the pin`);
  }
  for (const key of KNOWN_LEDGER_FREE.keys()) {
    if (!seen.has(key)) failures.push(`${key} is in KNOWN_LEDGER_FREE but is not a mutating route in this tree — remove it`);
  }

  // A gate that looked at nothing is not a passing gate.
  if (registrySymbols === 0 || seen.size === 0) {
    failures.push(`ledger check looked at ${registrySymbols} registry symbol(s) and ${seen.size} mutating route(s) — the walk matched nothing`);
  }

  if (knownDebt.length > 0) {
    console.log(`ℹ️  ${knownDebt.length} known ledger-free value route(s), pending a product decision:`);
    for (const key of knownDebt) console.log(`   ${key}\n      ${KNOWN_LEDGER_FREE.get(key)}`);
    console.log("   (enumerated in KNOWN_LEDGER_FREE — tracked, not failing. New ones DO fail.)\n");
  }

  if (failures.length === 0) {
    console.log(
      `✅ ledger check: ${viaLedger} route(s) move value through the ledger (${PINNED_LEDGER_ROUTES.size} pinned), ` +
        `${exempt} marked LEDGER-FREE, ${knownDebt.length} tracked; ${registrySymbols} registry symbol(s) in ` +
        `${Object.keys(LEDGER_ENTRYPOINTS).length} module(s) verified, ${modules.length} module(s) scanned.`,
    );
    return;
  }
  console.warn(`⚠️  ledger check: ${failures.length} problem(s):\n`);
  for (const f of failures) console.warn(`   ${f}`);
  console.warn(
    `\nScanned ${seen.size} mutating route(s); ${registrySymbols} registry symbol(s); ${modules.length} module(s).`,
  );
  process.exitCode = 1;
}

async function main() {
  const files = await findRouteFiles(API_DIR);

  // A gate that scanned nothing is not a passing gate.
  if (files.length === 0) {
    console.error(`❌ route-guard check: found 0 route.ts files under ${API_DIR}.`);
    console.error("   The walk matched nothing, so a pass here would mean nothing. Check the path.");
    process.exitCode = 1;
    return;
  }

  await authorizationCheck(files);
  await ledgerCheck(files);
}

async function authorizationCheck(files) {

  const unguarded = [];
  const costOnly = [];   // new, and therefore failing
  const knownDebt = [];  // enumerated in KNOWN_COST_ONLY — reported, not failing
  const staleAllow = []; // in the allowlist but no longer cost-only: remove the line
  let exempt = 0;
  let mutating = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const methods = exportsMutatingMethod(source);
    if (methods.length === 0) continue;
    mutating += 1;

    const hasAuth = AUTH_CALLS.some((call) => source.includes(call));
    if (hasAuth) continue;

    const hasCost = COST_CALLS.some((call) => source.includes(call));
    const hasOptOut = OPT_OUT.test(source);
    if (hasOptOut) {
      exempt += 1;
      // Deliberately public AND uncapped is still worth surfacing — an open
      // route with no cost ceiling is a free amplifier even when the openness
      // is intended.
      if (!hasCost) {
        console.warn(
          `   note: ${path.relative(process.cwd(), file)} is marked PUBLIC-ROUTE but has no rate limit.`,
        );
      }
      continue;
    }

    const rel = path.relative(process.cwd(), file);
    const key = relKey(file);
    if (hasCost) {
      if (KNOWN_COST_ONLY.has(key)) knownDebt.push({ file: rel, methods });
      else costOnly.push({ file: rel, methods });
    } else unguarded.push({ file: rel, methods });
  }

  // An allowlist entry that no longer describes reality is the same class of
  // problem as the bug this whole file exists to prevent: a stale exemption
  // quietly covering something it no longer matches.
  const stillCostOnly = new Set([...knownDebt].map((d) => relKey(path.resolve(d.file))));
  for (const key of KNOWN_COST_ONLY) {
    if (!stillCostOnly.has(key)) staleAllow.push(key);
  }

  const failures = unguarded.length + costOnly.length;

  if (knownDebt.length > 0) {
    console.log(`ℹ️  ${knownDebt.length} known cost-only route(s), pending a product decision:`);
    for (const { file } of knownDebt) console.log(`   ${file}`);
    console.log("   (enumerated in KNOWN_COST_ONLY — tracked, not failing. New ones DO fail.)\n");
  }

  if (staleAllow.length > 0) {
    console.warn("⚠️  KNOWN_COST_ONLY has entries that are no longer cost-only. Remove them:");
    for (const key of staleAllow) console.warn(`   ${key}`);
    console.warn("");
    process.exitCode = 1;
  }

  if (failures === 0) {
    // Don't print a tick over a stale-allowlist failure — a green summary
    // sitting under a warning is exactly how a real problem gets scrolled past.
    if (staleAllow.length === 0) {
      console.log(
        `✅ route-guard check: ${mutating} mutating route(s) across ${files.length} route file(s) — ` +
          `all authenticated, marked public, or known debt (${exempt} exempt, ${knownDebt.length} tracked).`,
      );
    }
    return;
  }

  if (costOnly.length > 0) {
    console.warn(
      `⚠️  route-guard check: ${costOnly.length} mutating route(s) have ONLY a rate limit and no ` +
        "authorization:\n",
    );
    for (const { file, methods } of costOnly) console.warn(`   ${file}  [${methods.join(", ")}]`);
    console.warn(
      "\n   A rate limit caps how fast an anonymous caller acts; it does not establish who they\n" +
        "   are. Add a session/bearer guard, or — if the route is genuinely meant to be open —\n" +
        "   a `// PUBLIC-ROUTE: <reason>` comment so the decision is visible in review.\n",
    );
  }

  if (unguarded.length > 0) {
    console.warn(
      `⚠️  route-guard check: ${unguarded.length} mutating route(s) have no guard at all and no ` +
        "PUBLIC-ROUTE marker:\n",
    );
    for (const { file, methods } of unguarded) console.warn(`   ${file}  [${methods.join(", ")}]`);
    console.warn(
      "\n   Each needs requireMadxRouteAuth / requireBearerSecret / withRouteGuard, or an\n" +
        "   explicit `// PUBLIC-ROUTE: <reason>`.\n",
    );
  }

  console.warn(
    `Scanned ${files.length} route file(s); ${mutating} export a mutating method; ${exempt} exempt.`,
  );
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("route-guard check crashed:", err);
  process.exitCode = 1;
});
