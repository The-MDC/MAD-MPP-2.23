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
| **8.8% → 38.8%** staking APY, 4 tiers | Enforced in code — but the deployed-intent Solidity contract still has the old 6-tier table | `03` §4, `05` |
| **2–4%** MAD Shield premium (live) | Enforced — flat dial, **not** volatility-priced despite existing GARCH-priced copy | `03` §7 |
| **28.8% → 40% → 60%** MAD Shield recovery | Enforced in the payout resolver — that resolver itself has zero test coverage | `03` §7 |
| $MADx supply | **Deployed at `0x6972...151f` (Arbitrum One) — but mint-on-purchase, not the "888,888,888 fixed, minted once" figure used elsewhere.** Contract's own code comment records the cap as 224,573,096. Reconcile which model is current before pitching either. | `12-DILIGENCE-QUESTIONS.md` R1 |

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
Create button has no click handler); on-chain settlement (the resolver contract exists, tested,
but isn't called by the market factory, which is owner-attested today); any deployed contract
of any kind (zero broadcast records exist anywhere in the repo).

Full detail: `02-FEATURE-TRACEABILITY-MATRIX.md`. Full pipeline trace: same file, section B.

## Test coverage, precisely

**21.5%** of the math engine's 93 runtime-testable exports have unit-test assertions (20/93).
Well-covered: fee constants, creator ladder, staking tiers, GARCH, the untested-in-practice
Shield premium formula. Zero coverage: DL-LMSR pricing itself, the live Shield premium formula,
the Shield payout resolver, and roughly fifty exports covering cards/packs/evolution/PvP/virality.
Ten contracts carry 90+ Foundry tests on the canonical `contracts/src/` project; a parallel
`contracts/madhat-core/` project does not currently compile and should not be cited as evidence
of anything built.

## Top 5 things to fix before this goes in front of anyone who will check

1. `MADShieldVault.sol` — the fund-custody contract — has no reentrancy guard, unlike its siblings.
2. The optimistic oracle isn't wired to the market factory; settlement is owner-attested today.
3. `$MADx` is not deployed under either address this repo treats as canonical.
4. The Solidity staking table has drifted from its tested, founder-approved TypeScript twin.
5. `o-vdeck26.vercel.app` — a public, un-gated URL — still states Wyoming/SEC-compliant
   language and may be tied to a live Outlier Ventures thread; it isn't built from a file in
   this repo, so it can't be fixed by editing anything here.

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
