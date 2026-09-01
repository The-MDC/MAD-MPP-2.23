# MAD Gambit — Investor Execution Package

**Built:** 2026-08-28, against `MAD-MPP-2.23` on branch `claude/boardy-investor-presentation-jxuj26`.
**Method:** four parallel deep reads of the current codebase (contracts + Foundry tests, the
full math engine + its test file, the headline-to-market pipeline, and the existing
`docs/boardy/` corpus), plus one direct on-chain verification of the $MADx token. Every claim
in every document below carries a file:line or on-chain citation — see the individual files.

## Contents

| # | Document | What it's for |
|---|---|---|
| 01 | `01-TRUTH-SHEET.md` | One page. Start here. |
| 02 | `02-FEATURE-TRACEABILITY-MATRIX.md` | Conceptual / Implemented / Validated / Demonstrated for every major feature |
| 03 | `03-MATH-ENGINE-APPENDIX.md` | Every live formula, plain-English, with worked arithmetic |
| 04 | `04-DEMO-SCRIPT.md` | The required 9-step demo sequence, happy path + failure fallback per step |
| 05 | `05-SECURITY-ORACLE-RISK-REGISTER.md` | What a careful internal read finds — not a substitute for an audit |
| 06 | `06-USE-OF-PROCEEDS-INFRASTRUCTURE.md` | $15K–$20K tranche, line-itemed |
| 07 | `07-USE-OF-PROCEEDS-BRIDGE.md` | $300K–$500K tranche, milestone-gated |
| 08 | `08-TECHNICAL-PARTNER-MILESTONE-BRIEF.md` | Four milestones, scoped to the specific gaps this audit found |
| 09 | `09-outlier-ventures-deck.html` | 12-slide deck — open in a browser |
| 10 | `10-general-investor-deck.html` | 11-slide deck — open in a browser |
| 11 | `11-GRANT-NARRATIVE.md` | Program-agnostic technical-proof narrative |
| 12 | `12-DILIGENCE-QUESTIONS.md` | 21 gating questions + 4 items this audit already resolved |

## The five things worth knowing before you open anything else

1. **The math engine is real and mostly well-tested — 21.5% of it, precisely.** GARCH
   volatility is the best-verified formula in the codebase. DL-LMSR pricing and the live MAD
   Shield payout resolver currently have zero test coverage.
2. **MAD Shield's live premium formula isn't the sophisticated one.** A GARCH-volatility-priced
   formula exists and is well-tested — but it isn't wired to the actual opt-in flow. The live
   one is a flat 2–4% dial with no risk input. Both are documented in `03`; don't let existing
   "GARCH-priced" copy stand uncorrected.
3. **Settlement is owner-attested today, not oracle-driven.** The dispute/settlement oracle
   contract is real, tested, and complete — it just isn't called by the market factory yet.
   That wiring is the single largest item the bridge tranche funds (`08`).
4. **$MADx is deployed and working as designed — a mint-on-purchase token — but existing copy
   describes a different mechanism.** The whitepaper and several code comments say "888,888,888
   fixed supply, minted once"; the live contract mints only against a purchase, against a cap
   recorded elsewhere in the code as 224,573,096. Reconcile which is current before pitching
   either (`12`, item R1).
5. **A parallel contract package, `contracts/madhat-core/`, doesn't compile and isn't part of
   this package's scope.** Don't cite it as a second product line in any external conversation.

## What this package deliberately does not do

Invent customers, users, revenue, partnerships, security audits, legal conclusions, oracle
accuracy, or production status. Call MAD Shield insurance. Imply any of the three referenced
raises (seed $1.24M–$2.48M, infrastructure $15K–$20K, bridge $300K–$500K) has closed. Every
document above is written to hold that line even under room pressure — see `12` for the
fallback line to use when a claim can't be strengthened further.
