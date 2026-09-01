# Security & Oracle Risk Register

**Method:** every item below is sourced from a direct read of the current codebase (contracts,
math engine, and app-layer pipeline) or a direct on-chain query, each cited. Nothing here is
inferred from documentation claims alone. No external security audit has occurred — this
register is what a careful internal read surfaces, not a substitute for one; it exists so the
gap between "internally reviewed" and "independently audited" is explicit rather than implied.

**Severity key:** 🔴 Critical (funds/trust at risk if shipped as-is) · 🟠 High (must close
before mainnet) · 🟡 Medium (should close, not blocking a testnet/demo) · ⚪ Informational
(disclosure item, not a defect).

---

## 1. Contract-layer findings

### 🟡 $MADx's supply model is inconsistent across the repo — fixed vs. mint-on-purchase

Two addresses are cited as canonical `$MADx` in different repo files. Verified directly on
Arbitrum One (chain 42161) via Blockscout, 2026-08-28, then corrected against the founder's
direct clarification: `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18` is confirmed **unrelated** —
a different, unverified token ("Serpentine Orkain," `ORKx`, 2 holders) — that citation in
`contracts/madhat-core/DEPLOYED_ADDRESSES.md` should be removed.
`0x6972370e1caAA3624F37D7e87C28e1089D00151f` is the real, deployed MADDEX/$MADx contract: per
the founder, a fair-launch governance/GameFi/platform token that mints only against investment
— consistent with its currently low/near-zero on-chain supply and its generic-looking indexed
name ("MyToken" on Blockscout, likely just unset display metadata on a contract with little
mint activity yet, not a sign of a fake or misconfigured deploy).

**What genuinely needs reconciling is the supply *model*, not the deployment.** Whitepaper copy
and several code comments describe "888,888,888 fixed supply, minted once" — a one-time,
capped-forever design. The live contract and its own description are **mint-on-purchase**
against a cap, and `verify/lib/contracts.ts` separately records that cap as **224,573,096**, a
different number from 888,888,888. These describe two different token mechanisms, not the same
fact worded two ways. `MADMarketFactory`, `MADStaking`, and `MADShieldVault` all expect a live
`$MADx` address; `verify/.env.example` ships every contract-address env var blank by default,
and `verify/lib/contracts.ts` already degrades gracefully by rendering an unset address as "not
deployed" — so this is a documentation-consistency risk, not an app-stability one. Reconcile
which supply model is current before any deck states either the mechanism or the number.

### ✅ FIXED 2026-09-01 — `MADShieldVault.sol` now has a reentrancy guard

Was: the one contract that custodies user MAD Shield stakes and pays out losses did not import
or use `ReentrancyGuard`, unlike every sibling fund-moving contract in the same directory
(`MADStaking.sol`, `MADMarketFactory.sol`, `MADOptimisticOracle.sol` all did). State was already
written before external token transfers (correct checks-effects-interactions ordering), so this
was a defense-in-depth gap rather than a demonstrated exploit path — but a real one, on the one
contract in the directory missing it.

Fix: `ReentrancyGuard` added to the inheritance list; `nonReentrant` added to `stake`, `claim`,
`resolveLoss`, and `withdraw` — every function that calls `token.safeTransfer(From)`.
`requestUnstake` makes no external call and doesn't need it. Pattern matches the three sibling
contracts exactly (same OZ import, same modifier placement). Not independently verified via
`forge test` in this environment (`forge` isn't installed here); verified instead by confirming
the import path exists in the vendored OpenZeppelin library, brace-balance, and byte-for-byte
pattern match against three contracts CI already compiles and tests successfully — CI on the
next PR is the actual compile/test confirmation. **A dedicated reentrancy-attack simulation
test is not included** — that's better scoped to the paid audit engagement
(`08-TECHNICAL-PARTNER-MILESTONE-BRIEF.md` M1) than invented here without the ability to run it.

### 🟠 No independent security review of any contract

No audit report or third-party findings artifact exists anywhere in the repository for any of
the ten contracts in `contracts/src/`. A CI workflow comment (`.github/workflows/foundry.yml`)
notes an initial Slither pass "surfaced 135 findings across the MAD* contracts that need
triage" — this register could not locate the actual findings output to verify that count or
severity breakdown. Whether that triage happened is a diligence question (see
`12-DILIGENCE-QUESTIONS.md` item 10), not something this audit can confirm from the repo alone.

### 🟠 No evidence any contract has ever been deployed to a real network

No `broadcast/` directory exists anywhere under `contracts/` — the artifact Foundry creates
automatically the moment `forge script --broadcast` succeeds against a real network. Combined
with every contract-address environment variable shipping blank, the honest current state is:
**ten well-tested contracts, zero deployments.** This is not a defect — it's accurate framing
for every pitch document in this package, and getting it wrong (implying anything is live) is
the actual risk.

### 🟠 The settlement oracle is not wired to the market factory

`MADOptimisticOracle.sol` (assert → dispute → settle, real and tested) and
`MADMarketFactory.sol` (create → back → resolve → claim, real and tested) are two complete,
independently-working contracts that **do not call each other**. `MADMarketFactory.resolve()`
takes a caller-supplied raw value with no oracle read (grepping the file for "oracle" returns
zero matches) — it is `onlyOwner`-attested, not oracle-settled, as currently wired. The
Optimistic Oracle's own docstring frames itself as "the resolver `MADMarketFactory` should
read from," but nothing in the code does that yet. This is the single largest gap between "the
settlement primitives exist" and "the platform settles trustlessly" — see the technical-partner
milestone brief for how this closes.

### ✅ FIXED 2026-09-01 — the Solidity staking contract no longer drifts from its TypeScript twin

Was: `MADStaking.sol` still encoded the old 6-tier staking table
(100/500/2,500/10,000/50,000/100,000 $MADx at 12/18/28/42/58/68% APY) while its own header
comment claimed to mirror `STAKING_TIERS` in `verify/lib/gambit-game-math.ts` — which had moved
to a 4-tier table on 2026-07-31 (Bronze/Silver/Gold/MAD Tier at 88/888/8,888/88,888 $MADx,
8.8/18.8/28.8/38.8% APY, carrying an explicit founder-sign-off comment) without the contract
being updated to match.

Fix: the four `tiers.push(...)` calls in the constructor updated to the 4-tier canon; the header
comment rewritten to state the reconciliation explicitly rather than just claim a mirror; the
9-test suite in `MADStaking.t.sol` updated — `testApyTierBoundaries` rewritten for the new
boundaries, and the two reward-accrual tests (`testRewardAccrualOneYear`,
`testClaimTransfersRewardsFromReserve`) re-derived for the tier their existing stake amounts now
fall into under the new table (worked by hand and cross-checked with a standalone script before
editing: 2,500 $MADx now lands in Silver at 18.8% → 470 $MADx/year, not Gold at 28% → 700; 10,000
$MADx now lands in Gold at 28.8% → 2,880/year, not Platinum at 42% → 4,200). The other six tests
in the file don't depend on tier/APY values and were left unchanged. Nothing was deployed under
the old table, so this is a correction, not a migration — no live positions to reconcile.

### 🟡 `contracts/madhat-core/` does not compile and should not be cited as evidence of anything

A second, parallel Foundry project exists at `contracts/madhat-core/` — legacy/parallel work,
explicitly excluded from CI (`.github/workflows/foundry.yml`). It has no vendored dependencies
(`remappings.txt` requires four external libraries; no `lib/` directory exists), and independent
of that, this audit found real compile-blocking bugs in its own source: two undefined custom
errors referenced in `game.sol`, a test suite calling constructor signatures and function names
that don't exist on the contracts it targets, and a deploy script calling a nonexistent function
with the wrong argument count. It also references six contracts by name in its own docs
(`EvolutionEngine.sol`, `GambitAMM.sol`, `StakingVault.sol`, `DutchAuction.sol`,
`OracleIntegration.sol`, a second `MarketFactory.sol`) that don't exist anywhere in the repo.
**Recommendation: treat this directory as abandoned scaffolding in every external-facing
document. Don't cite it as a second product line or as evidence of anything built** — it will
not survive a technical reviewer opening it.

### 🟡 Plaintext private keys committed to the repository

`contracts/madhat-core/notes.txt` contains ten plaintext private keys, each labeled
testnet/local-only. Verified: these are the publicly-known standard Anvil/Foundry
development-mnemonic keys (`"test test test … junk"`, accounts #0–#9) — not a leak of any
real, unique secret. Still inconsistent with this repo's own `SECURITY.md` policy against
committed secrets, and the same well-known Account #0 address is reused as a hardcoded
production-looking `owner`/`treasury` address in a deploy script in the same directory —
further reinforcing that script has only ever run against a local test node. Low real-world
risk, but worth a cleanup pass, and it should not be described as a credential exposure to
outside parties since the keys are public knowledge, not this project's secret.

### ⚪ Real Chainlink VRF integration exists but is deliberately not part of the build

`contracts/evolution/EvolutionVRFConsumer.sol` is a genuine, correct Chainlink VRF v2.5
consumer for card-evolution randomness — the one real Chainlink call-site in the entire repo.
It's kept outside `contracts/src/` on purpose, because the compiled project doesn't vendor the
Chainlink dependency yet; its own header lays out the exact steps to bring it in. This is a
positive signal (the team knows how to do this correctly) more than a gap — worth citing as
such rather than only as a missing piece.

## 2. Oracle-risk summary — what "oracle" currently means in this codebase

Every Chainlink Price Feed, Pyth, UMA, and Gnosis Conditional Tokens reference anywhere in
`contracts/` or `verify/` is a code comment, a UI placeholder string, or marketing copy — this
audit found zero real call sites for any of them. Specifically:

- The "provably fair" casino component runs on browser `Math.random`/`crypto` today, per its
  own code comment acknowledging Chainlink VRF is the intended (not current) mechanism.
- The live volatility gauge shown in the app self-labels as a placeholder for a future
  "Chainlink price feeds + Scandal Scraper AI sentiment" oracle and runs a seeded deterministic
  pseudo-random walk today.
- `MADOptimisticOracle.sol` is real and tested, but is a **self-contained, UMA-inspired**
  reimplementation — not an integration with the actual UMA protocol — and per the point above,
  it isn't called by the market factory yet either.

**What this means for any claim about oracle accuracy, security, or "regulatory-safe"
settlement:** there is currently no external, tamper-resistant data feed anywhere in the live
product. Every price, volatility, and resolution signal a user sees today is either a real
deterministic computation over real ingested data (the classifier, the GARCH model) or a
client-side/seeded simulation clearly commented as such in the source. Never claim "oracle
accuracy" or "no counterparty risk" — there is no oracle live to have an accuracy figure, and
market resolution today is owner-attested, which is itself a counterparty.

## 3. App-layer / pipeline findings

### ✅ PARTIALLY FIXED 2026-09-01 — the "create a market from a live headline" flow still isn't automatic, but the dead button is now a working one

Was: article ingestion (real RSS fetch, 26 real publisher feeds) and market-type classification
(a real deterministic rules engine — keyword cascades plus the real `zLiarMeter`/sentiment/GDELT
math, not an LLM) were both genuinely live, but nothing in the app automatically turned a
classified headline into a persisted, tradeable market — and the branded "Market Factory" UI's
Create button had **no click handler at all**, silently doing nothing when clicked.

Fix: the Create button now posts to the same real, DB-backed `/api/v1/markets` route the manual
markets panel uses, seeded with this panel's own live DL-LMSR preview odds (converted
probability → decimal odds) instead of that path's flat 2.0/2.0 defaults. This is explicitly an
interim wiring, documented as such in the component's own header comment — it does not make
headline-to-market automatic, and does not touch the on-chain factory (still not deployed). It
turns a button that did nothing into one that does something real. **Still open:** nothing
automatically calls this from a classified headline; that remains a milestone-brief item.

### ✅ FIXED 2026-09-01 — the "Pull fresh" button no longer silently fails on every click

Was: `pullFresh()` called `/api/v1/ingest/gdelt` directly — a route gated by `CRON_SECRET`,
which a browser can never supply. Every click 401'd or 503'd, silently swallowed by a
`.catch(() => {})`, then just reloaded the same already-stale proposals behind a spinner that
implied something had happened.

Fix: added `/api/v1/markets/proposals/refresh`, a new route that does the same ingest work
(same `ingestGdelt`/`fetchGdeltDoc` calls) but is protected by IP rate-limiting (5 requests per
10 minutes) instead of a secret — the appropriate guard for a public, human-triggered action
versus the cron's trusted scheduled path, which keeps its stronger secret gate unchanged. The
button now calls this route and the refresh genuinely runs.

### ✅ MITIGATED 2026-09-01 — the classification "proposals" endpoint no longer depends solely on manual clicks to get fresh data

Was: the route serving classified headline proposals falls back to a static 5-item array
whenever the database or its signal table is empty, and no scheduled job populated that table —
the Vercel cron config listed three unrelated jobs, not this one. In practice, the fallback
content was the default, not the live pipeline.

Fix: added a fourth cron entry, `/api/v1/ingest/gdelt` on a 30-minute schedule (matching that
route's own suggested cadence in its doc comment), to `verify/vercel.json`. **Depends on
`CRON_SECRET` actually being set as a Vercel project environment variable** — Vercel signs
cron-triggered requests with that value automatically when it's configured, but this audit
cannot confirm from the repository alone whether it's set in the live project. If it isn't,
this cron entry will 503 harmlessly on each scheduled run rather than silently doing nothing —
worth a one-time check in the Vercel dashboard.

### 🟡 The live "price movement" and "volatility" demo surfaces are real formulas over synthetic inputs

The DL-LMSR swap interface calls the real pricing math, but trades against purely local React
state with no backend or on-chain call — a client-side simulator, not a live market. The
platform's own price-history code contains an unusually candid comment worth quoting directly:
*"the platform has no price series — no AMM, no market_prices table, no odds history... so
`series` here is DERIVED, deterministically, from the market's own real signals... plus a
seeded drift."* This is good, honest engineering — the risk is only in how it gets described
externally. Say "the pricing formulas are real and live; the demo's price history is a
seeded reconstruction, because the platform doesn't record real price history yet" — not
"live price charts."

### 🟡 An internal trading-agent pipeline explicitly mocks its own trade execution

An internal, non-user-facing agent route wraps a real LLM call and a real vector-DB query
around a hardcoded fixture trade and a fake signed transaction — the code's own comment says
"for now, we mock the signed payload." Real reasoning, fake execution. Do not present this as
a working autonomous trading agent in any demo or deck.

## 4. Positive signals worth citing (not everything here is a gap)

- **GARCH(1,1) volatility modeling** is the best-verified piece of the math engine: fully
  tested, defensively coded against non-finite inputs, with a documented and sensible clamp.
- **The "17-corrections" comment trail** shows five distinct historical fixes still visible in
  the live code — evidence the team catches and corrects its own errors, not that the codebase
  has never been scrutinized.
- **RSS ingestion and the headline-classification rules engine are genuinely live**, not
  vaporware — real network calls, real deterministic logic, honestly labeled where they fall
  back to fixtures.
- **Ten contracts, ninety unit tests, real Foundry coverage on the canonical project** — the
  base to build settlement and audit work on is substantive, not a sketch.
- **The one real oracle integration that exists (Chainlink VRF) is correctly implemented**,
  just deliberately not yet wired into the compiled build.

## 5. What this register recommends funding (cross-reference)

The three highest-priority closes — the Shield vault's reentrancy guard, the oracle-to-factory
wiring, and an independent audit of the fund-custody contracts — are exactly what
`07-USE-OF-PROCEEDS-BRIDGE.md` and `08-TECHNICAL-PARTNER-MILESTONE-BRIEF.md` allocate the
bridge tranche against. Nothing in this register should be read as "unsafe to demo" — it is
"not yet safe to hold real user funds," which is a different, expected, pre-mainnet state.
