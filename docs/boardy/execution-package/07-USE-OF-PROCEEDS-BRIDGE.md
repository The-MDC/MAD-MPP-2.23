# Use of Proceeds — Milestone Bridge ($300K–$500K)

**Status:** Proposed allocation, milestone-gated. Not secured — no bridge funding has closed
as of this document. This is deliberately a different shape from the infrastructure tranche:
it funds an external technical partner or studio against explicit, accepted milestones, not
a monthly burn. See `08-TECHNICAL-PARTNER-MILESTONE-BRIEF.md` for the milestone definitions
this budget is gated against.

## Allocation logic

Every dollar in this tranche is tied to closing one of three gaps: (1) the settlement/resolution
path that is currently specified but not fully on-chain, (2) independent security review of the
contracts that will hold user funds (MADShieldVault, MADMarketFactory, staking), and (3) the
testing depth needed before either of those touches mainnet with real value. Team and legal are
kept deliberately small — this is a build-and-audit round, not an operating round.

| Category | % | Low ($300K) | High ($500K) | Funds |
|---|---:|---:|---:|---|
| Technical partner / studio engagement | 45% | $135,000 | $225,000 | Settlement cascade, market-factory hardening, agent-layer productionization — scoped against the milestone brief |
| Security (external audit + remediation) | 25% | $75,000 | $125,000 | One independent audit of the fund-custody contracts (MADShieldVault, staking, market settlement) plus a fix-and-reverify pass |
| Testing / QA infrastructure | 10% | $30,000 | $50,000 | Testnet operations, fuzz/load testing beyond what Foundry's default suite covers, a seeded bug-bounty budget |
| Founder runway during the bridge | 12% | $36,000 | $60,000 | Nick's minimal operating cost for the bridge window — not a salary increase, continuity only |
| Legal | 5% | $15,000 | $25,000 | SAFE/round documentation, entity compliance maintenance — explicitly **not** a legal opinion on token classification or regulatory status |
| Contingency | 3% | $9,000 | $15,000 | Standard buffer on a fixed-price milestone contract |
| **Total** | **100%** | **$300,000** | **$500,000** | |

## Release structure (proposed, not yet agreed with any partner)

- **20% on signing** — scoping and kickoff, standard for a milestone engagement of this size.
- **Remaining 80% released per milestone**, on acceptance criteria met (see the milestone
  brief) — not on time elapsed. A milestone that slips does not trigger payment; it triggers a
  scope conversation.
- **Audit budget is held separate** from the studio engagement and paid directly to the audit
  firm on delivery of the report, so the studio is never the counterparty being audited and
  the auditor.

## What this tranche explicitly does NOT fund

- Marketing, paid user acquisition, or influencer spend
- A second product line or feature expansion beyond closing the settlement/security gap
- Any claim that this raise itself constitutes "funded" or "backed" status before it closes —
  see `12-DILIGENCE-QUESTIONS.md`
