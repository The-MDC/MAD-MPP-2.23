---
name: dopamine-ui-design-system
description: Use for enforcing MAD Gambit dopamine UI design system, SKIN_TOKENS, DeviceFrame, Seiko hub, carousel, neurodiversity prefs, neon-glow satire, reduced-motion, no raw hex, and original logo only. Trigger on UI polish, design tokens, SKIN_TOKENS, DeviceFrame, dopamine carousel, theme, no raw hex, original logo, or any frontend visual work in verify/.
---

# Dopamine UI Design System

## Overview

Enforces the locked MAD Gambit visual language: three skins (HolographicGoldLaser / CyberOnyx / QuantumCobalt), DeviceFrame “phone on workbench” shell, Seiko-style hub, customizable dopamine carousel, neurodiversity preferences, neon-glow satire, reduced-motion support, and the absolute rule of original logo assets only + zero raw hex in new code.

## Proprietary / Brand Rules (Non-Negotiable)

- Original logo and visual assets only (never AI-rendered or re-interpreted logos). See brand-enforcer skill.
- No raw hex values in new or refactored components. Always use design tokens / CSS vars from SKIN_TOKENS and INK.
- Theme is global via ThemeProvider writing --mg-* CSS variables.
- Reduced-motion and neurodiversity prefs must be respected in every interactive element (carousel, dials, animations).

## When to Activate

- “UI polish”, “design tokens”, “SKIN_TOKENS”, “DeviceFrame”, “dopamine carousel”, “theme”, “no raw hex”, “original logo”, “neon-glow”, “reduced-motion”, “Seiko hub”, or any change to verify/components, theme-context, main-nav, or card presentation.

## Core Instructions

1. **Token Source of Truth**
   - Primary: verify/lib/gambit-design-tokens.ts (INK)
   - Skins: SKIN_TOKENS inside gambit-game-math.ts (or extracted)
   - ThemeProvider (verify/context/theme-context.tsx) writes all --mg-* vars on <html>
   - Body background must be var(--mg-bg)

2. **DeviceFrame Rules**
   - All primary UI lives inside DeviceFrame (phone shell).
   - On desktop .mg-device has transform → it is the containing block for position:fixed children (nav, overlays).
   - Never break the fixed-anchor relationship.
   - Parallax scroll layer (when added) must be reduced-motion aware.

3. **No-Raw-Hex Enforcement**
   - Grep for remaining hex debt (~339 open as of 2026-07-11 audit).
   - Replace every hard-coded color with the corresponding token or CSS var.
   - Prefer CSS variables over JS color objects for runtime theming.

4. **Neurodiversity & Accessibility**
   - Always honor prefers-reduced-motion.
   - Provide explicit user prefs for carousel speed, glow intensity, animation density.
   - High-contrast options via the three skins.
   - Keyboard and screen-reader paths for all dials / conviction meters / pack openers.

5. **Carousel & Dopamine Elements**
   - Customizable carousel (order, autoplay, pause on hover/focus).
   - Neon-glow satire treatment on hover / active states using tokens only.
   - Seiko hub as the command center aesthetic.

6. **Integration**
   - Coordinate with brand-enforcer for logo/asset swaps.
   - Use nft-card-pipeline for card presentation consistency.
   - Production checks via production-readiness-gate (screenshot-diff, etc.).
   - Route through madhatr-concierge for any user-facing visual change.

7. **Output**
   - Always show before/after token mapping.
   - Prefer CSS var diffs over large component rewrites.
   - Flag any remaining raw hex or non-original logo usage.

## Resources

- references/skin-tokens.md — public description of the three skins and CSS var names.
- references/device-frame-rules.md — layout and containing-block invariants.
- references/hex-debt-checklist.md — remaining debt and refactor order.
- assets/ — original logo files, brand style guide excerpts, theme mockups.
- scripts/ — token greps, hex-to-var codemods (safe).

## Progressive Disclosure

Load skin details and checklists only when actively polishing. Never invent new tokens; always extend the existing system.
