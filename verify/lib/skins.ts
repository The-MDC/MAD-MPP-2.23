/**
 * MAD Gambit — dual-theme skin tokens (Part Y).
 *
 * Two selectable app skins. `neonNoir` deliberately mirrors the canonical INK
 * palette (gambit-design-tokens) so it is the DEFAULT and produces ZERO visual
 * change — the theme switch is purely additive. `gilded` is the alternate
 * Gilded Pop-Baroque look. Consumed via SkinProvider / useSkin().
 */
export type SkinName = "neonNoir" | "gilded";

export interface Skin {
  name: SkinName;
  label: string;
  bg: string;
  panel: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  gold: string;
  positive: string;
}

export const SKINS: Record<SkinName, Skin> = {
  // Mirrors INK — the current production look (default, no regression).
  neonNoir: {
    name: "neonNoir",
    label: "Neon Noir",
    bg: "#080a12",
    panel: "#0d1018",
    card: "#111520",
    border: "rgba(255,255,255,0.06)",
    text: "#f0f0f8",
    muted: "#6b7280",
    accent: "#00e5ff",
    accent2: "#ff007f",
    gold: "#ffd700",
    positive: "#00ff88",
  },
  // Gilded Pop-Baroque — velvet + gold leaf.
  gilded: {
    name: "gilded",
    label: "Gilded",
    bg: "#140f0a",
    panel: "#211810",
    card: "#2b2013",
    border: "rgba(255,215,0,0.14)",
    text: "#f6efdf",
    muted: "#a4906a",
    accent: "#ffd700",
    accent2: "#b8860b",
    gold: "#ffe27a",
    positive: "#6fbf7f",
  },
};

export const DEFAULT_SKIN: SkinName = "neonNoir";

export function isSkinName(v: unknown): v is SkinName {
  return v === "neonNoir" || v === "gilded";
}

/**
 * Bridge between the app's two theming systems.
 *
 * /mpp2.23 themes through ThemeProvider/useTheme with three ThemeSkins;
 * /preview themes through SkinProvider/useSkin with the two SkinNames above.
 * Components written against useSkin() can only follow the /mpp2.23 skin menu
 * if its skin is first projected onto this smaller space.
 *
 * The projection is lossy by construction — three onto two — so it is written
 * as an exhaustive Record rather than a lookup with a fallback. Adding a fourth
 * ThemeSkin then fails type-check here instead of silently resolving to the
 * default skin at runtime, which is the failure this map exists to prevent.
 */
export const THEME_SKIN_TO_SKIN_NAME: Record<
  "HolographicGoldLaser" | "CyberOnyx" | "QuantumCobalt",
  SkinName
> = {
  HolographicGoldLaser: "gilded", // gold-forward -> the gilded palette
  CyberOnyx: "neonNoir", // near-black ink
  QuantumCobalt: "neonNoir", // cool/dark; nearer neon noir than gilded
};
