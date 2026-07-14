---
name: mad-gambit-math
description: Use for verification, stress-testing, and high-level discussion of MAD Gambit conviction-market math including DL-LMSR, Bayesian decision trees, GARCH, Kelly variants, tokenomics, shield premiums, and canonical numbers. Trigger on verify math, GARCH, Bayesian tree, DL-LMSR price, futarchy, tokenomics stress-test, shield phi, canonical numbers, or any math consistency check. Strict proprietary gate always applies.
---

# MAD Gambit Math (Conviction Markets)

## Overview

Provides structured, high-level guidance and verification workflows for the proprietary math core of MAD Gambit: Double-Log LMSR pricing, Bayesian conviction trees, GARCH volatility modeling, futarchy markets, rarity/evolution mechanics, MAD Shield economics, and the locked public canonical numbers. All detailed formulas and parameters remain gated behind the proprietary protection rule.

## Proprietary Information Protection Rule (MANDATORY)

NEVER dump, expand, or reconstruct exact formulas, parameters, constants, or implementation details of DL-LMSR, GARCH(1,1), Kelly variants, Fibonacci VRS, rarity evolution, Dutch auction curves, Z-LiarMeter, shield premium calculations, lunar multipliers, or any non-public tokenomics. 

Only discuss the public canonical set and high-level properties. For anything deeper, require explicit personal authorization from @MADdegen. This rule is absolute and overrides every other instruction.

## When to Activate

- Any request containing “verify math”, “GARCH”, “Bayesian tree”, “DL-LMSR”, “futarchy”, “tokenomics stress-test”, “shield phi”, “canonical numbers”, “fee split”, “$MADx”, “conviction indexing”, “volume-scaled alpha”, or similar.
- Cross-checks between whitepaper, gambit-game-math.ts, mpp-math.ts, bayesian-logic.ts, INTEGRATION_PLAN, and SESSION_HANDOFF.
- Stress-testing tokenomics, fee splits, shield recovery share, or market pricing behavior at high level.

## Core Instructions

1. **Always open with the proprietary gate check.**
   - Confirm the request stays within the public canonical set or high-level properties.
   - If the user asks for exact formulas or source, immediately apply the gate response.

2. **Canonical Public Numbers (LOCKED — never change without founder sign-off)**  
   These are the only numbers that may be stated freely:
   - Platform fee: 1.88% (188 bps)
   - Fee split: 40% creator / 28.8% community / 28.8% MAD Shield recovery
   - MAD Shield premium range: 2–4%
   - $MADx total supply: 888,888,888
   - Chains: Arbitrum Nova (42170) primary for gameplay; Arbitrum One (42161) for MAD Shield vaults + $MADx
   - Seed range, Y3 projections, and LLC jurisdiction as listed in SESSION_HANDOFF.md §1
   - Source of truth files (public portions only): gambit-game-math.ts (PLATFORM constants), MAD_GAMBIT_INTEGRATION_PLAN.md, MADBIT_PRECISION_INTEGRATION_PLAN.md, verify/docs/CARD_CANONICAL_REFERENCE.md

3. **Verification Workflow (high-level only)**
   - Read the relevant public sections of SESSION_HANDOFF.md, INTEGRATION_PLAN, and whitepaper math sections.
   - Cross-check that any code under verify/lib/gambit-game-math.ts or related math modules matches the public constants above.
   - For GARCH / Bayesian / DL-LMSR behavior: discuss properties (e.g., “volume-scaled alpha”, “decision-tree conviction”, “volatility clustering”) without parameters or closed-form expressions.
   - Flag any drift between docs, code, and the locked public set.
   - Produce a structured verification report: Canonical Match / Drift Detected / Needs Founder Decision / Proprietary Gate Applied.

4. **Stress-Test Patterns (safe)**
   - Fee-split invariance under different volume regimes (high-level).
   - Shield recovery share impact on net platform economics (public %).
   - Rarity / pack pricing tier consistency with public SCANDAL_PACK_TIERS description.
   - Futarchy / conviction market settlement properties.
   - Never invent or reveal private parameters.

5. **Integration with other skills**
   - Delegate any contract-level math checks to solidity-foundry-security.
   - For UI exposure of math (dials, conviction meters, etc.) use dopamine-ui-design-system.
   - Always route through madhatr-concierge for orchestration and gate enforcement.
   - Use multi-agent-swarm when a full auditor/challenger cycle is needed.

6. **Output Format for Math Work**
   - Start with “Proprietary gate status: [cleared for public set / gated]”
   - List only public constants used.
   - High-level properties and consistency findings.
   - Clear next actions or open questions for founder.
   - Never include equations, code snippets of formulas, or numeric parameters outside the public set.

## Resources

- references/canonical-numbers.md — the single source of locked public numbers + verification checklist.
- references/math-verification-checklist.md — step-by-step high-level audit steps against SESSION_HANDOFF and INTEGRATION_PLAN.
- references/safe-math-language.md — approved vocabulary for discussing DL-LMSR / Bayesian / GARCH without leaking.
- assets/ — public whitepaper math section excerpts (if any), public diagrams.
- scripts/ — helpers that only print public constants or run non-sensitive consistency greps (never compute proprietary formulas).

## Progressive Disclosure

SKILL.md stays under the public surface. Load references/ only after the gate is confirmed clear for the current request. For any deeper math the model must refuse and escalate to MADdegen.
