import { GambitProfile } from "./mpp-math";

export interface ServerGambit extends GambitProfile {
  glowColor: "gold" | "neon" | "pink";
  textColor: string;
  borderColorClass: string;
}

const INITIAL_GAMBITS: ServerGambit[] = [
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

// In-memory store for server-side persistence during runtime
let gambitStore: ServerGambit[] = [...INITIAL_GAMBITS];

export function getProfiles(): ServerGambit[] {
  return gambitStore;
}

export function resetProfiles(): ServerGambit[] {
  gambitStore = [...INITIAL_GAMBITS];
  return gambitStore;
}

export function addProfile(profile: Partial<ServerGambit>): { success: boolean; error?: string } {
  // Validate incoming JSON matching draft-07 specification constraints
  if (!profile.id || typeof profile.id !== "string" || !/^[a-z0-9_-]+$/.test(profile.id)) {
    return { success: false, error: "Invalid ID pattern (allowed: a-z, 0-9, _, -)" };
  }
  if (!profile.name || typeof profile.name !== "string" || profile.name.trim() === "") {
    return { success: false, error: "Invalid name field" };
  }
  if (!profile.codename || typeof profile.codename !== "string" || profile.codename.trim() === "") {
    return { success: false, error: "Invalid codename field" };
  }
  if (!profile.description || typeof profile.description !== "string") {
    return { success: false, error: "Invalid description field" };
  }
  if (typeof profile.alpha !== "number" || profile.alpha < 0.0 || profile.alpha > 1.0) {
    return { success: false, error: "Alpha must be a floating point number between 0.0 and 1.0" };
  }
  if (typeof profile.baseThreshold !== "number" || profile.baseThreshold < 1 || !Number.isInteger(profile.baseThreshold)) {
    return { success: false, error: "Base threshold must be an integer >= 1" };
  }
  if (typeof profile.currentStake !== "number" || profile.currentStake < 0.0) {
    return { success: false, error: "Current stake must be a positive number" };
  }

  // Determine design visual styles based on random generator or custom colors
  const colors: ("gold" | "neon" | "pink")[] = ["gold", "neon", "pink"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const resolvedColor = profile.glowColor || randomColor;

  const newGambit: ServerGambit = {
    id: profile.id,
    name: profile.name,
    codename: profile.codename,
    description: profile.description,
    alpha: profile.alpha,
    baseThreshold: profile.baseThreshold,
    currentStake: profile.currentStake,
    glowColor: resolvedColor,
    textColor: resolvedColor === "neon" ? "text-cyan-400" : resolvedColor === "gold" ? "text-amber-400" : "text-pink-500",
    borderColorClass: `border-glow-${resolvedColor}`
  };

  // Remove duplicate ID if it exists and add
  gambitStore = gambitStore.filter(g => g.id !== newGambit.id);
  gambitStore.push(newGambit);

  return { success: true };
}
