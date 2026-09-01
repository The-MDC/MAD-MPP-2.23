# MAD Gambit — Technical & Product Truth Sheet

*One page. Every figure cross-referenced elsewhere in this package — see the file named in
each row's last column for the full evidence.*

## What it is

An EVM-native conviction market for entertainment and creator culture: markets price
continuously on a live cultural headline instead of settling once at resolution. Creators who
make a market earn a share of its fee on a traction-gated ladder. Primary chain: **Arbitrum
Nova (42170)**, gameplay; **Arbitrum One (42161)**, MAD Shield vaults / $MADx.

## The numbers that are enforced in code today

| Number | Status | Detail |
|---|---|---|
| **1.88%** platform fee | Enforced in `splitFee()` | `03-MATH-ENGINE-APPENDIX.md` §3 |
| **28.8% → 40% → 60%** creator share, by traction rung | Enforced in `CREATOR_LADDER`, founder-signed | `03` §2 |
| Community pool cut | **Bug, unresolved** — computed on gross fee, not the platform's post-creator share (~28.8% of gross always, instead of 17.28–28.8% depending on rung) | `03` §3 |
| **8.8% → 38.8%** staking APY, 4 tiers | Enforced in code on both layers — `MADStaking.sol`'s Solidity table was reconciled to the TS canon 2026-09-01 (previously still had the old 6-tier table) | `03` §4, `05` |
| **2–4%** MAD Shield premium (live) | Enforced — flat dial, **not** volatility-priced despite existing GARCH-priced copy in some materials | `03` §7 |
| **28.8% → 40% → 60%** MAD Shield recovery | Enforced in the payout resolver — now unit-tested (2026-09-01) across all three tiers and every eligibility gate | `03` §7 |
| $MADx supply | **Deployed at `0x6972...151f` (Arbitrum One) — mint-on-purchase, per the founder.** Copy across the app has been corrected to say "cap, mint-on-purchase" rather than "fixed supply, minted once." Which cap is current (888,888,888 vs. 224,573,096 recorded in `verify/lib/contracts.ts`) is still open. | `12-DILIGENCE-QUESTIONS.md` R1 |

## What's live vs. demo vs. not built — the headline version

**Live and real:** RSS ingestion (26 real feeds), headline classification (a real deterministic
rules engine, not ML), GARCH volatility modeling, DL-LMSR pricing formulas, SIWE auth, ten
smart contracts with 90+ Foundry tests, one correct Chainlink VRF integration (deliberately not
yet wired in).

**Demo, not production:** the DL-LMSR price-movement demo runs entirely in local browser
state; the live volatility gauge self-labels as a placeholder running seeded pseudo-random
data; price-history sparklines are, per the code's own comment, "derived... plus a seeded
drift," because the platform doesn't record real price history yet.

**Not built:** automatic market creation from a classified headline (the Market Factory's
Create button now creates a real, DB-backed market as an interim step — see below — but
doesn't yet do this automatically from a headline); on-chain settlement (the resolver contract
exists, tested, but isn't called by the market factory, which is owner-attested today); any
deployed contract of any kind among the ten MAD-authored contracts (zero broadcast records
exist anywhere in the repo — $MADx itself is a separate, already-deployed token, see above).

**Fixed this session (2026-09-01), not just documented:** the DL-LMSR price function's missing
overflow guard and its cost/price inconsistency (resolved by adding a dedicated marginal-cost
function rather than changing what the display-probability function returns — see `03` §5);
`MADShieldVault.sol` now has a reentrancy guard on every fund-moving function; the Solidity
staking table now matches its TypeScript twin; the Market Factory's Create button now does
something (wired to the real market-creation API) instead of nothing; the "Pull fresh" button
now actually refreshes content (new rate-limited public route) instead of always silently
failing; a Vercel cron entry was added so headline ingestion has a chance to run on a schedule,
not just via the button.

Full detail: `02-FEATURE-TRACEABILITY-MATRIX.md`. Full pipeline trace: same file, section B.

## Test coverage, precisely

**≈28.7%** of the math engine's 94 runtime-testable exports have unit-test assertions (27/94),
up from 21.5% (20/93) this session — DL-LMSR pricing (cost, price, and a new marginal-cost
function) and the full Shield payout resolver (all three tiers, every eligibility gate) went
from zero coverage to fully tested. Remaining zero-coverage surface: roughly fifty exports
covering cards/packs/evolution/PvP/virality — none of it fund-custody or pricing-critical.
Ten contracts carry 90+ Foundry tests on the canonical `contracts/src/` project; a parallel
`contracts/madhat-core/` project does not currently compile and should not be cited as evidence
of anything built.

## Top 5 things fixed or flagged this session

1. ✅ `MADShieldVault.sol` now has a reentrancy guard on every fund-moving function.
2. ✅ The Solidity staking table now matches its TypeScript twin (4 tiers, not 6).
3. ✅ DL-LMSR pricing is now fully tested and its overflow/consistency gaps closed.
4. ⚠️ Still open: the optimistic oracle isn't wired to the market factory; settlement is
   owner-attested today. Scoped as Milestone 1 in `08-TECHNICAL-PARTNER-MILESTONE-BRIEF.md` —
   correctly resolving trust assumptions on a fund-settling contract needs more than a
   same-session fix.
5. ⚠️ Still open: `o-vdeck26.vercel.app` — a public, un-gated URL — still states Wyoming/
   SEC-compliant language and may be tied to a live Outlier Ventures thread; it isn't built
   from a file in this repo, so it can't be fixed by editing anything here.

## The ask

Two tranches, kept separate — see `06`/`07` for full breakdowns:

- **$15K–$20K infrastructure** — 3–6 months of build velocity, compute, and CI/RPC reliability.
- **$300K–$500K bridge** — milestone-gated, funds a technical partner closing the settlement
  gap plus an independent audit, held separate from the studio engagement.

Seed round referenced elsewhere in this package: **$1.24M–$2.48M at $12M pre-money**, SAFE or
equity. **None of the three raises are closed.** No document in this package may imply
otherwise.

## Never say

"Insurance" (for MAD Shield) · "industry's first" · "regulatory-safe" · "no counterparty risk" ·
"100% DeFi secured" · "15,000 users" (it's a waitlist) · measured retention (70%+ D30 is a
target) · oracle accuracy or VRF-backed randomness in the live product (neither exists yet) ·
any raise as funded, backed, or committed before it closes.

*Full 21-item diligence checklist with fallback lines for each: `12-DILIGENCE-QUESTIONS.md`.*
