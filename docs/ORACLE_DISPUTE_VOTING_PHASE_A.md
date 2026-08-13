# MAD Optimistic Oracle — Phase A Dispute Decentralization

**Date:** 2026-08-12 · **Status:** built, PR #77 (`claude/oracle-dispute-voting`), draft — not yet merged
**Scope:** what Phase A changes about how disputed market outcomes get resolved, and — the question that prompted this page — who it costs money and who it doesn't.

---

## What Phase A is

Today, `MADOptimisticOracle.resolveDispute()` is decided by a single owner-controlled call. Phase A adds `MADDisputeVoting.sol`: a staked-MADx, commit-reveal vote that can decide the outcome instead, for disputes big enough to warrant it.

- **Threshold-gated, not universal.** Only disputes whose bond clears `voteThresholdBond` (default 5,000 MADx) open a vote. Routing every small dispute through a 36h process would slow the common case for nothing.
- **Commit-reveal, not a plain running tally.** Stops the largest/last staker from simply copying whichever side is ahead.
- **Quorum-gated fallback, not a revert.** A vote that never reaches quorum doesn't strand the market — `finalize()` is a no-op, and the owner's existing `resolveDispute` path is untouched and still callable the entire time. Decentralization is additive here, not a single point of failure swapped for another one.
- **Weight = staked MADx** (via `MADStaking`), not wallet balance — borrowed/flash-loaned tokens can't buy voting weight for the duration of one vote.

Full design rationale (the six-perspective pass this was built from) lives in `MADDisputeVoting.sol`'s header comment.

## The economics — does this change who gets paid

**No, not as shipped.** `resolveDispute()`'s payout math is byte-identical to before Phase A:

```
fee    = (bond * 188) / 10_000        // 1.88% treasury cut, unchanged
payout = (bond * 2) - fee             // winner takes both bonds minus the fee
```

Phase A only changes **who supplies the winning outcome** to that function — a staked vote instead of the owner's own judgment. MAD Gambit's treasury revenue and the winning disputant's payout are both unaffected.

**A proposed-but-unbuilt refinement changes this.** Flagged in the PR, not implemented: a voter-reward pool, funded by carving a slice out of the losing side's slashed bond, to properly incentivize participation (right now a correct voter earns nothing for showing up). If built:

| | MAD Gambit's revenue (1.88% fee) | Winning disputant's payout |
|---|---|---|
| Today (shipped) | unchanged | unchanged |
| With a voter-reward pool (not built) | **unchanged** — the fee itself isn't touched | **less** — the reward slice comes out of what the winner would otherwise take home |

In other words, if it gets built, it's a transfer from "whoever happened to win this one dispute" to "the stakers who did the work of adjudicating it correctly" — not a transfer to the platform. No specific reward percentage has been decided; this is a direction, not a spec.

## Status

- Contracts + tests: `contracts/src/MADDisputeVoting.sol`, `contracts/test/MADDisputeVoting.t.sol`, `contracts/test/MADOptimisticOracle.t.sol` (updated for the new two-arg `dispute()` signature).
- PR #77, draft, CI in progress.
- Not deployed anywhere. No production behavior changes until this merges and is deployed.
