import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLATFORM_FEATURES, PLATFORM_TAB_KEYS } from "./platform-features";

// verify/lib → repo paths are resolved relative to this test file.
const here = path.dirname(fileURLToPath(import.meta.url));
const read = (rel: string) => readFileSync(path.join(here, "..", rel), "utf8");

describe("platform feature registry — both-theme parity guarantee", () => {
  it("exposes the canonical platform features, in order", () => {
    expect(PLATFORM_TAB_KEYS).toEqual([
      "floor",
      "saga",
      "arena",
      "packs",
      "portal",
      "casino",
      "logic",
    ]);
  });

  it("has unique keys and complete metadata for every feature", () => {
    expect(new Set(PLATFORM_TAB_KEYS).size).toBe(PLATFORM_TAB_KEYS.length);
    for (const f of PLATFORM_FEATURES) {
      expect(f.key).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.Icon).toBeTruthy();
      expect(f.blurb).toBeTruthy();
    }
  });

  // The guarantee: a feature added to the registry MUST surface in both themes.
  // Both entry points render from PLATFORM_FEATURES, so parity holds by
  // construction — these assertions fail CI if either stops consuming it (e.g.
  // someone hardcodes a tab list again), which is exactly the drift we prevent.
  it("the alternative hub theme (/mpp2.23) drives its tab bar from the registry", () => {
    const hub = read("app/mpp2.23/page.tsx");
    expect(hub).toMatch(/from "@\/lib\/platform-features"/);
    expect(hub).toMatch(/PLATFORM_FEATURES\.map/);
  });

  it("the premiere theme (/preview) surfaces the registry via PlatformExplorer", () => {
    const preview = read("app/preview/page.tsx");
    expect(preview).toMatch(/PlatformExplorer|platform-explorer/);

    const explorer = read("components/platform-explorer.tsx");
    expect(explorer).toMatch(/from "@\/lib\/platform-features"/);
    expect(explorer).toMatch(/PLATFORM_FEATURES\.map/);
  });
});
