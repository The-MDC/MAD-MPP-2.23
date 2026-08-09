# High-Level Math Verification Checklist

Use this for every “verify math” or consistency request. Stay strictly public-surface.

1. Confirm proprietary gate is clear (only public numbers requested).
2. Load SESSION_HANDOFF.md §1 and confirm the locked numbers match this skill’s canonical-numbers.md.
3. Check MAD_GAMBIT_INTEGRATION_PLAN.md and MADBIT_PRECISION_INTEGRATION_PLAN.md for any public drift.
4. Inspect verify/lib/gambit-game-math.ts PLATFORM / public constants only (never open private formula bodies).
5. Cross-check whitepaper math sections (Drive) for public consistency.
6. For GARCH / Bayesian / DL-LMSR: only discuss high-level properties and named components (volume-scaled α, conviction tree, etc.). No parameters.
7. Produce report:
   - Canonical Match: YES / NO
   - Drift Detected: [list]
   - Proprietary Gate Applied: YES / NO
   - Recommended Action: [update docs / escalate to founder / clear]
8. Never compute or output intermediate results that would reverse-engineer private formulas.
