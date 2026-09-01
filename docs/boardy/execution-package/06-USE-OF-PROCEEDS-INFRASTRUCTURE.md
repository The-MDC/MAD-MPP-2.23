# Use of Proceeds — Infrastructure Tranche ($15K–$20K)

**Status:** Proposed allocation. Not secured — no infrastructure funding has closed as of this
document. Figures are the founder's cost estimates, not vendor quotes; treat every line as
±30% until contracted.

## Purpose

This tranche keeps the existing build velocity alive for 3–6 months. It does not fund an
audit, a hire, or marketing — those live in the bridge tranche (`07-USE-OF-PROCEEDS-BRIDGE.md`).
This is the "keep the lights on" round: compute, model usage, RPC reliability, and the one
piece of hardware that's currently a bottleneck.

## Why now (evidenced, not asserted)

Two concrete operational facts motivate the CI/RPC line items below — both are current-state
facts about this repo, not projections:

- **GitHub Actions is minutes-constrained.** Repo-owned workflow runs have sat `queued` for
  40+ hours while GitHub-hosted Dependabot jobs on the same repo complete in seconds — the
  signature of an exhausted or capped Actions-minutes allocation at the org level. A paid
  Actions tier (or a higher minutes cap) directly unblocks CI, which currently cannot go green
  on any PR regardless of code quality.
- **RPC access is on free/shared tiers.** Contract interaction, testnet deploys, and any future
  demo relying on live chain reads currently depend on public/free RPC endpoints, which rate-limit
  unpredictably. A paid RPC tier (Alchemy) removes that as a demo-day failure mode.

## Line items

| Category | Item | Monthly | Months | Subtotal | Notes |
|---|---|---:|---:|---:|---|
| AI/dev usage | Claude Code + Anthropic API usage (agentic build velocity) | $900 | 6 | $5,400 | The primary "frontier-model usage" line — this is how the codebase is being built and audited today |
| Hosting | Vercel (Pro/Team tier, current usage trajectory) | $120 | 6 | $720 | Covers the `mad-mpp-2-23` project + preview deployments |
| Database | Neon Postgres (compute + branching for preview envs) | $50 | 6 | $300 | Scales with preview-branch-per-PR usage |
| RPC | Alchemy paid tier — Arbitrum Nova + Arbitrum One + Sepolia | $130 | 6 | $780 | Removes free-tier rate-limiting as a live-demo risk |
| CI/CD | GitHub Actions minutes (paid tier or org cap increase) | $150 | 6 | $900 | Directly unblocks the current queued-CI state — see above |
| Domains/SSL/misc | madgambit.io + subdomains, transactional email, misc SaaS | $60 | 6 | $360 | |
| **Recurring subtotal** | | | | **$8,460** | |
| Hardware | One capable local dev machine (Foundry fuzz-testing and local builds are CPU/RAM-bound) | — | one-time | $3,200 | Mid-tier workstation-class spec, not a laptop refresh |
| Legal/entity | New Mexico LLC — registered agent, annual report, minimal filing costs | — | one-time | $600 | Maintenance only — no legal opinions or compliance audits funded from this tranche |
| Contingency | Unplanned overage buffer | — | one-time | 10% of total | Standard practice for a fixed-price ask over a variable-cost base |

## Roll-up

| Scenario | Recurring (6mo) | Hardware | Legal | Contingency (10%) | **Total** |
|---|---:|---:|---:|---:|---:|
| Low end | $8,460 | $3,200 | $600 | $1,226 | **≈ $13,500** → round to **$15,000 floor** |
| High end (full 6mo + buffer) | $8,460 | $3,200 | $600 | $2,000 | **≈ $19,500** → **$20,000 ceiling** |

The floor assumes a leaner 3–4 month recurring burn if the round lands late; the ceiling
assumes the full 6-month runway. Both bound inside the stated $15K–$20K ask.

## What this tranche explicitly does NOT fund

- Smart-contract security audit (bridge tranche, see `07-USE-OF-PROCEEDS-BRIDGE.md`)
- Any hire, contractor, or studio engagement
- Marketing, creator acquisition, or paid distribution
- Legal opinions on regulatory status or token classification
- Anything that would let anyone describe this round as "funded" for headline traction claims —
  see `12-DILIGENCE-QUESTIONS.md`, item on funding-secured language.
