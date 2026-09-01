# Diligence Question List — Nick Must Answer Before These Claims Go Out

**Purpose of this document:** every other document in this package is written to avoid making
these claims until they're answered. This list exists so that pressure in the room — an
investor pushing on retention, yield, or compliance — doesn't produce an answer live that
these materials didn't clear first. If you don't have a confident answer to a question below,
the correct move in the room is the fallback line given, not an improvised claim.

Organized by the six claim categories named in the brief: validation, compliance, security,
retention, yield, market size — plus a **Resolved by this audit** section up front for items
that no longer need asking, because a direct check already answered them.

---

## Resolved by this audit — recorded here so they aren't re-asked

**R1. $MADx is deployed — at `0x6972...151f` — as a mint-on-purchase token, not the fixed
888,888,888 supply described elsewhere in the repo; a second candidate address is unrelated.**
Two addresses are cited as "$MADx" in different files. Queried both directly on Arbitrum One
(chain 42161) via Blockscout, 2026-08-28, then corrected against the founder's direct
clarification: `0xb61ae7727579e3781ca0ec4902b6ba21d335fd18` (cited in
`contracts/madhat-core/DEPLOYED_ADDRESSES.md`) is confirmed **unrelated** — an unverified token
called "Serpentine Orkain" (`ORKx`, 2 holders, ~60M supply already minted), nothing to do with
this project; that citation should be removed. `0x6972370e1caAA3624F37D7e87C28e1089D00151f`
(cited in `Deploy.s.sol`, `verify/lib/contracts.ts`, `MADxToken.sol`'s header) is the real
MADDEX/$MADx contract — **per the founder, a fair-launch governance / GameFi / platform token
where a purchase must be made for any of it to mint.** That mechanism is exactly consistent with
its low/near-zero current on-chain supply and its generic Blockscout-indexed name ("MyToken" —
a contract with little or no mint activity yet often shows this way; not evidence of a fake or
misconfigured deploy).

**The real open item is not whether it's deployed — it is — but which supply *model* is
current.** Existing copy (whitepaper, several math-engine comments, `node-registry.ts`) states
"888,888,888 fixed supply, minted once" — a one-time, capped-forever design. The live contract
and the founder's own description are mint-on-purchase, and `verify/lib/contracts.ts`
separately records that cap as **224,573,096**, a different number from 888,888,888. These are
two different tokenomics models, not the same fact worded two ways. Confirm with Nick which is
current before any deck states either the mechanism or the supply figure. Low-priority,
cosmetic: consider setting the contract's on-chain name/symbol metadata so explorers show
"MADx"/"MADDEX" instead of the generic "MyToken."

**R2. The creator-share model is the 3-rung ladder (28.8% → 40% → 60%), not a flat 40%.**
`CANONICAL_NUMBERS_2026-08-19.md` §10 states this was "resolved" to a flat 40% with no range, and
explicitly retracts an earlier ladder hypothesis as wrong. That resolution is itself now stale:
`CREATOR_LADDER` in `verify/lib/gambit-game-math.ts:67-71` implements the exact 3-rung ladder,
carrying a code comment dated **"founder sign-off 31 Jul 2026"** — three weeks before the
CANONICAL_NUMBERS document that retracts it. `verify/lib/node-registry.ts:17-18` independently
logs the same 31-Jul sign-off. This package uses the ladder throughout as the current, code-verified
model. Flag to Nick: the "RESOLVED" section of `CANONICAL_NUMBERS_2026-08-19.md` needs a follow-up
correction — it currently states the opposite of what the code (with an earlier sign-off date) does.

**R3. The staking-tier conflict is real but is not the conflict the existing docs describe.**
`CANONICAL_NUMBERS_2026-08-19.md` and the math-engine skill file both say "6 tiers in code vs. 4
in the data room." As of this audit, `STAKING_TIERS` in `gambit-game-math.ts:52-57` is the
**4-tier** table (matching the data room), dated 31-Jul-2026 by `git blame` — the "6 tiers in
code" description is stale. The real, current mismatch is different and arguably more serious:
**`contracts/src/MADStaking.sol:17-22` is still the old 6-tier table**, and its own header
comment claims to "mirror `STAKING_TIERS` in `gambit-game-math.ts`" — which is no longer true.
This is an app-layer-vs-deployed-contract-layer drift, not an app-layer-vs-marketing drift.
Needs an engineering decision (update the Solidity table or explicitly deprecate it) before
staking numbers are pitched with confidence in either the app or the contract's name.

**R4. `contracts/madhat-core/` is not a secondary implementation you can point to as backup —
it does not compile.** It is explicitly excluded from CI (`.github/workflows/foundry.yml:7-8`),
has no vendored dependencies (no `lib/` directory at all), and this audit found multiple
compile-blocking bugs in it independent of the missing dependencies: undefined error references
in `game.sol`, a test suite (`StakingPoolNFTTest.sol`) calling functions and constructor
arities that don't exist on the contracts it's testing, and a deploy script
(`DeployCoreContracts.s.sol`) that calls a nonexistent function and passes the wrong argument
count to an initializer. It also contains a plaintext-private-keys file
(`contracts/madhat-core/notes.txt`) — confirmed these are the well-known public Anvil/Foundry
test-mnemonic keys, not a real leak, but still inconsistent with this repo's own
`SECURITY.md` policy against committed secrets. **Recommendation: do not reference
`contracts/madhat-core/` in any investor or grant material as evidence of anything built.**
It reads better as abandoned scaffolding than as a second product line, and describing it as
either invites a diligence question this package can't currently answer well.

---

## Validation

1. **"100% USD solvency across 1,000 Monte-Carlo bear scenarios"** (whitepaper §04) — who ran
   this simulation, on what assumptions (correlation between shield opt-in rate and bear-market
   severity, tail-risk distribution used), and is the code for it in this repo or external? This
   audit found no simulation code matching this description anywhere in `verify/lib/` — if it
   exists, it's outside this repository.
   - *If unanswered:* say "solvency is modeled, not audited" and stop there.
2. This package uses the traceability matrix's own four-state ladder — **Conceptual →
   Implemented → Validated → Demonstrated** (see `02-FEATURE-TRACEABILITY-MATRIX.md` for the
   exact definitions used throughout). Hold every claim to that ladder consistently; don't let
   "implemented" quietly stand in for "validated" in conversation even where a document is
   careful to distinguish them.
3. The DL-LMSR and GARCH(1,1) constants (`LMSR_DEFAULT_B: 1200`, GARCH ω/α/β) carry comments
   referencing a "17-corrections" pass — five distinct fixes, fully audited in
   `03-MATH-ENGINE-APPENDIX.md` §9. Was there a formal review process behind those corrections,
   or founder judgment calls checked against test behavior? Investors with quant backgrounds
   will ask this directly, and the honest answer ("caught through iteration, not external
   review") is a fine answer — don't dress it up as more than that.
4. **New finding, not in prior docs:** the DL-LMSR cost function applies a volume-scaling
   multiplier (`α(V)`) that the price function does not — so "cost" and "price" are not
   mathematically consistent derivatives of each other as currently coded, and the pricing
   functions have zero unit-test coverage. Don't describe the pricing engine as "fully
   validated" without this caveat; see math appendix §5.

## Compliance / legal

5. **Entity status** — "New Mexico LLC (filed)" is the canonical line. Filed with the state, or
   filed *and* in good standing with a current registered agent? These are different legal
   facts and only one of them is "New Mexico LLC, filed."
   - *If unanswered:* say exactly "New Mexico LLC, filed" and nothing more — do not
     editorialize into "compliant" or "SEC-exempt."
6. Has any lawyer reviewed whether the market structure (continuous-pricing conviction markets,
   perpetual-style resolution) is a security, a derivative, a prediction market, or something
   without settled precedent? If no lawyer has opined, no material may say "regulatory-safe,"
   "SEC-compliant," or "SEC-exempt token issuance" in any form.
7. **The live `o-vdeck26.vercel.app` deck states "Manager-Managed Wyoming LLC," "SEC Compliant,"
   and "SEC-exempt token issuance"** (10 Wyoming mentions, 0 New Mexico, as of the last check).
   This is a standing, active exposure — anyone with the public link sees it today. It is not
   built from a source file in this repo (the deployed bundle is a browser-exported single-page
   snapshot, not this repo's React component), so it cannot be fixed by editing anything here.
   **Possible connection worth confirming with Nick directly, not asserted as fact:** the
   project name `OV-Deck-2026` / `o-vdeck26` may stand for "Outlier Ventures Deck" — if so, this
   is not a generic stale artifact, it may be the actual deck associated with a live
   relationship thread (`INVESTOR_PRESENTATION.md` calls Outlier Ventures "a live thread... a
   dedicated OV deck exists"). If that connection is real, fixing or retiring this specific
   surface is materially more urgent than a generic cleanup item. Until it's fixed, `DECK_URL`
   in the live app (`verify/lib/node-registry.ts`) should not point at it, and it should not be
   handed to Outlier Ventures or anyone else under any circumstance.
8. Is MAD Shield described anywhere, by anyone on the team, in any channel, as "insurance"? It
   cannot be — insurance is a regulated term with licensing requirements this product does not
   have. The correct language is "opt-in, fee-funded loss-recovery pool," every time.

## Security

9. **MADShieldVault.sol — the contract that actually holds user funds for MAD Shield — has no
   `ReentrancyGuard`**, unlike its sibling contracts (`MADStaking.sol`, `MADMarketFactory.sol`,
   `MADOptimisticOracle.sol` all import and use it; `MADShieldVault.sol` does not). Its
   `stake`/`requestUnstake`/`claim`/`resolveLoss`/`withdraw` functions all move $MADx. State is
   written before external calls (correct checks-effects-interactions order), so this is a
   defense-in-depth gap, not a demonstrated exploit — but it should be closed, and no security
   register may describe this contract as hardened without noting the gap. Has this been raised
   with whoever eventually reviews the contracts?
10. Has any contract in `contracts/src/` — MADShieldVault, MADMarketFactory, MADStaking in
    particular — been through any external security review, even informal? This audit found
    zero evidence of one (no audit report, no findings artifact in the repo). One CI workflow
    comment claims an initial Slither pass "surfaced 135 findings across the MAD* contracts that
    need triage" — this audit could not locate the actual findings artifact to verify that
    number or see what they were. Confirm whether that triage has happened.
11. **Oracle reality check, now fully mapped:** the only real Chainlink integration anywhere in
    the repo is a VRF consumer (`contracts/evolution/EvolutionVRFConsumer.sol`) for card-evolution
    randomness, and it is deliberately excluded from the compiled/tested project. Every other
    Chainlink/Pyth/UMA/ConditionalTokens reference — in both `contracts/` and `verify/` — is a
    comment, a placeholder string, or marketing copy. `MADOptimisticOracle.sol` is a real,
    tested, self-contained assert/dispute/settle contract, explicitly self-described as
    "UMA-inspired," not a UMA integration — and it is not called by `MADMarketFactory.sol`
    (zero references to "oracle" in that file). The casino component's "provably fair" language
    currently runs on browser `Math.random`/`crypto`, not VRF, per its own code comment. Never
    claim oracle accuracy, VRF-backed randomness in the live product, or an operating optimistic-
    oracle settlement path without this context attached.
12. Who holds upgrade/admin keys on any contract, if and when deployed? This audit found no
    `broadcast/` records anywhere in the repo — no evidence any MAD-authored contract has ever
    actually been deployed and broadcast from this codebase. Confirm this is accurate before
    anyone assumes otherwise from the presence of tested, complete-looking contracts.

## Retention

13. **"70%+ D30 target"** (whitepaper §02) — is there a single real user cohort behind this
    number, or is it a target with no measured cohort yet? Must always be labeled "target,"
    never "retention" alone.
14. Is the "15,000 people" figure a waitlist (email/signup form), a Discord/Telegram member
    count, or something else? State the actual mechanism once, precisely, and use "waitlist"
    every time after.

## Yield

15. Staking APYs in `STAKING_TIERS` (8.8% / 18.8% / 28.8% / 38.8%) — is this yield paid from
    protocol revenue, token emissions, the Furnace burn mechanism, or unfunded/aspirational? A
    yield number without a stated funding source is the fastest way to lose a technically
    literate investor's trust.
16. The MAD Shield recovery percentages (28.8% standard, scaling to 40% shielded, 60%
    VIP/whale) — is the payout pool currently capitalized by anything, or does it exist only as
    a formula with no funded reserve? Note also (from the math appendix): the premium formula
    actually wired to the live opt-in flow is a flat 2–4%-of-stake dial with **no volatility
    input at all** — a different, simpler function from the GARCH-priced formula that exists
    and is well-tested but isn't the one connected to the product. Don't say "MAD Shield is
    GARCH-priced" without that correction.

## Market size

17. What is the actual source and method behind any TAM/SAM/SOM number used in any deck? State
    the method once in the appendix of every deck that uses the number.
18. Confirm the Y3 revenue figure in current use is **$139.6M gross base case**
    (`CANONICAL_NUMBERS_2026-08-19.md`), not the $154.5M / $121.4M / $86–154M figures that
    appear in older repo material (`docs/MAD_GAMBIT_MASTER.md` predates the $139.6M revision and
    never mentions it).
19. Is the Y3 revenue-stream split (fees / NFT / staking / shield) the reconciled figure, or the
    retired 51/31/12/6 split every document that mentions it — including the freshest one —
    flags as derived from the old $154.5M model and not yet re-run? Do not present a stream-split
    percentage breakdown in any deck until this is confirmed current. Nothing in this audit found
    evidence it has been re-run.
20. **Also worth a quick look, low priority:** `docs/MAD_GAMBIT_MASTER.md` separately flags the
    platform's fee-allocation waterfall itself as internally inconsistent — its own canonical
    doc states MAD Shield pool funding as "28.8% of the rake" in one section and "25% of the
    platform's net share" in another, and a third document (`MAD_GAMBIT_MASTER.md`) gives
    Community 30% where Boardy's breakdown gives 28.8% + 1.2% reserve. None of this is
    implemented in `splitFee()` either way — the code only computes creator/community/protocol
    cuts, not a further ops/shield/burn/reserve split — so nothing here is "enforced in code."
    Treat any specific ops/shield/burn/reserve percentage as illustrative allocation intent, not
    a verified figure, until reconciled.

## Funding-secured language — the cross-cutting rule

21. Zero of the three raises referenced in these materials (seed $1.24M–$2.48M, infrastructure
    $15K–$20K, bridge $300K–$500K) are closed as of this writing. No document in this package
    may be edited to imply otherwise — no "raised," "backed by," "committed," or logo without
    Nick confirming a signed term sheet or wire first.

---

**How to use this list:** before any deck, one-pager, or grant narrative in this package is
shown to an external party, walk this list top to bottom. Anywhere the honest answer is "I
don't know" or "not yet," the corresponding document already defaults to the fallback language
given here. Don't strengthen a claim in the room past what this list clears.
