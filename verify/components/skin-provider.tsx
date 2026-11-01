"use client";

/**
 * MAD Gambit — Skin (theme) context (Part Y). Persists the chosen skin in
 * localStorage; defaults to Neon Noir (= current INK look, no regression).
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { SKINS, DEFAULT_SKIN, isSkinName, type Skin, type SkinName } from "@/lib/skins";

interface SkinCtx {
  skin: Skin;
  name: SkinName;
  setSkin: (n: SkinName) => void;
  toggle: () => void;
}

const Ctx = createContext<SkinCtx | null>(null);
const STORAGE_KEY = "mg_skin";

/**
 * Uncontrolled (the /preview default): the provider owns the skin and persists
 * it to localStorage.
 *
 * Controlled (pass `value`): the host owns the skin and this provider simply
 * republishes it. That mode exists for /mpp2.23, which themes through
 * ThemeProvider/useTheme and has its own skin menu and its own storage key.
 * Without it, components written against useSkin() cannot follow that page's
 * theme at all. In controlled mode we deliberately do NOT read or write
 * STORAGE_KEY — the host's store is the single source of truth, and writing
 * here would let one page silently clobber the other's saved skin.
 */
export function SkinProvider({
  children,
  value,
  onChange,
}: {
  children: React.ReactNode;
  value?: SkinName;
  /** Controlled mode: forwarded instead of writing storage, so the host owns the change. */
  onChange?: (n: SkinName) => void;
}) {
  const controlled = value !== undefined;
  const [name, setName] = useState<SkinName>(DEFAULT_SKIN);

  useEffect(() => {
    if (controlled) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isSkinName(stored)) setName(stored);
    } catch {
      /* ignore */
    }
  }, [controlled]);

  const setSkin = (n: SkinName) => {
    if (controlled) { onChange?.(n); return; } // host owns it; forward the request, never write storage here
    setName(n);
    try {
      localStorage.setItem(STORAGE_KEY, n);
    } catch {
      /* ignore */
    }
  };

  const active = controlled ? value : name;
  const toggle = () => setSkin(active === "neonNoir" ? "gilded" : "neonNoir");

  return (
    <Ctx.Provider value={{ skin: SKINS[active], name: active, setSkin, toggle }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSkin(): SkinCtx {
  const c = useContext(Ctx);
  if (c) return c;
  // Safe fallback when used outside a provider.
  return { skin: SKINS[DEFAULT_SKIN], name: DEFAULT_SKIN, setSkin: () => {}, toggle: () => {} };
}
