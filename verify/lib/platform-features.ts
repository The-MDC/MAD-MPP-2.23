import {
  ShieldAlert,
  Layers,
  Trophy,
  Package,
  Ticket,
  Crown,
  Cpu,
  type LucideIcon,
} from "lucide-react";

/**
 * MAD Gambit — Platform Feature Registry (the both-theme guarantee).
 * ────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for the platform's feature set. Both themes render
 * their platform surface from this list, so a feature added here appears in
 * BOTH themes automatically and can't land in one and miss the other:
 *
 *   • /mpp2.23  (alternative hub theme)  — drives its 7-tab bar from PLATFORM_FEATURES.
 *   • /preview  (premiere theme)         — surfaces it via <PlatformExplorer/> (card grid)
 *                                          and mounts the modules via <ModuleShelf/>.
 *
 * To add a new platform feature: add ONE entry here (key + name + Icon + blurb,
 * plus `gated` if Golden-Hand-locked), then mount its panel in each theme's
 * content switch. The parity test (platform-features.test.ts) fails CI if either
 * theme stops consuming this registry.
 *
 * `key` doubles as the deep-link tab id: /mpp2.23?tab=<key>.
 */
export interface PlatformFeature {
  readonly key: string;
  readonly name: string;
  readonly Icon: LucideIcon;
  readonly blurb: string;
  /** Golden-Hand gated (Casino) — shown locked until the wallet holds a Golden Hand. */
  readonly gated?: boolean;
}

// `gated` is set on every entry (not just Casino) so that under `as const` the
// property exists on all union members — consumers can read `f.gated` freely.
export const PLATFORM_FEATURES = [
  { key: "floor", name: "The Floor", Icon: ShieldAlert, blurb: "Scandal Velocity · Prediction Circus · Z-Liar · Swap · Positions · Dopamine", gated: false },
  { key: "saga", name: "NFT Saga", Icon: Layers, blurb: "Card collection · evolution · saga episodes", gated: false },
  { key: "arena", name: "Arena", Icon: Trophy, blurb: "Named tournaments · Cull PvP", gated: false },
  { key: "packs", name: "Packs", Icon: Package, blurb: "Dutch auction · Golden Ticket pack opening", gated: false },
  { key: "portal", name: "Portal", Icon: Ticket, blurb: "Staking tiers · contribution connectors", gated: false },
  { key: "casino", name: "Casino", Icon: Crown, blurb: "Golden-Hand-gated provably-fair flip", gated: true },
  { key: "logic", name: "Logic", Icon: Cpu, blurb: "δ-limit · φ-shield · Futarchy · Bayesian tree · DAO sim", gated: false },
] as const satisfies readonly PlatformFeature[];

/** Union of every platform tab id — the canonical Tab type both themes share. */
export type PlatformTabKey = (typeof PLATFORM_FEATURES)[number]["key"];

/** Ordered list of tab ids, for deep-link validation. */
export const PLATFORM_TAB_KEYS: readonly PlatformTabKey[] = PLATFORM_FEATURES.map((f) => f.key);
