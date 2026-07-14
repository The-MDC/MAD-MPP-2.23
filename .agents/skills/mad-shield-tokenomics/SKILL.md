---
name: mad-shield-tokenomics
description: Use for MAD Shield opt-in loss mitigation, vaults, premiums, recovery share, and all related tokenomics. Strictly avoids insurance terminology. Trigger on MAD Shield, stop-loss, vault, shield premium, tokenomics, fee split, or any economic discussion of the 28.8% recovery share.
---

# MAD Shield Tokenomics

## Overview

Handles all language, economics, and implementation guidance around MAD Shield — the opt-in loss-mitigation feature with vaults, premiums (2–4%), and the locked 28.8% recovery share of platform fees. Enforces the absolute ban on “insurance” wording and keeps all numbers within the public canonical set.

## Critical Language Rule (from memory + project)

NEVER use the word “insurance”, “insure”, “insured”, or any insurance framing. Always say “opt-in loss mitigation”, “MAD Shield”, “shield premium”, “recovery share”, or “vault protection”. This is non-negotiable across docs, code, UI, whitepaper, and PR.

## Proprietary Gate

Exact premium formulas, vault accounting internals, and non-public parameters are gated. Public range (2–4%) and 28.8% recovery share are free to use.

## When to Activate

- “MAD Shield”, “stop-loss”, “vault”, “shield premium”, “tokenomics”, “fee split”, “recovery share”, “28.8%”, or any discussion of loss mitigation economics.

## Core Instructions

1. **Language Gate**
   - Scan every response for insurance terminology and rewrite immediately.
   - Preferred phrases: “opt-in MAD Shield protection”, “shield premium”, “recovery vault share”, “loss mitigation vault”.

2. **Public Economics Only**
   - Premium range: 2–4%
   - Recovery share of platform fee: 28.8%
   - Fee total: 1.88% with the locked 40/28.8/28.8 split
   - Never invent additional economic parameters.

3. **Vault & Contract Touchpoints**
   - MADShieldVault.sol (high-level)
   - Related staking and recovery paths
   - Always coordinate with solidity-foundry-security for any contract work and mad-gambit-math for consistency.

4. **UI & Docs**
   - All user-facing copy must pass the language gate.
   - Whitepaper / pitch / GTM materials go through whitepaper-pr-gtm after this skill.

5. **Output**
   - Start with “Language gate: clean / rewritten”
   - Restate only public numbers
   - Flag any residual insurance wording in existing files

## Resources

- references/language-gate.md — full list of forbidden vs preferred terms.
- references/public-economics.md — the 2–4% / 28.8% surface.
- assets/ — approved UI strings and whitepaper excerpts.

## Progressive Disclosure

Language gate is always loaded. Detailed vault mechanics stay gated.
