"use client";

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from "react";
import { 
  generateStochasticSeries, 
  StochasticDataPoint, 
  GambitProfile 
} from "../lib/mpp-math";

export interface Gambit extends GambitProfile {
  glowColor: "gold" | "neon" | "pink";
  textColor: string;
  borderColorClass: string;
}

export interface MppContextType {
  gambits: Gambit[];
  activeGambitId: string;
  setActiveGambitId: (id: string) => void;
  userMultiplier: number;
  setUserMultiplier: (val: number) => void;
  governanceWeight: number;
  setGovernanceWeight: (val: number) => void;
  simulatedEpochs: number;
  setSimulatedEpochs: (val: number) => void;
  visualMode: "conviction" | "mpp23" | "dual" | "blueprint";
  setVisualMode: (mode: "conviction" | "mpp23" | "dual" | "blueprint") => void;
  pricingSlope: number;
  setPricingSlope: (val: number) => void;
  bondingPriceFloor: number;
  setBondingPriceFloor: (val: number) => void;
  elasticity: number;
  setElasticity: (val: number) => void;
  activeCodeSample: "pricing" | "decay" | "slippage";
  setActiveCodeSample: (sample: "pricing" | "decay" | "slippage") => void;
  theme: "dark" | "neon";
  setTheme: (theme: "dark" | "neon") => void;
  
  // Computed values
  activeGambit: Gambit;
  convictionData: StochasticDataPoint[];
  maxMppPrice: number;
  triggerEpoch: number | null;

  // Local-to-Server Sync Emulation
  loading: boolean;
  serverOnline: boolean; // True as long as local client engine is running
  refetchProfiles: () => Promise<void>;
  ingestProfile: (profileJson: string) => Promise<{ success: boolean; message: string }>;
  resetServerProfiles: () => Promise<{ success: boolean; message: string }>;
  resetSimulation: () => void;
}

const MppContext = createContext<MppContextType | undefined>(undefined);

const INITIAL_GAMBITS: Gambit[] = [
  {
    id: "hyperion",
    name: "Hyperion Speed Run",
    codename: "ALPHA-01",
    description: "Arbitrage front-running telemetry on sub-second liquid index loops.",
    alpha: 0.15,
    baseThreshold: 680,
    currentStake: 1500,
    glowColor: "neon",
    textColor: "text-cyan-400",
    borderColorClass: "border-glow-neon"
  },
  {
    id: "chronos",
    name: "Chronos Yield Anchor",
    codename: "GOLD-02",
    description: "Temporal liquidity preservation algorithm leveraging custom epoch curve weights.",
    alpha: 0.08,
    baseThreshold: 820,
    currentStake: 3200,
    glowColor: "gold",
    textColor: "text-amber-400",
    borderColorClass: "border-glow-gold"
  },
  {
    id: "nemesis",
    name: "Nemesis Protocol",
    codename: "PINK-03",
    description: "High-exposure liquidity matrix balancing cross-chain flash hedges.",
    alpha: 0.22,
    baseThreshold: 510,
    currentStake: 850,
    glowColor: "pink",
    textColor: "text-pink-500",
    borderColorClass: "border-glow-pink"
  }
];

export function MppProvider({ children }: { children: React.ReactNode }) {
  const [gambits, setGambits] = useState<Gambit[]>(INITIAL_GAMBITS);
  const [activeGambitId, setActiveGambitId] = useState<string>("hyperion");
  const [userMultiplier, setUserMultiplier] = useState<number>(1.5);
  const [governanceWeight, setGovernanceWeight] = useState<number>(75);
  const [simulatedEpochs, setSimulatedEpochs] = useState<number>(30);
  const [visualMode, setVisualMode] = useState<"conviction" | "mpp23" | "dual" | "blueprint">("dual");
  const [pricingSlope, setPricingSlope] = useState<number>(0.85);
  const [bondingPriceFloor, setBondingPriceFloor] = useState<number>(120);
  const [elasticity, setElasticity] = useState<number>(4.5);
  const [activeCodeSample, setActiveCodeSample] = useState<"pricing" | "decay" | "slippage">("pricing");
  const [theme, setTheme] = useState<"dark" | "neon">("dark");

  // Telemetry indicators
  const [loading, setLoading] = useState<boolean>(false);
  const [serverOnline, setServerOnline] = useState<boolean>(true);

  // Initialize and load profiles from localStorage if available
  const refetchProfiles = useCallback(async () => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("mad_mpp_profiles");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setGambits(parsed);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load profiles from localStorage:", err);
      }
    }
    setGambits(INITIAL_GAMBITS);
  }, []);

  useEffect(() => {
    refetchProfiles();
  }, [refetchProfiles]);

  const activeGambit = useMemo(() => {
    return gambits.find((g) => g.id === activeGambitId) || gambits[0] || INITIAL_GAMBITS[0];
  }, [gambits, activeGambitId]);

  // Compute stochastic series dynamically using our shared math utility library
  const convictionData = useMemo(() => {
    return generateStochasticSeries({
      currentStake: activeGambit.currentStake,
      userMultiplier,
      alpha: activeGambit.alpha,
      baseThreshold: activeGambit.baseThreshold,
      governanceWeight,
      simulatedEpochs,
      bondingPriceFloor,
      pricingSlope,
      elasticity
    });
  }, [activeGambit, userMultiplier, governanceWeight, simulatedEpochs, bondingPriceFloor, pricingSlope, elasticity]);

  // Max price for scale normalizing in SVG
  const maxMppPrice = useMemo(() => {
    const vals = convictionData.map(d => d.mppPrice);
    return vals.length > 0 ? Math.max(...vals, 1) : 1;
  }, [convictionData]);

  // Trigger epoch
  const triggerEpoch = useMemo(() => {
    const epochItem = convictionData.find((d) => d.reached);
    return epochItem !== undefined ? epochItem.epoch : null;
  }, [convictionData]);

  // Simulate dynamic profile ingestion and validation client-side
  const ingestProfile = useCallback(async (profileJson: string) => {
    setLoading(true);
    // Add artificial delay to simulate advanced server-side matrix calculations
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);

    try {
      const item = JSON.parse(profileJson);

      // Extract and map standard Android SQLite Room properties
      const id = item.id || item.profileId;
      const name = item.name || item.profileName;
      const codename = item.codename || item.codeName || "CUSTOM";
      const description = item.description || item.desc || "Custom ingested profile";
      const alpha = Number(item.alpha ?? 0.15);
      const baseThreshold = Number(item.baseThreshold ?? 600);
      const currentStake = Number(item.currentStake ?? 1000);
      const glowColor = item.glowColor || "neon";

      // Validate matching draft-07 JSON Schema specifications exactly
      if (!id || typeof id !== "string" || !/^[a-z0-9_-]+$/.test(id)) {
        return { success: false, message: "Schema constraint failed: 'id' must match pattern '^[a-z0-9_-]+$'" };
      }
      if (!name || typeof name !== "string" || name.trim() === "") {
        return { success: false, message: "Schema constraint failed: 'name' is required and must be non-empty" };
      }
      if (typeof alpha !== "number" || alpha < 0.0 || alpha > 1.0) {
        return { success: false, message: "Schema constraint failed: 'alpha' must be double float between 0.0 and 1.0" };
      }
      if (typeof baseThreshold !== "number" || baseThreshold < 1 || !Number.isInteger(baseThreshold)) {
        return { success: false, message: "Schema constraint failed: 'baseThreshold' must be an integer >= 1" };
      }
      if (typeof currentStake !== "number" || currentStake < 0.0) {
        return { success: false, message: "Schema constraint failed: 'currentStake' must be double float >= 0.0" };
      }

      const colors: ("gold" | "neon" | "pink")[] = ["gold", "neon", "pink"];
      const resolvedColor = colors.includes(glowColor as any) ? glowColor : colors[Math.floor(Math.random() * colors.length)];

      const newGambit: Gambit = {
        id,
        name,
        codename,
        description,
        alpha,
        baseThreshold,
        currentStake,
        glowColor: resolvedColor as "gold" | "neon" | "pink",
        textColor: resolvedColor === "neon" ? "text-cyan-400" : resolvedColor === "gold" ? "text-amber-400" : "text-pink-500",
        borderColorClass: `border-glow-${resolvedColor}`
      };

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("mad_mpp_profiles");
        let list: Gambit[] = stored ? JSON.parse(stored) : [...INITIAL_GAMBITS];
        list = list.filter((g) => g.id !== newGambit.id);
        list.push(newGambit);
        localStorage.setItem("mad_mpp_profiles", JSON.stringify(list));
        setGambits(list);
        setActiveGambitId(newGambit.id);
      }

      return { success: true, message: `Successfully validated and ingested profile '${id}' into workspace storage!` };

    } catch (e: any) {
      return { success: false, message: `JSON Syntax error: ${e.message}` };
    }
  }, []);

  // Restore baseline state
  const resetServerProfiles = useCallback(async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setLoading(false);

    if (typeof window !== "undefined") {
      localStorage.removeItem("mad_mpp_profiles");
      setGambits(INITIAL_GAMBITS);
      setActiveGambitId("hyperion");
    }

    return { success: true, message: "Stochastic profiles list restored to default baseline config." };
  }, []);

  const resetSimulation = useCallback(() => {
    setUserMultiplier(1.5);
    setGovernanceWeight(75);
    setSimulatedEpochs(30);
    setPricingSlope(0.85);
    setBondingPriceFloor(120);
    setElasticity(4.5);
    setVisualMode("dual");
    resetServerProfiles();
  }, [resetServerProfiles]);

  // Simulate mathematical calibration trigger on parameter change
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(timer);
  }, [activeGambit, userMultiplier, governanceWeight, simulatedEpochs, bondingPriceFloor, pricingSlope, elasticity]);

  // Persistent Theme Load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("mad_simulation_theme");
      if (savedTheme === "dark" || savedTheme === "neon") {
        setTheme(savedTheme as "dark" | "neon");
      }
    }
  }, []);

  // Persistent Theme Save
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mad_simulation_theme", theme);
    }
  }, [theme]);

  return (
    <MppContext.Provider
      value={{
        gambits,
        activeGambitId,
        setActiveGambitId,
        userMultiplier,
        setUserMultiplier,
        governanceWeight,
        setGovernanceWeight,
        simulatedEpochs,
        setSimulatedEpochs,
        visualMode,
        setVisualMode,
        pricingSlope,
        setPricingSlope,
        bondingPriceFloor,
        setBondingPriceFloor,
        elasticity,
        setElasticity,
        activeCodeSample,
        setActiveCodeSample,
        theme,
        setTheme,
        activeGambit,
        convictionData,
        maxMppPrice,
        triggerEpoch,
        loading,
        serverOnline,
        refetchProfiles,
        ingestProfile,
        resetServerProfiles,
        resetSimulation
      }}
    >
      {children}
    </MppContext.Provider>
  );
}

export function useMpp() {
  const context = useContext(MppContext);
  if (context === undefined) {
    throw new Error("useMpp must be used within an MppProvider");
  }
  return context;
}
