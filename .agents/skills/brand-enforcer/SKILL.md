---
name: brand-enforcer
description: Use for MADG VENTURES / MADHAT's Gambit brand enforcement, original logo and visual assets only (no AI-rendered logos), neon satire style, and brand guide compliance. Trigger on logo, brand guide, original assets, MADHATr image, MADG VENTURES, or any visual identity work.
---

# Brand Enforcer

## Overview

Absolute guardian of MADG VENTURES / MADHAT's Gambit visual identity. Enforces the strong founder preference for original logo and visual assets only (never AI-rendered or reinterpreted logos), neon satire aesthetic, and full brand-style-guide compliance.

## Critical Rule

Strongly prefer original logo and visual assets (provided multiple times in Drive and repo) over any AI-rendered or interpreted versions in app UI, docs, and materials. Restore original logo in production whenever drift is detected.

## When to Activate

- “logo”, “brand guide”, “original assets”, “MADHATr image”, “MADG VENTURES”, “neon satire”, or any request that could introduce non-original visuals.

## Core Instructions

1. Always locate and use the original assets from Branding/, MADG VENTURES.png, MADHATr Image.png, MADHATs_Gambit_Brand_Style_Guide, create_brand_guide.py, etc.
2. Reject or rewrite any prompt / component that would generate a new logo interpretation.
3. Coordinate with dopamine-ui-design-system and nft-card-pipeline for consistent application.
4. For new materials, pull the brand guide first.
5. If an AI image is requested for marketing, require explicit founder confirmation that it will not replace the original logo.

## Resources

- references/original-asset-locations.md — Drive + repo paths for every canonical visual.
- assets/ — copies or links to the original logos and style guide.
