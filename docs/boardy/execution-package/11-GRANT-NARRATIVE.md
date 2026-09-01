# Grant Application Narrative — MAD Gambit

**Note on use:** this is written as a program-agnostic narrative to adapt into whichever
specific ecosystem/infrastructure grant application Nick applies to (Arbitrum ecosystem
grants are the most natural fit given the chain choice below, but the narrative doesn't
assume a specific program's rubric — tailor the framing paragraph per application, keep the
technical-proof and infrastructure-need sections as-is). Word count is kept tight
deliberately; most grant applications penalize padding.

---

## What we're building

MAD Gambit is an EVM-native conviction market for entertainment and creator culture — markets
that price continuously on a live headline instead of settling once at resolution, with
creators earning a share of the fee on markets they create. It runs primarily on **Arbitrum
Nova** (chain ID 42170) for gameplay, with MAD Shield vaults and the $MADx token on **Arbitrum
One** (42161).

## Why this needs ecosystem support now, not later

The core pricing and risk-recovery mathematics are built and unit-tested — this is not a
pre-technical idea in search of funding to start writing code. What's incomplete is exactly the
kind of work ecosystem infrastructure grants are meant to de-risk: independent security review
before any contract touches mainnet value, and completing the on-chain settlement path so
markets resolve trustlessly instead of by founder judgment. Funding this now, before mainnet
launch, is the difference between an ecosystem project that ships safely and one that ships
fast and finds its bugs in production.

## Technical proof — what's actually live today

Not a roadmap slide. Every item below is checkable against the repository:

- **DL-LMSR market pricing** — a full liquidity-sensitive market-scoring-rule implementation
  (`verify/lib/gambit-game-math.ts`), unit-tested.
- **GARCH(1,1) volatility modeling** — feeds the pricing engine's uncertainty term, clamped to
  documented bounds, unit-tested.
- **A fee-split and loss-recovery ("MAD Shield") formula layer** — implemented and tested in
  code, though one allocation base is under founder review before mainnet (documented
  transparently in this package's math appendix, not hidden).
- **SIWE (Sign-In With Ethereum) authentication** — implemented.
- **A Shield vault contract with a Foundry test suite** — `contracts/src/MADShieldVault.sol`,
  alongside a Market Factory, staking, dispute-voting, and optimistic-oracle contracts already
  written against Foundry/OpenZeppelin.

What's not yet live, stated as plainly as what is: the on-chain settlement cascade that turns a
resolved market into an actual payout is not fully wired end-to-end, and none of the
fund-custody contracts have had an independent security review. Those two gaps are exactly what
this grant would close.

## Ecosystem value

A working, audited conviction-market primitive on Arbitrum is a new market category for the
ecosystem, not a fork of an existing one — it targets continuous-pricing, creator-owned markets
on cultural/entertainment events, distinct from the fact-settlement prediction markets already
in the space. Shipping it safely (audited, tested, real settlement) rather than fast expands
what builders can point to as "already proven on Arbitrum" for the next team building in this
category.

## The specific infrastructure need

This grant would fund the gap between "built and tested in isolation" and "safe to put user
funds behind": an external security review of the three fund-custody contracts
(MADShieldVault, MADMarketFactory, MADStaking), the engineering time to close the settlement
cascade, and the RPC/CI infrastructure reliability needed to demo and iterate without free-tier
rate limits. Full cost breakdown and milestone structure: see
`07-USE-OF-PROCEEDS-BRIDGE.md` and `08-TECHNICAL-PARTNER-MILESTONE-BRIEF.md` in this package.

## What we are not claiming

No security audit has happened yet — this application is a request to fund one, not a claim
that one has passed. No mainnet contract is currently deployed with real user funds. No
retention, revenue, or user-count figure in this narrative should be read as measured traction;
the platform has a pre-launch waitlist, not live usage data. Every number above is checkable in
the repository as of this writing, not asserted from a deck.
