/**
 * MAD Gambit — /preview : the EARLIER, persisted hub theme (the look that ran
 * on the prior productions), retained on its own route so it stays reachable
 * after the new premiere theme took the /mpp2.23 slot. Single source of truth —
 * a re-export of the /gambit hub (the root `/` redirect target), not a copy —
 * so the two never drift.
 *
 * Route map:
 *   /            → redirect → /gambit   (earlier theme)
 *   /gambit      → earlier hub theme    (source of truth)
 *   /preview     → earlier hub theme    (this file, re-export)
 *   /mpp2.23     → NEW premiere 2.23 theme
 *   /MPP2.23     → redirect → /mpp2.23  (legacy uppercase bookmark)
 */
export { default } from "../gambit/page";
