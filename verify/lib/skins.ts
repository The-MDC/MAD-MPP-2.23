/**
 * MAD Gambit — dual-theme skin tokens (Part Y).
 *
 * Two selectable app skins. `neonNoir` deliberately mirrors the canonical INK
 * palette (gambit-design-tokens) so it is the DEFAULT and produces ZERO visual
 * change — the theme switch is purely additive. `gilded` is the alternate
 * Gilded Pop-Baroque look. Consumed via SkinProvider / useSkin().
 */
/**
 * Brand ramps shared by every surface (DOM, SVG and canvas can all read plain strings).
 * Gold is the bronze-yellow sampled from the Royal Vein rings and the MADHAT neon;
 * red is San Pellegrino #fc3437 with lighter/darker shades, the only red/pink in the app.
 * Mirrors --gold-* / --red-* in app/tokens.css.
 */
export const BRAND = {
  gold: { shadow: "#794816", deep: "#a86821", base: "#d69d41", hot: "#f6d378" },
  red: { tint: "#feebeb", light2: "#fd9a9b", light: "#fd6769", base: "#fc3437", dark: "#d62c2f", deeper: "#b02427", deepest: "#711719" },
  glow: { gold: "rgba(246,211,120,0.45)", red: "rgba(252,52,55,0.45)" },
} as const;

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
    border: "rgba(214,157,65,0.12)",
    text: "#f0f0f8",
    muted: "#8a93a3",
    accent: "#00e5ff",
    // MAD rossa — the brand tangerine orange-red (founder palette, 2026-10-26).
    accent2: "#f95639",
    gold: "#d69d41",
    positive: "#00ff88",
  },
  // Gilded Pop-Baroque — velvet + gold leaf.
  gilded: {
    name: "gilded",
    label: "Gilded",
    bg: "#140f0a",
    panel: "#211810",
    card: "#2b2013",
    border: "rgba(214,157,65,0.14)",
    text: "#f6efdf",
    muted: "#a4906a",
    accent: "#d69d41",
    accent2: "#a86821",
    gold: "#f6d378",
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
