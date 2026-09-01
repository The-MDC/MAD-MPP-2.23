# Technical Partner / Studio Milestone Brief

**For:** the studio-engagement portion of the bridge tranche (`07-USE-OF-PROCEEDS-BRIDGE.md`,
45% of the raise, $135K–$225K). The security-audit line (25%, $75K–$125K) is funded and paid
separately, direct to the audit firm — this brief's milestones assume the audit runs alongside
M3 below, not as something the studio itself performs.

**What this closes:** the exact, evidenced gap list in `05-SECURITY-ORACLE-RISK-REGISTER.md`
and `02-FEATURE-TRACEABILITY-MATRIX.md` — not a hypothetical scope, a specific one, verified
against the current repository.

## Selection criteria for the partner

- Solidity/Foundry fluency demonstrable against this repo's existing test style (checks-effects-
  interactions discipline, fuzz tests, the ERC-2771 gasless-relay pattern already in use).
- Comfortable working from an existing, opinionated codebase rather than greenfield — this is
  closing gaps in ten already-written, already-tested contracts, not designing from scratch.
- Prior experience with optimistic-oracle or dispute-resolution patterns is a strong plus,
  since M1's central task is wiring exactly that kind of mechanism correctly.
- References or a work sample the founder can independently verify — this package's whole
  discipline is "don't take a claim on faith," and the partner selection should hold to the
  same standard.

## Milestone 1 — Close the known gaps (target: 3–4 weeks, 20% of studio budget)

**Scope**, each item cited to where this audit found it:

1. Add `ReentrancyGuard` to `MADShieldVault.sol` and a passing regression test for it —
   currently the only fund-custody contract in `contracts/src/` missing this pattern
   (`05-SECURITY-ORACLE-RISK-REGISTER.md`).
2. Wire `MADOptimisticOracle.sol` into `MADMarketFactory.resolve()` so settlement reads a real
   resolved outcome instead of taking an owner-supplied raw value — currently zero references
   to the oracle exist in the factory contract.
3. Reconcile `MADStaking.sol`'s 6-tier table against the TypeScript engine's founder-approved
   4-tier canon — either update the contract to match or formally document why it diverges.
4. A disposition decision on `contracts/madhat-core/`: fix it to compile and bring it under CI,
   or formally archive/delete it. It currently doesn't build and shouldn't be left in a state
   where it's ambiguous whether it's live scaffolding or abandoned work.
5. Implement whatever `splitFee()` fix Nick has signed off on by this point (see
   `12-DILIGENCE-QUESTIONS.md` R2/R3 and `03-MATH-ENGINE-APPENDIX.md` §3) — this milestone
   assumes the product *decision* is made before the studio starts; implementing a decided fix
   is in scope, making the decision is not.

**Acceptance criteria:** all five items merged, all existing tests still passing, new tests
covering the reentrancy fix and the oracle-factory integration, `forge test` green in CI.

## Milestone 2 — Full testnet deployment (target: 3–4 weeks, 20%)

**Scope:** deploy the full contract set (Staking → MarketFactory → ShieldVault →
OptimisticOracle → DisputeVoting, following `Deploy.s.sol`'s existing ordering) to Arbitrum
Sepolia (421614) with real, committed `broadcast/` records — the repo currently has none
anywhere, which is itself evidence nothing has ever been deployed from it. Point the frontend's
contract-address environment variables at the real testnet addresses (`verify/.env.example`
ships every one of them blank today). Confirm the gasless-relay path
(`verify/app/api/v1/relay/execute/`) actually executes against the deployed contracts, not just
against an empty allowlist.

**Acceptance criteria:** a market can be created, backed, resolved through the wired oracle
path, and claimed, end to end, on Sepolia, from the live frontend — not just from a Foundry
test. Demo-able on a call.

## Milestone 3 — Independent audit support and remediation (target: 4–6 weeks, 30%)

**Scope:** the external audit itself is funded and contracted separately (see
`07-USE-OF-PROCEEDS-BRIDGE.md`), but the studio's job during this window is to support it —
answer auditor questions, provide test scaffolding, and then implement and re-verify every
finding the audit returns, on the same testnet deployment from M2. This is deliberately the
largest single share of the studio budget, because remediation scope is the least predictable
part of this engagement at signing time.

**Acceptance criteria:** every audit finding rated medium or above has a merged fix with a
regression test; the auditor (or an agreed second reviewer) signs off that fixes are complete;
a public or investor-shareable summary of what was found and fixed exists.

## Milestone 4 — Mainnet-readiness (target: 2–3 weeks, 30%)

**Scope:** final pre-launch checklist — confirmed multisig or equivalent admin-key custody
(not a single EOA), monitoring/alerting on the deployed contracts, an incident-response runbook,
and the actual mainnet deployment scripts rehearsed against Sepolia one more time before any
real-network broadcast. This milestone does not include the broadcast to Arbitrum One/Nova
mainnet itself unless Nick explicitly authorizes it as part of this engagement — that's a
go/no-go decision for the founder, not something a milestone contract should pre-commit to.

**Acceptance criteria:** a written go/no-go readiness report Nick can act on independently of
the studio.

## Payment structure

Per `07-USE-OF-PROCEEDS-BRIDGE.md`: 20% of the full bridge tranche on signing, then the
remaining studio-scope budget released against these four milestones as delivered and
accepted — not on elapsed time. A milestone that slips does not trigger payment; it triggers a
scope conversation between Nick and the studio, not an automatic extension.

## What this brief deliberately excludes

No new product features, no UI redesign, no marketing site work, no second card-game system —
this is scoped entirely to closing the settlement, security, and deployment gap this audit
found. Anything outside that scope is a separate conversation and a separate budget line.
