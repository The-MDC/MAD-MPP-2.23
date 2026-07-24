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

export function SkinProvider({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState<SkinName>(DEFAULT_SKIN);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isSkinName(stored)) setName(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setSkin = (n: SkinName) => {
    setName(n);
    try {
      localStorage.setItem(STORAGE_KEY, n);
    } catch {
      /* ignore */
    }
  };
  const toggle = () => setSkin(name === "neonNoir" ? "gilded" : "neonNoir");

  return <Ctx.Provider value={{ skin: SKINS[name], name, setSkin, toggle }}>{children}</Ctx.Provider>;
}

export function useSkin(): SkinCtx {
  const c = useContext(Ctx);
  if (c) return c;
  // Safe fallback when used outside a provider.
  return { skin: SKINS[DEFAULT_SKIN], name: DEFAULT_SKIN, setSkin: () => {}, toggle: () => {} };
}
