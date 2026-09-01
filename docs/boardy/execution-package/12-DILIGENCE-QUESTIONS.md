# Diligence Question List — Nick Must Answer Before These Claims Go Out

**Purpose of this document:** every other document in this package is written to avoid making
these claims until they're answered. This list exists so that pressure in the room — an
investor pushing on retention, yield, or compliance — doesn't produce an answer live that
these materials didn't clear first. If you don't have a confident answer to a question below,
the correct move in the room is the fallback line given, not an improvised claim.

Organized by the six claim categories named in the brief: validation, compliance, security,
retention, yield, market size.

## Validation

1. **"100% USD solvency across 1,000 Monte-Carlo bear scenarios"** (whitepaper §04) — who ran
   this simulation, on what assumptions (correlation between shield opt-in rate and bear-market
   severity, tail-risk distribution used), and is the code for it in this repo or external? If
   external/unreproducible from this repo, the claim needs a "modeled, not independently
   audited" qualifier every time it's used.
   - *If unanswered:* say "solvency is modeled, not audited" and stop there.
2. Does "validated" in the feature-traceability matrix mean "has a passing automated test," or
   "a human manually checked it once"? These are different claims. Pick one definition and hold
   every row in the matrix to it.
3. The DL-LMSR and GARCH(1,1) constants (`LMSR_DEFAULT_B: 1200`, GARCH ω/α/β) carry comments
   referencing "17-corrections" — was there a formal review process behind those corrections,
   or were they founder judgment calls? Investors with quant backgrounds will ask this directly.

## Compliance / legal

4. **Entity status** — "New Mexico LLC (filed)" is the canonical line. Filed with the state, or
   filed *and* in good standing with a current registered agent? These are different legal
   facts and only one of them is "New Mexico LLC, filed."
   - *If unanswered:* say exactly "New Mexico LLC, filed" and nothing more — do not
     editorialize into "compliant" or "SEC-exempt."
5. Has any lawyer reviewed whether the market structure (continuous-pricing conviction markets,
   perpetual-style resolution) is a security, a derivative, a prediction market, or something
   without settled precedent — in New Mexico, federally, or in any jurisdiction where users are
   expected? If no lawyer has opined, no material may say "regulatory-safe," "SEC-compliant,"
   or "SEC-exempt token issuance" in any form, including inside a Wyoming-era deck that hasn't
   been fully retired yet.
6. **The live `o-vdeck26.vercel.app` deck states "Manager-Managed Wyoming LLC," "SEC Compliant,"
   and "SEC-exempt token issuance" as of the last check (10 Wyoming mentions, 0 New Mexico).**
   This is a standing, active exposure — anyone with the public link sees it today. Confirm: is
   the source repo for that deployment identified, and is a corrected redeploy scheduled? Until
   it is, `DECK_URL` in the live app (`verify/lib/node-registry.ts`) should not point at it.
7. Is MAD Shield described anywhere, by anyone on the team, in any channel, as "insurance"? It
   cannot be — insurance is a regulated term with licensing requirements this product does not
   have. The correct language is "opt-in, fee-funded loss-recovery pool," every time.

## Security

8. Has any contract in `contracts/src/` (MADShieldVault, MADMarketFactory, MADStaking in
   particular — the three that will hold or move user funds) been through an external security
   review of any kind — even an informal one? If the answer is no for all three, the security
   register in this package should say so plainly, and no deck slide should imply otherwise
   with language like "audited" or "security-hardened."
9. What oracle(s) does market resolution actually depend on today, versus in the roadmap —
   Chainlink Price Feeds, Chainlink VRF, Pyth, UMA's optimistic-oracle pattern (there is a
   `MADOptimisticOracle.sol` and a `MADDisputeVoting.sol` in the repo — do these implement a
   real optimistic-oracle dispute flow, or are they scaffolding)? Never claim "oracle accuracy"
   or cite an uptime/accuracy percentage for any oracle without a named source for that number.
10. Who holds upgrade/admin keys on the deployed contracts, if any are deployed? A multisig, a
    single EOA, or not yet decided? This is a standard diligence question and an unprepared
    answer reads as a red flag disproportionate to the actual risk.

## Retention

11. **"70%+ D30 target"** (whitepaper §02) — is there a single real user cohort behind this
    number, or is it a target with no measured cohort yet? If there is no measured cohort, this
    must always be labeled "target," never "retention" alone, and never shown as a chart axis
    without that label in the same visual field.
12. Is the "15,000 people" figure a waitlist (email/signup form), a Discord/Telegram member
    count, or something else? These are different claims with different implied intent-to-use.
    State the actual mechanism, once, precisely, and use "waitlist" every time after.

## Yield

13. Staking APYs in `STAKING_TIERS` (8.8% / 18.8% / 28.8% / 38.8%) — is this yield paid from
    protocol revenue, from token emissions, from the Furnace burn mechanism, or unfunded /
    aspirational? A yield number without a stated funding source is the single fastest way to
    lose a technically literate investor's trust. State the source or state "unfunded, target
    only" — there is no acceptable third option.
14. The MAD Shield recovery percentages (28.8% standard, scaling to 40% shielded tier, 60% for
    VIP/whale ≥888,888 $MADx) — is the funding pool for these payouts currently capitalized by
    anything, or does it exist only as a formula (`SHIELD_SAFETY_MARGIN`, premium collection)
    with no funded reserve yet? If unfunded, every mention of a recovery percentage needs the
    same "modeled, not currently funded" qualifier as the solvency claim above.

## Market size

15. What is the actual source and method behind any TAM/SAM/SOM number used in any deck —
    comparable-platform volume (Polymarket, Kalshi, DraftKings), a top-down "creator economy"
    market size, or something else? State the method once in the appendix of every deck that
    uses the number, so it's never presented as a bare figure with no derivation.
16. The Y3 revenue projection — confirm which figure is current: $139.6M gross base case (per
    `CANONICAL_NUMBERS_2026-08-19.md`) or the earlier $154.5M figure embedded in some copy
    (whitepaper §07 as of last check, `docs/boardy/*` sources). These materials use $139.6M
    base case throughout and treat $177.7M as bull-case-only, never a headline — confirm this
    is still the founder-approved figure before these documents go out.
17. Is the Y3 revenue-stream split (fees / NFT / staking / shield) the reconciled figure, or
    the retired 51/31/12/6 split flagged as needing a rerun in `CANONICAL_NUMBERS_2026-08-19.md`?
    Do not present a stream-split percentage breakdown in any deck until this is confirmed
    current.

## Funding-secured language — the cross-cutting rule

18. Zero of the three raises referenced in these materials (seed $1.24M–$2.48M, infrastructure
    $15K–$20K, bridge $300K–$500K) are closed as of this writing. No document in this package
    may be edited to imply otherwise — no "raised," "backed by," "committed," or logo without
    Nick confirming a signed term sheet or wire first. This is the one item on this list with
    zero tolerance for rounding up.

---

**How to use this list:** before any deck, one-pager, or grant narrative in this package is
shown to an external party, walk this list top to bottom. Anywhere the honest answer is "I
don't know" or "not yet," the corresponding document already defaults to the fallback language
given here — that's why the fallback lines exist. Don't strengthen a claim in the room past
what this list clears.
