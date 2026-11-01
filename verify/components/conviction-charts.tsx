"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  TrendingUp, 
  Zap, 
  Layers, 
  Flame, 
  Coins, 
  Cpu, 
  ShieldAlert, 
  X, 
  Sparkles, 
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingDown,
  Info,
  Code,
  ArrowRight,
  FileText,
  Battery,
  BatteryCharging,
  Wifi,
  Signal,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  Terminal,
  Power,
  Volume2,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  Smartphone,
  Copy,
  Download,
  Check
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { useMpp } from "@/context/mpp-context";
import { useWorkspace } from "@/context/workspace-context";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";

export default function ConvictionCharts() {
  // Pull from MPP Global Context
  const {
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
    ingestProfile,
    resetServerProfiles
  } = useMpp();

  // Pull from Workspace Global Context
  const {
    projectGoals,
    addGoal,
    toggleGoal,
    deleteGoal,
    showToast
  } = useWorkspace();

  // Android System Simulator States
  const [activeTab, setActiveTab] = useState<"simulator" | "gambits" | "ingest" | "blueprint">("simulator");
  const [appHistory, setAppHistory] = useState<string[]>(["simulator"]);
  const [showRecents, setShowRecents] = useState<boolean>(false);
  const [isScreenOn, setIsScreenOn] = useState<boolean>(true);
  const [batteryLevel, setBatteryLevel] = useState<number>(94);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [hapticFlash, setHapticFlash] = useState<boolean>(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(3); // 1-5 scale
  const [showPromptModal, setShowPromptModal] = useState<boolean>(false);
  const [promptCopied, setPromptCopied] = useState<boolean>(false);
  
  // Custom Workspace Goals Input
  const [newGoalTitle, setNewGoalTitle] = useState<string>("");
  const [newGoalCat, setNewGoalCat] = useState<"feature" | "chore" | "documentation" | "bugfix">("feature");

  // Console Telemetry Log Terminal state
  const [consoleLogs, setConsoleLogs] = useState<{ id: string; time: string; msg: string; type: "info" | "success" | "warn" | "error" }[]>([
    { id: "1", time: "09:12:00", msg: "HANDSHAKE: MAD-NET 5G carrier link established.", type: "info" },
    { id: "2", time: "09:12:01", msg: "CALIBRATION: MAD-MPP-2.23 stochastic engine online (Double Precision Float Mode).", type: "success" },
    { id: "3", time: "09:12:02", msg: "STORAGE: com.madgambit.app SQLite Room database mounted securely.", type: "info" },
    { id: "4", time: "09:12:03", msg: "AWAITING: Interactive simulation triggers...", type: "info" }
  ]);

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Helper helper to log actions to developer console
  const logAction = (msg: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const timeStr = new Date().toTimeString().split(" ")[0];
    setConsoleLogs((prev) => [
      ...prev,
      { id: Date.now() + Math.random().toString(), time: timeStr, msg, type }
    ]);
  };

  // Scroll to logs bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  // Handle Tab Switch inside Simulated App
  const handleTabSwitch = (tab: "simulator" | "gambits" | "ingest" | "blueprint") => {
    if (tab === activeTab) return;
    triggerHaptic();
    setActiveTab(tab);
    setAppHistory((prev) => [...prev, tab]);
    logAction(`Android System: Intent routed to com.madgambit.app.ui.screens.${tab.toUpperCase()}Screen`, "info");
  };

  // Android Back Key Trigger
  const handleAndroidBack = () => {
    triggerHaptic();
    if (showRecents) {
      setShowRecents(false);
      logAction("Android System: Recents panel closed.", "info");
      return;
    }
    if (appHistory.length > 1) {
      const updatedHistory = [...appHistory];
      updatedHistory.pop(); // Pop current tab
      const prevTab = updatedHistory[updatedHistory.length - 1] as "simulator" | "gambits" | "ingest" | "blueprint";
      setAppHistory(updatedHistory);
      setActiveTab(prevTab);
      logAction(`Android System: Back button triggered. Reverting to screen ${prevTab.toUpperCase()}`, "info");
    } else {
      logAction("Android System: Back button triggered. Already at root Simulator screen.", "warn");
      showToast("Already at home screen", "info", "MΛĐ GΛMBIT System");
    }
  };

  // Android Home Key Trigger
  const handleAndroidHome = () => {
    triggerHaptic();
    setShowRecents(false);
    if (activeTab !== "simulator") {
      setActiveTab("simulator");
      setAppHistory((prev) => [...prev, "simulator"]);
      logAction("Android System: Home button pressed. Routed to Simulator Screen.", "info");
    } else {
      logAction("Android System: Home button pressed. Already at root simulator activity.", "info");
    }
  };

  // Android Recents Key Trigger
  const handleAndroidRecents = () => {
    triggerHaptic();
    setShowRecents(!showRecents);
    logAction(`Android System: Recents (App Overview) ${!showRecents ? "opened" : "closed"}.`, "info");
  };

  // Simulated click feedback haptic pulse
  const triggerHaptic = () => {
    setHapticFlash(true);
    setTimeout(() => setHapticFlash(false), 120);
  };

  // Ingestion Text Input
  const [ingestInput, setIngestInput] = useState<string>(
    JSON.stringify({
      id: "renegade",
      name: "Renegade Frontrunner",
      codename: "ALPHA-99",
      description: "High-velocity momentum arbitrage optimized for sub-second trade triggers.",
      alpha: 0.18,
      baseThreshold: 600,
      currentStake: 1200
    }, null, 2)
  );
  const [ingestStatus, setIngestStatus] = useState<{ success: boolean | null; message: string | null }>({ success: null, message: null });
  const [ingesting, setIngesting] = useState<boolean>(false);

  // Stochastic Ticker States
  const [madPrice, setMadPrice] = useState(2.2345);
  const [madPriceChange, setMadPriceChange] = useState(12.43);
  const [tickerTick, setTickerTick] = useState(0);
  const [utcTime, setUtcTime] = useState("");
  const [recentTrades, setRecentTrades] = useState<{
    id: number;
    type: "BUY" | "SELL";
    qty: number;
    price: number;
    time: string;
  }[]>([
    { id: 1, type: "BUY", qty: 350, price: 2.2310, time: "09:12:05" },
    { id: 2, type: "SELL", qty: 120, price: 2.2340, time: "09:12:12" },
    { id: 3, type: "BUY", qty: 850, price: 2.2325, time: "09:12:22" },
    { id: 4, type: "BUY", qty: 410, price: 2.2345, time: "09:12:35" },
    { id: 5, type: "SELL", qty: 95, price: 2.2335, time: "09:12:44" },
  ]);

  const [madHistory, setMadHistory] = useState<number[]>([
    2.22, 2.225, 2.221, 2.23, 2.232, 2.229, 2.235, 2.234, 2.238, 2.235,
    2.241, 2.239, 2.236, 2.242, 2.24, 2.238, 2.245, 2.243, 2.241, 2.245
  ]);

  // Continuous Clock and Ticker Tick simulation
  useEffect(() => {
    const clockTimer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25));
    }, 1000);

    const priceTimer = setInterval(() => {
      // Fluctuate MAD price slightly
      const drift = (Math.random() - 0.495) * 0.0035; 
      setMadPrice((prev) => {
        const next = Math.max(1.8, prev + drift);
        setMadPriceChange((c) => c + (drift / prev) * 100);
        
        // Save price in history
        setMadHistory((h) => [...h.slice(1), parseFloat(next.toFixed(4))]);
        return parseFloat(next.toFixed(4));
      });

      // Random trade
      if (Math.random() > 0.45) {
        setRecentTrades((prev) => {
          const type = Math.random() > 0.5 ? "BUY" : "SELL";
          const qty = Math.floor(Math.random() * 750) + 75;
          const priceOffset = (Math.random() - 0.5) * 0.004;
          const tradePrice = parseFloat((madPrice + priceOffset).toFixed(4));
          const nowStr = new Date().toTimeString().split(" ")[0];
          return [
            { id: Date.now(), type, qty, price: tradePrice, time: nowStr },
            ...prev.slice(0, 4)
          ];
        });
      }

      setTickerTick((t) => t + 1);
    }, 1600);

    return () => {
      clearInterval(clockTimer);
      clearInterval(priceTimer);
    };
  }, [madPrice]);

  // Battery Drain/Charge Simulator
  useEffect(() => {
    const batteryTimer = setInterval(() => {
      setBatteryLevel((prev) => {
        if (isCharging) {
          if (prev >= 100) return 100;
          const next = prev + 1;
          logAction(`Power Supply: Charging loop... Current battery capacity at ${next}%`, "success");
          return next;
        } else {
          if (prev <= 2) return 2;
          const next = prev - 1;
          if (next === 15) {
            logAction("Android Warning: Low battery threshold. Plugging in is highly recommended.", "warn");
            showToast("Low Battery warning: 15% remaining", "warning", "Power System");
          }
          return next;
        }
      });
    }, 45000); // 45 seconds

    return () => clearInterval(batteryTimer);
  }, [isCharging, showToast]);

  // Listen for simulation reset events to output to terminal
  useEffect(() => {
    const handleReset = () => {
      logAction("WORKSPACE: Core stochastic simulation parameter matrices reset to default baseline.", "success");
      showToast("Simulation Parameters Reset", "success", "MΛĐ GΛMBIT System");
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mad-simulation-reset", handleReset);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mad-simulation-reset", handleReset);
      }
    };
  }, [showToast]);

  // Trigger volume buttons action
  const handleVolumeChange = (direction: "up" | "down") => {
    triggerHaptic();
    setVolumeLevel((prev) => {
      const next = direction === "up" ? Math.min(5, prev + 1) : Math.max(0, prev - 1);
      logAction(`Android System: Hardware Volume set to ${next}/5.`, "info");
      return next;
    });
  };

  // Trigger power button action
  const handlePowerButton = () => {
    triggerHaptic();
    setIsScreenOn(!isScreenOn);
    logAction(`Android Hardware: Power button pressed. Screen turning ${!isScreenOn ? "ON" : "OFF"}.`, !isScreenOn ? "success" : "warn");
  };

  // Trigger Random System Telemetry Event
  const triggerRandomEvent = () => {
    triggerHaptic();
    const mockEvents = [
      { msg: "TELEMETRY: Recalibrating continuous slippage elastic buffers...", type: "info" as const },
      { msg: "COMPILER: Android JVM (V8 Parity compiler) cleared obsolete cache records.", type: "success" as const },
      { msg: "SECURITY: Draft-07 JSON Validator loaded. Ingestion limits configured.", type: "info" as const },
      { msg: "STOCHASTIC: Drift variance factor detected within safe boundaries (+0.12).", type: "success" as const },
      { msg: "SYSTEM: Hardware core thermal levels within nominal standards (34.2 C).", type: "info" as const }
    ];
    const chosen = mockEvents[Math.floor(Math.random() * mockEvents.length)];
    logAction(chosen.msg, chosen.type);
    showToast("Telemetry Event Triggered", "info", "Diagnostics");
  };

  // Code samples collection for side-by-side mapping
  const codeSamples = useMemo(() => {
    return {
      pricing: {
        title: "Exponential Curve Pricing with elastic temporal penalty",
        desc: "Computes native continuous bonding curves matching Android Room layouts.",
        kotlin: `// Kotlin (MAD-MPP-2.23 Android App SDK)
fun calculateMppPrice(
    baseFloor: Double,
    conviction: Double,
    slope: Double,
    multiplier: Double,
    elasticity: Double,
    epoch: Int,
    maxEpochs: Int
): Double {
    val logScale = Math.log1p(conviction)
    val multiplierFactor = Math.pow(multiplier, 2.23)
    val penaltyIndex = elasticity / 100.0
    val ratio = if (maxEpochs > 0) epoch.toDouble() / maxEpochs else 0.0
    val cushion = Math.max(0.0, 1.0 - penaltyIndex * ratio)
    return baseFloor * (1.0 + slope * logScale) * multiplierFactor * cushion
}`,
        typescript: `// TypeScript (Node.js Isomorphic Engine)
export function calculateMppPrice(
  baseFloor: number,
  conviction: number,
  pricingSlope: number,
  userMultiplier: number,
  elasticityPercent: number,
  epoch: number,
  maxEpochs: number
): number {
  const logScale = Math.log1p(conviction);
  const multiplierFactor = Math.pow(userMultiplier, 2.23);
  const penaltyIndex = elasticityPercent / 100;
  const ratio = maxEpochs > 0 ? epoch / maxEpochs : 0;
  const cushion = Math.max(0, 1 - penaltyIndex * ratio);
  return baseFloor * (1 + pricingSlope * logScale) * multiplierFactor * cushion;
}`
      },
      decay: {
        title: "Continuous half-life conviction accrual",
        desc: "Accrues conviction voting power over simulated continuous intervals.",
        kotlin: `// Kotlin (MAD-MPP-2.23 Android App SDK)
fun calculateConviction(
    currentStake: Double,
    userMultiplier: Double,
    alpha: Double,
    epoch: Int
): Double {
    val maxCapacity = currentStake * userMultiplier
    return maxCapacity * (1.0 - Math.exp(-alpha * epoch))
}`,
        typescript: `// TypeScript (Node.js Isomorphic Engine)
export function calculateConviction(
  currentStake: number,
  userMultiplier: number,
  alpha: number,
  epoch: number
): number {
  const maxCapacity = currentStake * userMultiplier;
  return maxCapacity * (1 - Math.exp(-alpha * epoch));
}`
      },
      slippage: {
        title: "Stochastic micro-slippage protect index",
        desc: "Calculates temporal slippage buffers to secure transaction limits.",
        kotlin: `// Kotlin (MAD-MPP-2.23 Android App SDK)
fun calculateSlippageCushion(
    elasticityPercent: Double,
    epoch: Int,
    maxEpochs: Int
): Double {
    val penaltyIndex = elasticityPercent / 100.0
    val ratio = if (maxEpochs > 0) epoch.toDouble() / maxEpochs else 0.0
    return Math.max(0.0, 1.0 - penaltyIndex * ratio)
}`,
        typescript: `// TypeScript (Node.js Isomorphic Engine)
export function calculateSlippageCushion(
  elasticityPercent: number,
  epoch: number,
  maxEpochs: number
): number {
  const penaltyIndex = elasticityPercent / 100;
  const ratio = maxEpochs > 0 ? epoch / maxEpochs : 0;
  return Math.max(0, 1 - penaltyIndex * ratio);
}`
      }
    };
  }, []);

  // Compute math properties
  const zLiteValue = useMemo(() => {
    const alphaFactor = activeGambit.alpha * 100;
    const baseVal = (userMultiplier * 15) + (alphaFactor * 1.8) + (governanceWeight / 4) + (elasticity * 1.5);
    const wobble = Math.sin(tickerTick * 0.5) * 0.8;
    return Math.min(100, Math.max(0, baseVal + wobble));
  }, [userMultiplier, activeGambit.alpha, governanceWeight, elasticity, tickerTick]);

  const needleRotation = useMemo(() => {
    return (zLiteValue / 100) * 180 - 90;
  }, [zLiteValue]);

  // Sparkline builder
  const sparkPoints = useMemo(() => {
    const minHistory = Math.min(...madHistory);
    const maxHistory = Math.max(...madHistory);
    const range = maxHistory - minHistory || 0.0001;
    return madHistory.map((val, idx) => {
      const x = (idx / (madHistory.length - 1)) * 300;
      const y = 80 - ((val - minHistory) / range) * 60 - 10; 
      return `${x},${y}`;
    }).join(" ");
  }, [madHistory]);

  const mppPrice = useMemo(() => {
    if (convictionData && convictionData.length > 0) {
      return convictionData[convictionData.length - 1]?.mppPrice || 120.00;
    }
    return 120.00;
  }, [convictionData]);

  const driftData = useMemo(() => {
    const points = [];
    const alpha = activeGambit.alpha;
    for (let t = 0; t <= simulatedEpochs; t++) {
      const decayValue = Math.exp(-alpha * t);
      const growthValue = 1 - decayValue;
      points.push({
        epoch: t,
        "Decay Ratio": parseFloat(decayValue.toFixed(4)),
        "Growth Ratio": parseFloat(growthValue.toFixed(4)),
        "Drift Factor": parseFloat((decayValue * 100).toFixed(2)),
      });
    }
    return points;
  }, [activeGambit.alpha, simulatedEpochs]);

  // Handle Workspace Goals Submission
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    addGoal(newGoalTitle, "Dynamic roadmap target added via the Android Simulator terminal.", newGoalCat);
    logAction(`Workspace Manager: Added road goal "${newGoalTitle}" under category [${newGoalCat.toUpperCase()}]`, "success");
    showToast(`Goal Added: ${newGoalTitle}`, "success", "Roadmap");
    setNewGoalTitle("");
  };

  return (
    <div className="w-full flex flex-col items-center relative font-sans text-neutral-100 selection:bg-yellow-400 selection:text-black">
      
      {/* 1. TOP MARQUEE NYSE STYLE TICKER */}
      <div className="w-full bg-[#020202] border-b border-neutral-900 py-3 overflow-hidden select-none relative z-10 font-mono text-[11px] font-bold text-yellow-400/90 tracking-wide">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          .animate-ticker {
            display: flex;
            width: max-content;
            animation: marquee 40s linear infinite;
          }
          .animate-ticker:hover {
            animation-play-state: paused;
          }
        `}} />
        <div className="animate-ticker">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="flex items-center gap-12 pr-12 whitespace-nowrap">
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">MAD_STOCHASTIC</span>
                <span>${madPrice.toFixed(4)}</span>
                <span className={`text-xs ${madPriceChange >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {madPriceChange >= 0 ? "▲" : "▼"} {Math.abs(madPriceChange).toFixed(2)}%
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">MPP_CONTINUOUS</span>
                <span>${mppPrice.toFixed(2)}</span>
                <span className="text-emerald-400">▲ +2.23%</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">ACTIVE_STRATEGY</span>
                <span className="text-cyan-400 uppercase">{activeGambit.name}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">STAKE_MULTIPLIER</span>
                <span className="text-yellow-400 font-mono">{userMultiplier.toFixed(2)}x</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">Z-LITE_INDEX</span>
                <span className="text-pink-500 font-mono">{zLiteValue.toFixed(2)} ZL</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-neutral-500 font-normal">SIM_EPOCHS</span>
                <span className="text-neutral-300 font-mono">{simulatedEpochs} INTERVALS</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. DYNAMIC WORKSPACE HEADER GRID */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-neutral-900 pb-5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse border border-yellow-500/20" />
              <span className="font-extrabold tracking-widest text-white text-[15px] font-mono uppercase">
                MΛĐ GΛMBIT :: WORKBENCH
              </span>
              <span className="px-2 py-0.5 rounded text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 uppercase font-bold tracking-widest font-mono">
                v2.23 BETA
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-1 uppercase tracking-wider">
              com.madgambit.app • Android Native App Simulator & Developer Telemetry Portal
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Theme Toggle Switch */}
            <button
              onClick={() => {
                triggerHaptic();
                const nextTheme = theme === "dark" ? "neon" : "dark";
                setTheme(nextTheme);
                logAction(`System Theme: Switched style mode to ${nextTheme === "neon" ? "HIGH CONTRAST NEON" : "ULTRA DARK"}.`, "success");
                showToast(`Theme: ${nextTheme === "neon" ? "Neon Cyber" : "Ultra Dark"}`, "success", "Theme Manager");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase transition-all duration-300 cursor-pointer ${
                theme === "neon"
                  ? "bg-pink-500/15 border-pink-500 text-pink-400 shadow-[0_0_10px_rgba(252,52,55,0.25)] hover:bg-pink-500/25"
                  : "bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white"
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${theme === "neon" ? "text-pink-400 animate-pulse" : "text-neutral-500"}`} />
              <span>Theme: {theme === "neon" ? "NEON" : "DARK"}</span>
            </button>

            {/* Android AI Prompt Handoff Modal Trigger */}
            <button
              onClick={() => {
                triggerHaptic();
                setShowPromptModal(true);
                logAction("Android Handoff: Opened native Android prompt markdown portal.", "info");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-cyan-500/15 border border-amber-500/40 text-amber-300 hover:text-white text-[11px] font-bold uppercase transition-all duration-300 cursor-pointer shadow-[0_0_12px_rgba(234,179,8,0.15)] hover:border-amber-400"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>📥 Android Prompt MD</span>
            </button>

            {/* System sync stats */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-900 text-[11px]">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-neutral-400 font-bold uppercase">TELEMETRY LINKED</span>
            </div>
            
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-900 font-bold text-yellow-400 text-[11px]">
              <span className="text-[10px] text-neutral-500 font-normal">SYS_UTC</span>
              <span>{utcTime || "09:12:45"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. DUAL-COLUMN LAYOUT PANELS */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* ==================== LEFT COLUMN: ANDROID APP EMULATOR SHELL ==================== */}
          <div className="xl:col-span-7 flex flex-col items-center">
            
            {/* Mobile shell container */}
            <div className="relative flex flex-col items-center">
              
              {/* Outer decorative halo glow based on active strategy rarity */}
              <div className={`absolute -inset-2.5 rounded-[56px] blur-3xl opacity-15 pointer-events-none transition-all duration-500 ${
                activeGambit.id === "hyperion" ? "bg-cyan-400" : activeGambit.id === "chronos" ? "bg-yellow-400" : "bg-pink-500"
              }`} />

              {/* Hardware Buttons on the Bezels */}
              {/* 1. Volume Up button */}
              <button 
                onClick={() => handleVolumeChange("up")}
                title="Volume Up"
                className="absolute top-28 -left-4 w-1.5 h-12 rounded-l-md bg-neutral-800 border-l border-y border-neutral-700 hover:bg-neutral-600 transition-colors z-20"
              />
              {/* 2. Volume Down button */}
              <button 
                onClick={() => handleVolumeChange("down")}
                title="Volume Down"
                className="absolute top-44 -left-4 w-1.5 h-12 rounded-l-md bg-neutral-800 border-l border-y border-neutral-700 hover:bg-neutral-600 transition-colors z-20"
              />
              {/* 3. Power button */}
              <button 
                onClick={handlePowerButton}
                title="Power Button"
                className="absolute top-36 -right-4 w-1.5 h-16 rounded-r-md bg-neutral-800 border-r border-y border-neutral-700 hover:bg-neutral-600 transition-colors z-20 shadow-md"
              />

              {/* Android High Fidelity Device Frame */}
              <div className={`w-[390px] h-[780px] rounded-[50px] p-3.5 bg-neutral-900 border-[6px] border-neutral-800 relative z-10 transition-all duration-300 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden ${
                hapticFlash ? "ring-4 ring-yellow-400/50" : "ring-1 ring-neutral-750"
              }`}>
                
                {/* Physical Bezel inner detail */}
                <div className="absolute inset-0.5 rounded-[44px] border border-neutral-800 pointer-events-none z-30" />
                
                {/* Inner simulated screen container */}
                <div className="w-full h-full rounded-[38px] bg-black overflow-hidden relative flex flex-col justify-between select-none">
                  
                  {/* PUNCH-HOLE CAMERA NOTCH */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-neutral-950 border border-neutral-900 z-50 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-900/40" />
                  </div>

                  {/* SCREEN OFF OVERLAY */}
                  {!isScreenOn && (
                    <div className="absolute inset-0 bg-neutral-950 z-50 flex flex-col items-center justify-center p-6 text-center select-none font-mono">
                      <div className="w-10 h-10 rounded-full border border-neutral-800 flex items-center justify-center mb-4">
                        <Power className="w-4 h-4 text-neutral-600 animate-pulse" />
                      </div>
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">DEVICE STANDBY</h4>
                      <p className="text-[10px] text-neutral-700 mt-2 max-w-[200px]">
                        The MAD-MPP Android device is suspended. Press the side power key or tap here to wake.
                      </p>
                      <button 
                        onClick={() => setIsScreenOn(true)}
                        className="mt-6 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-850 rounded-lg text-[10px] text-neutral-400 border border-neutral-800 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        WAKE SCREEN
                      </button>
                    </div>
                  )}

                  {/* ================== ANDROID SYSTEM STATUS BAR ================== */}
                  <div className="h-9 px-6 bg-black flex items-center justify-between text-[11px] font-semibold text-neutral-300 relative z-40 select-none">
                    <div className="flex items-center gap-1.5 font-mono">
                      <span className="text-[10px]">09:12</span>
                      <span className="text-[8px] text-neutral-500">UTC</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-cyan-400/90 font-mono tracking-wider uppercase font-bold">MAD-NET</span>
                      <Signal className="w-3 h-3 text-neutral-300" />
                      <Wifi className="w-3 h-3 text-neutral-300" />
                      
                      {/* Battery Indicator with micro loading */}
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-mono text-neutral-400">{batteryLevel}%</span>
                        {isCharging ? (
                          <BatteryCharging className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        ) : (
                          <Battery className={`w-3.5 h-3.5 ${batteryLevel <= 15 ? "text-rose-500" : "text-neutral-300"}`} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ================== IN-APP TOOLBAR / APP HEADER ================== */}
                  <div className="px-5 py-2.5 bg-[#080808]/90 border-b border-neutral-900 flex items-center justify-between relative z-40">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                      <div>
                        <h1 className="text-xs font-black tracking-widest text-white uppercase font-mono leading-none">
                          MΛĐ GΛMBIT
                        </h1>
                        <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider block">
                          App Module: com.madgambit
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Active profile badge */}
                      <span className="px-1.5 py-0.5 rounded text-[8px] bg-neutral-900 text-cyan-400 border border-cyan-500/20 font-bold uppercase tracking-wider font-mono">
                        {activeGambit.codename}
                      </span>
                    </div>
                  </div>

                  {/* ================== SIMULATED INNER VIEWPORT CONTENT ================== */}
                  <div className="flex-1 bg-[#040404] overflow-y-auto overflow-x-hidden relative flex flex-col p-4 space-y-4 scrollbar-none pb-12">
                    
                    {/* APP OVERVIEW RECENTS MULTITASKING SHIELD */}
                    {showRecents ? (
                      <div className="absolute inset-0 bg-[#060606]/95 backdrop-blur-md z-40 p-4 flex flex-col justify-between overflow-y-auto">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                            <span className="text-[10px] font-mono uppercase text-neutral-400 font-bold tracking-wider">
                              Android Task Manager (4 Active)
                            </span>
                            <button 
                              onClick={() => setShowRecents(false)}
                              className="text-neutral-500 hover:text-white"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* 3D-feeling card list of the activities */}
                          <div className="space-y-3.5">
                            {[
                              { key: "simulator", title: "SimulatorActivity", desc: "Tension dial, spectrograph & curve plots", color: "text-cyan-400", border: "border-cyan-500/30" },
                              { key: "gambits", title: "GambitsActivity", desc: "MADHat's strategy deck cards game", color: "text-amber-400", border: "border-amber-500/30" },
                              { key: "ingest", title: "IngestionActivity", desc: "SQLite Room schema entity importer", color: "text-pink-500", border: "border-pink-500/30" },
                              { key: "blueprint", title: "BlueprintActivity", desc: "Kotlin-TS translation, scorecard & roadmap", color: "text-purple-400", border: "border-purple-500/30" },
                            ].map((appAct) => {
                              const isAppActive = activeTab === appAct.key;
                              return (
                                <div 
                                  key={appAct.key}
                                  onClick={() => {
                                    setActiveTab(appAct.key as any);
                                    setShowRecents(false);
                                    logAction(`Android System: Switched focus activity to com.madgambit.app.${appAct.title}`, "info");
                                  }}
                                  className={`p-3 rounded-xl bg-neutral-950 border text-left cursor-pointer transition-all hover:bg-neutral-900 relative ${
                                    isAppActive ? `ring-2 ring-yellow-400 ${appAct.border}` : "border-neutral-900"
                                  }`}
                                >
                                  {isAppActive && (
                                    <span className="absolute top-3 right-3 px-1 py-0.2 bg-yellow-400 text-black font-mono text-[7px] font-extrabold uppercase rounded">
                                      FOCUS
                                    </span>
                                  )}
                                  <span className={`text-[8px] font-mono font-bold tracking-wider uppercase block ${appAct.color}`}>
                                    com.madgambit.app.{appAct.title}
                                  </span>
                                  <h5 className="text-[11px] font-bold text-white mt-1">{appAct.title.replace("Activity", "")} Interface</h5>
                                  <p className="text-[9px] text-neutral-500 font-sans mt-0.5 leading-normal">{appAct.desc}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Button 
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setActiveTab("simulator");
                            setShowRecents(false);
                            logAction("Android System: Force reset to simulator activity screen.", "info");
                          }}
                          className="w-full text-[10px] font-mono tracking-widest uppercase py-2 h-8"
                        >
                          Reset Default Activity Stack
                        </Button>
                      </div>
                    ) : null}

                    {/* RENDER THE SELECTED ACTIVITY COMPOSABLE */}
                    {activeTab === "simulator" && (
                      /* ================= SCREEN A: SIMULATOR ACTIVITY ================= */
                      <div className="space-y-4 animate-fadeIn">
                        
                        {/* Analog Tension dial */}
                        <div className="p-4 rounded-2xl bg-[#090909] border border-neutral-900 flex flex-col items-center relative">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 font-bold mb-3.5">
                            ANALOG DECAY TENSION DIAL
                          </span>
                          
                          <div className="relative w-56 h-28 flex justify-center items-end overflow-hidden">
                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                              <defs>
                                <linearGradient id="phoneDialGrad" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#22d3ee" />
                                  <stop offset="50%" stopColor="#fbbf24" />
                                  <stop offset="100%" stopColor="#fc3437" />
                                </linearGradient>
                              </defs>
                              
                              <path 
                                d="M 25 100 A 75 75 0 0 1 175 100" 
                                fill="none" 
                                stroke="#161616" 
                                strokeWidth="10" 
                                strokeLinecap="round"
                              />
                              
                              <path 
                                d="M 25 100 A 75 75 0 0 1 175 100" 
                                fill="none" 
                                stroke="url(#phoneDialGrad)" 
                                strokeWidth="8" 
                                strokeLinecap="round"
                                strokeDasharray="235"
                                strokeDashoffset={235 - (zLiteValue / 100) * 235}
                                className="transition-all duration-500"
                              />
                            </svg>

                            {/* Animated Needle */}
                            <div 
                              style={{ 
                                transform: `rotate(${needleRotation}deg)`,
                                transformOrigin: "bottom center"
                              }}
                              className="absolute bottom-0 w-[2.5px] h-[72px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] rounded-full transition-transform duration-500 ease-out"
                            />
                          </div>

                          {/* LCD Display */}
                          <div className="mt-3 p-2 rounded-lg bg-black/80 border border-neutral-900 font-mono text-center w-full max-w-[200px]">
                            <div className="text-[8px] text-neutral-500 uppercase tracking-widest">COGNITION INDEX</div>
                            <div className="text-base font-extrabold tracking-tight text-white mt-0.5">
                              {zLiteValue.toFixed(2)} <span className="text-[10px] text-yellow-400">ZL</span>
                            </div>
                          </div>
                        </div>

                        {/* Equalizer Micro columns */}
                        <div className="p-3.5 rounded-2xl bg-[#090909] border border-neutral-900">
                          <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 font-bold block mb-2">
                            MICRO-TELEMETRY EQUALIZER
                          </span>
                          <div className="flex gap-1 items-end h-11 bg-black/40 p-1.5 rounded-lg border border-neutral-950">
                            {Array.from({ length: 14 }).map((_, i) => {
                              const baseHeight = Math.sin((tickerTick * 0.45) + i * 0.6) * 40 + 50;
                              const scaleFactor = zLiteValue / 100;
                              const height = Math.max(5, Math.min(100, baseHeight * scaleFactor + (Math.random() - 0.5) * 12));
                              
                              let barColor = "bg-cyan-500/80";
                              if (i > 10) barColor = "bg-pink-500/80";
                              else if (i > 6) barColor = "bg-yellow-400/80";
                              
                              return (
                                <div key={i} className="flex-1 flex flex-col justify-end h-full bg-neutral-950/50 rounded-sm overflow-hidden">
                                  <div 
                                    style={{ height: `${height}%` }}
                                    className={`w-full rounded-sm transition-all duration-300 ${barColor}`} 
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Interactive Sliders Form Area */}
                        <div className="p-4 rounded-2xl bg-[#090909] border border-neutral-900 space-y-3.5 text-xs text-neutral-300 select-text">
                          <div className="flex items-center gap-1.5 pb-1 border-b border-neutral-900 text-neutral-400">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="font-mono font-bold uppercase text-[9px] tracking-wider">Jetpack Sliders Composable</span>
                          </div>

                          {/* Multiplier */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium font-mono">1. User Multiplier</span>
                              <span className="font-mono font-bold text-yellow-400">{userMultiplier.toFixed(2)}x</span>
                            </div>
                            <input
                              type="range"
                              min="0.5"
                              max="4.0"
                              step="0.05"
                              value={userMultiplier}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setUserMultiplier(val);
                                logAction(`App Slider: User Staking Multiplier adjusted to ${val.toFixed(2)}x`, "info");
                              }}
                              className="w-full h-1 bg-neutral-950 rounded accent-yellow-400 cursor-pointer"
                            />
                          </div>

                          {/* Governance Weight */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium font-mono">2. Gov Weight (%)</span>
                              <span className="font-mono font-bold text-cyan-400">{governanceWeight}%</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="180"
                              step="5"
                              value={governanceWeight}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setGovernanceWeight(val);
                                logAction(`App Slider: Governance Weight set to ${val}%`, "info");
                              }}
                              className="w-full h-1 bg-neutral-950 rounded accent-cyan-400 cursor-pointer"
                            />
                          </div>

                          {/* Epochs */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[11px] font-medium font-mono">3. Epochs</span>
                              <span className="font-mono font-bold text-pink-500">{simulatedEpochs} Intervals</span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="120"
                              step="5"
                              value={simulatedEpochs}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setSimulatedEpochs(val);
                                logAction(`App Slider: Simulation Epochs interval length set to ${val}`, "info");
                              }}
                              className="w-full h-1 bg-neutral-950 rounded accent-pink-500 cursor-pointer"
                            />
                          </div>

                          {/* Mini pricing toggles collapsed under a nice outline */}
                          <div className="pt-2 border-t border-neutral-950 grid grid-cols-2 gap-3 text-[10px]">
                            <div className="space-y-0.5">
                              <span className="text-neutral-500 font-mono text-[8px] uppercase">BOND FLOOR</span>
                              <input 
                                type="number" 
                                value={bondingPriceFloor}
                                onChange={(e) => setBondingPriceFloor(Math.max(1, parseFloat(e.target.value) || 0))}
                                className="w-full bg-black border border-neutral-900 rounded p-1 text-white font-mono"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-neutral-500 font-mono text-[8px] uppercase">SLOPE FACTOR</span>
                              <input 
                                type="number" 
                                value={pricingSlope}
                                step="0.05"
                                onChange={(e) => setPricingSlope(Math.max(0.1, parseFloat(e.target.value) || 0))}
                                className="w-full bg-black border border-neutral-900 rounded p-1 text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Handcrafted curve plots inside Android device screen! */}
                        <div className="p-3.5 rounded-2xl bg-[#090909] border border-neutral-900 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 font-bold block">
                              STOCHASTIC PLOTTER VIEW
                            </span>
                            
                            {/* Inner App Chart selector tabs */}
                            <div className="flex gap-1 p-0.5 rounded bg-black text-[7px] font-mono border border-neutral-900">
                              {[
                                { key: "dual", label: "DUAL" },
                                { key: "conviction", label: "CONV" },
                                { key: "mpp23", label: "PRIC" }
                              ].map((tOpt) => (
                                <button
                                  key={tOpt.key}
                                  onClick={() => {
                                    triggerHaptic();
                                    setVisualMode(tOpt.key as any);
                                    logAction(`App Chart: Visualized mode toggled to ${tOpt.label} plot`, "info");
                                  }}
                                  className={`px-1 rounded uppercase cursor-pointer ${visualMode === tOpt.key ? "bg-yellow-400 text-black font-extrabold" : "text-neutral-400"}`}
                                >
                                  {tOpt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="relative w-full h-[150px] bg-black rounded-lg p-1.5 overflow-hidden border border-neutral-950">
                            <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                              <line x1="40" y1="40" x2="780" y2="40" stroke="#101010" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="40" y1="120" x2="780" y2="120" stroke="#101010" strokeWidth="1" strokeDasharray="3,3" />
                              <line x1="40" y1="200" x2="780" y2="200" stroke="#161616" strokeWidth="1" />

                              {/* Threshold */}
                              {visualMode !== "mpp23" && (() => {
                                const maxCapVal = activeGambit.currentStake * userMultiplier;
                                const threshVal = activeGambit.baseThreshold * (1 + governanceWeight / 200);
                                const yThresh = Math.max(40, Math.min(200, 200 - (threshVal / (maxCapVal || 1)) * 130));
                                return (
                                  <line x1="40" y1={yThresh} x2="780" y2={yThresh} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="5,4" />
                                );
                              })()}

                              {/* Conviction Curve */}
                              {(visualMode === "conviction" || visualMode === "dual") && (() => {
                                const points: string[] = [];
                                const w = 740;
                                const maxCapVal = activeGambit.currentStake * userMultiplier;
                                const threshVal = activeGambit.baseThreshold * (1 + governanceWeight / 200);

                                convictionData.forEach((d, idx) => {
                                  const x = 40 + (idx / simulatedEpochs) * w;
                                  const maxPossibleValue = Math.max(maxCapVal, threshVal * 1.2, 1);
                                  const y = 200 - (d.conviction / maxPossibleValue) * 140;
                                  points.push(`${x},${y}`);
                                });

                                const pathD = `M ${points.join(" L ")}`;
                                const strokeColor = activeGambit.id === "hyperion" ? "#22d3ee" : activeGambit.id === "chronos" ? "#fbbf24" : "#fc3437";
                                return <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" />;
                              })()}

                              {/* Price Curve */}
                              {(visualMode === "mpp23" || visualMode === "dual") && (() => {
                                const points: string[] = [];
                                const w = 740;

                                convictionData.forEach((d, idx) => {
                                  const x = 40 + (idx / simulatedEpochs) * w;
                                  const y = 200 - (d.mppPrice / maxMppPrice) * 140;
                                  points.push(`${x},${y}`);
                                });

                                const pathD = `M ${points.join(" L ")}`;
                                return <path d={pathD} fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray={visualMode === "dual" ? "3,3" : "none"} />;
                              })()}
                            </svg>
                          </div>
                        </div>

                      </div>
                    )}

                    {activeTab === "gambits" && (
                      /* ================= SCREEN B: GAMBITS ACTIVITY ================= */
                      <div className="space-y-4 animate-fadeIn select-text">
                        <div className="text-center pb-2 border-b border-neutral-900">
                          <h3 className="text-xs font-mono font-bold text-yellow-400 tracking-wider uppercase">
                            Strategy Card Decks
                          </h3>
                          <p className="text-[9px] text-neutral-500 font-sans mt-0.5">
                            Choose active protocol parameters to calibrate physical tension dials.
                          </p>
                        </div>

                        <div className="space-y-3">
                          {gambits.map((g) => {
                            const isChosen = g.id === activeGambitId;
                            return (
                              <div
                                key={g.id}
                                onClick={() => {
                                  triggerHaptic();
                                  setActiveGambitId(g.id);
                                  logAction(`App Strategy: Strategy profile swapped to ${g.name.toUpperCase()} (alpha=${g.alpha})`, "success");
                                  showToast(`Loaded ${g.codename}`, "success", "Combat Deck");
                                }}
                                className={`p-4 rounded-xl cursor-pointer text-left transition-all border relative ${
                                  isChosen 
                                    ? g.glowColor === "gold" ? "border-yellow-400 bg-yellow-500/5 shadow-[inset_0_0_8px_rgba(234,179,8,0.1)]"
                                      : g.glowColor === "neon" ? "border-cyan-400 bg-cyan-500/5 shadow-[inset_0_0_8px_rgba(34,211,238,0.1)]"
                                      : "border-pink-500 bg-pink-500/5 shadow-[inset_0_0_8px_rgba(252,52,55,0.1)]"
                                    : "border-neutral-900 bg-[#090909] hover:bg-neutral-900"
                                }`}
                              >
                                {isChosen && (
                                  <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                )}
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-mono uppercase bg-neutral-950 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-850">
                                    {g.codename}
                                  </span>
                                  <span className="text-[7px] font-mono text-neutral-500 uppercase tracking-widest font-black">
                                    {g.id === "hyperion" ? "LEGENDARY HFT" : g.id === "chronos" ? "MYTHIC YIELD" : "EPIC HEDGE"}
                                  </span>
                                </div>
                                <h4 className={`text-sm font-extrabold mt-1.5 ${g.textColor}`}>{g.name}</h4>
                                <p className="text-[10px] text-neutral-400 mt-1 leading-normal font-sans">{g.description}</p>
                                
                                <div className="mt-3.5 pt-2 border-t border-neutral-900/40 flex justify-between text-[10px] font-mono text-neutral-400">
                                  <span>Alpha: <span className="text-white font-bold">{(g.alpha).toFixed(2)}</span></span>
                                  <span>Base Stake: <span className="text-white font-bold">{g.currentStake} CP</span></span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {activeTab === "ingest" && (
                      /* ================= SCREEN C: INGESTION ACTIVITY ================= */
                      <div className="space-y-4 animate-fadeIn select-text">
                        <div className="text-center pb-2 border-b border-neutral-900">
                          <h3 className="text-xs font-mono font-bold text-pink-500 tracking-wider uppercase">
                            Ingestion Portal Composable
                          </h3>
                          <p className="text-[9px] text-neutral-500 mt-0.5 font-sans leading-normal">
                            Parse and validate legacy Android Room SQLite entities directly against Draft-07 JSON schema rules.
                          </p>
                        </div>

                        <div className="rounded-xl border border-neutral-900 bg-neutral-950 overflow-hidden flex flex-col">
                          <div className="bg-neutral-950 px-2.5 py-1 border-b border-neutral-900 flex justify-between text-[8px] font-mono text-neutral-400">
                            <span>PAYLOAD.JSON</span>
                            <span>com.madgambit.input</span>
                          </div>
                          <textarea
                            value={ingestInput}
                            onChange={(e) => setIngestInput(e.target.value)}
                            rows={6}
                            className="w-full p-2.5 bg-black text-cyan-400 font-mono text-[10px] focus:outline-none focus:ring-0 resize-none border-none leading-relaxed"
                            placeholder="Paste custom profile JSON..."
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              triggerHaptic();
                              setIngestInput(JSON.stringify({
                                profileId: "android_legacy_profile",
                                profileName: "Kotlin Room Legacy Import",
                                codeName: "LEGACY-X",
                                description: "Migrated Kotlin Room Entity object mapped dynamically to JSON schemas.",
                                alpha: 0.12,
                                baseThreshold: 750,
                                currentStake: 2200
                              }, null, 2));
                              setIngestStatus({ success: null, message: null });
                              logAction("App Ingestion: Loaded legacy Room Entity preset payload.", "info");
                            }}
                            className="text-[9px] font-mono"
                          >
                            Legacy Entity Preset
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={async () => {
                              triggerHaptic();
                              setIngesting(true);
                              const res = await resetServerProfiles();
                              setIngesting(false);
                              if (res.success) {
                                setIngestStatus({ success: true, message: res.message });
                                logAction("App Ingestion: Triggered database wipe, resetting to baseline.", "success");
                              } else {
                                setIngestStatus({ success: false, message: res.message });
                              }
                            }}
                            className="text-[9px] font-mono border-rose-950 hover:bg-rose-950/20 text-rose-400"
                          >
                            Reset Room DB
                          </Button>
                        </div>

                        <Button
                          size="xs"
                          variant="gold"
                          onClick={async () => {
                            triggerHaptic();
                            try {
                              setIngesting(true);
                              setIngestStatus({ success: null, message: null });
                              const res = await ingestProfile(ingestInput);
                              setIngesting(false);
                              if (res.success) {
                                setIngestStatus({ success: true, message: res.message });
                                logAction(`App Ingestion: Validation succeeded! Registered profile id: ${JSON.parse(ingestInput).id || "imported"}`, "success");
                                showToast("Room Entity Ingested", "success", "Database");
                              } else {
                                setIngestStatus({ success: false, message: res.message });
                                logAction(`App Ingestion Failed: ${res.message}`, "error");
                                showToast("Ingestion rejected", "error", "Validator");
                              }
                            } catch (e: any) {
                              setIngesting(false);
                              setIngestStatus({ success: false, message: e.message || "Invalid JSON syntax" });
                              logAction("App Ingestion: Rejected on syntax compile error", "error");
                            }
                          }}
                          className="w-full text-[10px] font-mono py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold h-8 uppercase tracking-wider mt-1.5 shadow-md"
                          disabled={ingesting}
                        >
                          {ingesting ? "VALIDATING..." : "VALIDATE & INGEST PAYLOAD"}
                        </Button>

                        {/* Status bar */}
                        {ingestStatus.success !== null && (
                          <div className={`p-2 rounded-lg border text-[10px] font-mono ${
                            ingestStatus.success ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                          }`}>
                            <div className="font-bold uppercase tracking-wider">{ingestStatus.success ? "SUCCESS" : "VALIDATION FAILED"}</div>
                            <p className="text-[9px] mt-0.5 leading-relaxed">{ingestStatus.message}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "blueprint" && (
                      /* ================= SCREEN D: BLUEPRINT ACTIVITY ================= */
                      <div className="space-y-4 animate-fadeIn select-text scrollbar-none max-h-[480px] overflow-y-auto">
                        <div className="text-center pb-2 border-b border-neutral-900">
                          <h3 className="text-xs font-mono font-bold text-purple-400 tracking-wider uppercase">
                            Architectural Blueprint
                          </h3>
                          <p className="text-[9px] text-neutral-500 font-sans mt-0.5 leading-normal">
                            Educational matrix detailing Kotlin Android to isomorphic Node.js conversion limits.
                          </p>
                        </div>

                        {/* Target Scorecard */}
                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2 font-mono text-[9px]">
                          <span className="text-neutral-500 uppercase tracking-widest block font-bold">V8 Parity Benchmarks</span>
                          <div className="grid grid-cols-2 gap-2 border-t border-neutral-900 pt-2 text-neutral-400 leading-normal">
                            <div>
                              <span>UI Interactivity:</span>
                              <span className="text-cyan-400 block font-bold uppercase">NodeJS WIN (0ms local)</span>
                            </div>
                            <div>
                              <span>Math precision:</span>
                              <span className="text-emerald-400 block font-bold uppercase">IEE Double EQUIV</span>
                            </div>
                          </div>
                        </div>

                        {/* Code translator selector */}
                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2 text-[10px]">
                          <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
                            <span className="font-mono text-[8px] text-neutral-500 uppercase font-bold">Live Compiler parity</span>
                            <div className="flex gap-1">
                              {(["pricing", "decay"] as const).map((tCode) => (
                                <button
                                  key={tCode}
                                  onClick={() => {
                                    triggerHaptic();
                                    setActiveCodeSample(tCode);
                                    logAction(`App Blueprint: Toggled code translator source to ${tCode.toUpperCase()}`, "info");
                                  }}
                                  className={`px-1 rounded text-[8px] font-mono cursor-pointer ${activeCodeSample === tCode ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold" : "text-neutral-500 hover:text-neutral-300"}`}
                                >
                                  {tCode.toUpperCase()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <h5 className="font-bold text-white text-[11px] font-sans mt-1">{codeSamples[activeCodeSample].title}</h5>
                          <pre className="text-[8px] p-2 bg-black rounded border border-neutral-950 text-slate-400 max-h-[100px] overflow-y-auto font-mono select-all leading-normal">
                            {codeSamples[activeCodeSample].typescript}
                          </pre>
                        </div>

                        {/* Conversion Roadmap steps minimized */}
                        <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-2">
                          <span className="text-[8px] font-mono text-neutral-500 uppercase font-bold block">
                            6-Phase Migration Steps
                          </span>
                          <div className="space-y-2 text-[10px] font-mono text-neutral-400">
                            <div className="flex gap-2 items-start">
                              <span className="px-1 py-0.2 bg-purple-950 text-purple-400 font-bold rounded text-[8px]">PH1</span>
                              <span>Configure workspace App Router & Tailwind.</span>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="px-1 py-0.2 bg-purple-950 text-purple-400 font-bold rounded text-[8px]">PH2</span>
                              <span>Translate com.madgambit.app.math formulas.</span>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="px-1 py-0.2 bg-purple-950 text-purple-400 font-bold rounded text-[8px]">PH3</span>
                              <span>Setup package matching bounds on NodeJS paths.</span>
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* ================== ANDROID APP BOTTOM NAVIGATION DOCK ================== */}
                  <div className="absolute bottom-6 left-0 right-0 h-12 bg-[#060606]/95 border-t border-neutral-900/60 grid grid-cols-4 items-center px-2 z-40">
                    {[
                      { key: "simulator", label: "Simulate", icon: SlidersHorizontal },
                      { key: "gambits", label: "Decks", icon: Coins },
                      { key: "ingest", label: "Ingest", icon: FileText },
                      { key: "blueprint", label: "Manual", icon: BookOpenIcon }
                    ].map((btn) => {
                      const isTabActive = activeTab === btn.key;
                      const IconComp = btn.icon;
                      return (
                        <button
                          key={btn.key}
                          onClick={() => handleTabSwitch(btn.key as any)}
                          className={`flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer relative ${
                            isTabActive ? "text-yellow-400 font-bold" : "text-neutral-500 hover:text-neutral-300"
                          }`}
                        >
                          {isTabActive && (
                            <span className="absolute top-0 w-8 h-0.5 bg-yellow-400 rounded-full" />
                          )}
                          <IconComp className={`w-4 h-4 ${isTabActive ? "text-yellow-400 animate-pulse" : "text-neutral-500"}`} />
                          <span className="text-[8px] font-mono tracking-wide uppercase">{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ================== ANDROID HARDWARE SOFTWARE NAVIGATION KEYS ================== */}
                  <div className="h-6 w-full bg-black/95 flex items-center justify-around px-8 border-t border-neutral-950 relative z-40 select-none pb-1">
                    {/* 1. Back button */}
                    <button 
                      onClick={handleAndroidBack}
                      title="Android Back"
                      className="text-neutral-500 hover:text-neutral-300 px-3 cursor-pointer"
                    >
                      <span className="text-[12px] font-mono">◀</span>
                    </button>
                    {/* 2. Home button */}
                    <button 
                      onClick={handleAndroidHome}
                      title="Android Home"
                      className="text-neutral-500 hover:text-neutral-300 px-3 cursor-pointer"
                    >
                      <span className="text-[11px] font-mono">●</span>
                    </button>
                    {/* 3. Recents button */}
                    <button 
                      onClick={handleAndroidRecents}
                      title="Android Recents"
                      className="text-neutral-500 hover:text-neutral-300 px-3 cursor-pointer"
                    >
                      <span className="text-[10px] font-mono">■</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Plug loop utility to trigger battery charge */}
              <div className="mt-4 flex gap-3 text-xs font-mono justify-center items-center z-20 relative">
                <span className="text-neutral-500">USB-C Power:</span>
                <button
                  onClick={() => {
                    triggerHaptic();
                    setIsCharging(!isCharging);
                    logAction(`Power Supply: USB-C cable ${!isCharging ? "CONNECTED" : "DISCONNECTED"}.`, !isCharging ? "success" : "warn");
                    showToast(!isCharging ? "AC Adapter Connected" : "Charger Unplugged", "info", "Power Link");
                  }}
                  className={`px-3 py-1 rounded border uppercase text-[10px] font-bold tracking-wider cursor-pointer ${
                    isCharging 
                      ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20" 
                      : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white"
                  }`}
                >
                  {isCharging ? "Unplug USB-C" : "Connect Charger"}
                </button>
              </div>

            </div>

          </div>
          
          {/* ==================== RIGHT COLUMN: DEVELOPER TELEMETRY & WORKSPACE MONITOR ==================== */}
          <div className="xl:col-span-5 space-y-6">
            
            {/* PANEL 4: REAL-TIME DRIFT MONITOR */}
            <div className={`p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
              theme === "neon"
                ? "bg-black border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)] text-cyan-300"
                : "bg-gradient-to-b from-neutral-950 to-neutral-900 border-[1.15px] border-neutral-850 text-neutral-100"
            }`}>
              <div className="absolute inset-0 bg-[radial-gradient(#151515_1px,transparent_1px)] [background-size:12px_12px] opacity-30 pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className={`w-4 h-4 ${theme === "neon" ? "text-cyan-400" : "text-yellow-400"}`} />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-bold">
                      Real-Time Drift Calibration
                    </span>
                  </div>
                  <span className="text-[8px] font-mono uppercase bg-neutral-900/80 px-2 py-0.5 rounded text-neutral-400 border border-neutral-800">
                    alpha = {activeGambit.alpha}
                  </span>
                </div>

                <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                  Stochastic matrix visualization of continuous temporal decay curves. Plotting exponential drift factors (e^-(&alpha; &bull; t)) versus conviction progress against simulated intervals.
                </p>

                {/* Recharts Container */}
                <div className="w-full h-48 mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={driftData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid stroke={theme === "neon" ? "#1e1e2f" : "#161616"} strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="epoch" 
                        stroke="#525252" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#525252" 
                        fontSize={8} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000000",
                          border: theme === "neon" ? "1px solid #06b6d4" : "1px solid #1f1f1f",
                          borderRadius: "8px",
                          fontSize: "9px",
                          color: "#ffffff",
                          fontFamily: "monospace",
                        }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={24} 
                        iconSize={8}
                        wrapperStyle={{ fontSize: "8px", fontFamily: "monospace" }} 
                      />
                      <Line 
                        name="Temporal Decay Factor" 
                        type="monotone" 
                        dataKey="Decay Ratio" 
                        stroke={activeGambit.id === "hyperion" ? "#06b6d4" : activeGambit.id === "chronos" ? "#eab308" : "#fc3437"} 
                        strokeWidth={2} 
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line 
                        name="Conviction Growth Ratio" 
                        type="monotone" 
                        dataKey="Growth Ratio" 
                        stroke="#64748b" 
                        strokeWidth={1.5} 
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500 pt-2 border-t border-neutral-900/60">
                  <span>CURVE TYPE: CONTINUOUS</span>
                  <span className="text-neutral-400 font-bold uppercase">{activeGambit.name}</span>
                </div>
              </div>
            </div>

            {/* PANEL 1: SYSTEM LOG TELEMETRY TERMINAL */}
            <div className={`p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
              theme === "neon"
                ? "bg-black border-2 border-pink-500 shadow-[0_0_12px_rgba(252,52,55,0.3)]"
                : "bg-gradient-to-b from-neutral-950 to-neutral-900 border-[1.15px] border-neutral-850"
            }`}>
              <div className="absolute inset-0 bg-[radial-gradient(#151515_1px,transparent_1px)] [background-size:12px_12px] opacity-30 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-bold">
                      System Telemetry Terminal Logs
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setConsoleLogs([]);
                        showToast("Console logs flushed", "info", "Logs Cleaner");
                      }}
                      className="text-[9px] font-mono text-neutral-500 hover:text-neutral-300 uppercase underline cursor-pointer"
                    >
                      Flush Logs
                    </button>
                    <span className="text-neutral-800">|</span>
                    <button
                      onClick={triggerRandomEvent}
                      className="text-[9px] font-mono text-yellow-500 hover:text-yellow-400 uppercase font-bold cursor-pointer"
                    >
                      Inject Event
                    </button>
                  </div>
                </div>

                {/* Simulated CLI list */}
                <div className="bg-black/90 rounded-xl p-4 border border-neutral-950 h-56 overflow-y-auto font-mono text-[10.5px] leading-relaxed space-y-2 scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-transparent">
                  {consoleLogs.length === 0 ? (
                    <div className="text-neutral-600 italic">Terminal is silent. Adjust Android controls or inject events to stream logs...</div>
                  ) : (
                    consoleLogs.map((log) => {
                      let logColor = "text-neutral-400";
                      let badgeColor = "bg-neutral-900 text-neutral-500";
                      if (log.type === "success") {
                        logColor = "text-emerald-400 font-medium";
                        badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                      } else if (log.type === "warn") {
                        logColor = "text-amber-400 font-medium";
                        badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                      } else if (log.type === "error") {
                        logColor = "text-rose-400 font-bold";
                        badgeColor = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                      }
                      return (
                        <div key={log.id} className="flex items-start gap-2 select-text">
                          <span className="text-neutral-600 flex-shrink-0">[{log.time}]</span>
                          <span className={`px-1 rounded text-[8px] font-mono leading-normal flex-shrink-0 ${badgeColor}`}>
                            {log.type.toUpperCase()}
                          </span>
                          <span className={logColor}>{log.msg}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>

            {/* PANEL 2: WORKSPACE ROADMAP GOALS MANAGER */}
            <div className={`p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
              theme === "neon"
                ? "bg-black border-2 border-pink-500 shadow-[0_0_12px_rgba(252,52,55,0.3)]"
                : "bg-gradient-to-b from-neutral-950 to-neutral-900 border-[1.15px] border-neutral-850"
            }`}>
              <div className="absolute inset-0 bg-[radial-gradient(#151515_1px,transparent_1px)] [background-size:12px_12px] opacity-30 pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 animate-pulse" />
                    <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-bold">
                      Workspace Project Roadmap Goals
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-900 uppercase">
                    Sync Enabled
                  </span>
                </div>

                {/* Submitting custom tasks to context */}
                <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="Describe custom goal task..."
                    className="sm:col-span-8 bg-black/80 border border-neutral-900 text-xs px-2.5 py-1.5 rounded-lg text-white font-mono placeholder:text-neutral-600 focus:outline-none focus:ring-0"
                  />
                  
                  <select
                    value={newGoalCat}
                    onChange={(e: any) => setNewGoalCat(e.target.value)}
                    className="sm:col-span-3 bg-black/80 border border-neutral-900 text-[10px] px-1 py-1 rounded-lg text-yellow-400 font-mono focus:outline-none"
                  >
                    <option value="feature">FEATURE</option>
                    <option value="chore">CHORE</option>
                    <option value="bugfix">BUGFIX</option>
                    <option value="documentation">DOCS</option>
                  </select>

                  <button
                    type="submit"
                    className="sm:col-span-1 h-8 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-extrabold flex items-center justify-center rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {/* Active Goals checklist from context */}
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-transparent">
                  {projectGoals.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 italic font-sans text-center py-4">No active tasks. Create custom goals above.</p>
                  ) : (
                    projectGoals.map((goal) => {
                      const isDone = goal.status === "completed";
                      return (
                        <div 
                          key={goal.id} 
                          className={`p-3 rounded-xl bg-black border flex items-start gap-3 justify-between transition-colors ${
                            isDone ? "border-green-950/40 bg-green-950/2" : "border-neutral-900 hover:bg-neutral-950/40"
                          }`}
                        >
                          <div className="flex gap-2.5 items-start">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => {
                                triggerHaptic();
                                toggleGoal(goal.id);
                                logAction(`Workspace Manager: Toggled goal "${goal.title}" to ${!isDone ? "completed" : "pending"}`, !isDone ? "success" : "warn");
                                showToast(isDone ? "Goal reactivated" : "Goal completed!", "success", "Roadmap");
                              }}
                              className="mt-0.5 rounded border-neutral-800 text-yellow-400 focus:ring-0 cursor-pointer bg-neutral-950"
                            />
                            <div className="space-y-0.5 select-text">
                              <span className={`text-[11px] block ${isDone ? "text-neutral-500 line-through" : "text-white font-medium"}`}>
                                {goal.title}
                              </span>
                              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider block">
                                Category: {goal.category} • {new Date(goal.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              triggerHaptic();
                              deleteGoal(goal.id);
                              logAction(`Workspace Manager: Deleted goal "${goal.title}"`, "warn");
                              showToast("Goal removed", "info", "Roadmap");
                            }}
                            className="text-neutral-600 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* PANEL 3: REAL-TIME TRANSACTION FEED & MARKET STATISTICS */}
            <div className={`p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between select-none transition-all duration-500 ${
              theme === "neon"
                ? "bg-black border-2 border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                : "bg-gradient-to-b from-neutral-950 to-neutral-900 border-[1.15px] border-neutral-850"
            }`}>
              <div className="absolute inset-0 bg-[radial-gradient(#151515_1px,transparent_1px)] [background-size:12px_12px] opacity-30 pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 font-bold">
                    Real-time Transaction Feed
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-extrabold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE TELEMETRY FEED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* REAL-TIME SPARKLINE SVG */}
                  <div className="bg-black/80 rounded-xl p-3 border border-neutral-950 h-24 flex flex-col justify-between">
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest block font-bold">Real-time Drift</span>
                    <div className="h-11 w-full mt-2">
                      <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="madSparkGradPhone" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon 
                          points={`${sparkPoints} 300,80 0,80`}
                          fill="url(#madSparkGradPhone)"
                        />
                        <polyline
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1.5"
                          points={sparkPoints}
                        />
                      </svg>
                    </div>
                  </div>

                  {/* QUICK ORDER BOOK */}
                  <div className="bg-black/80 rounded-xl p-3 border border-neutral-950 h-24 overflow-hidden flex flex-col justify-between">
                    <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest block font-bold mb-1">Recent Transactions</span>
                    <div className="space-y-1 font-mono text-[9px] mt-1.5">
                      {recentTrades.slice(0, 3).map((trade) => (
                        <div key={trade.id} className="flex justify-between items-center text-neutral-400">
                          <span className={trade.type === "BUY" ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                            {trade.type} {trade.qty} MAD
                          </span>
                          <span>${trade.price.toFixed(4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stochastic telemetry overview */}
                <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl text-[10px] font-mono text-neutral-400 space-y-1 select-text">
                  <div className="flex justify-between">
                    <span>Base Floor:</span>
                    <span className="text-white font-bold">${bondingPriceFloor} USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pricing Slope:</span>
                    <span className="text-white font-bold">{pricingSlope}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Elasticity Factor:</span>
                    <span className="text-rose-400 font-bold">-{elasticity.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ANDROID AI PROMPT HANDOFF MODAL */}
      {showPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`relative w-full max-w-3xl p-6 rounded-2xl border flex flex-col max-h-[85vh] shadow-2xl overflow-hidden transition-all duration-500 ${
            theme === "neon" 
              ? "bg-black border-cyan-400 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.25)]" 
              : "bg-neutral-950 border-neutral-800 text-neutral-100 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <FileText className={`w-5 h-5 ${theme === "neon" ? "text-pink-400" : "text-amber-400"}`} />
                <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-white">
                  Native Android App AI Merge Prompt (.md)
                </h3>
              </div>
              <button
                onClick={() => setShowPromptModal(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 font-sans mt-3 mb-4 leading-relaxed">
              Copy and paste this markdown text into a new chat for your native Android App (<span className="font-mono text-amber-400">com.madgambit.app</span>). It contains the complete Compose theme tokens, no-shadow card styling rules, continuous math decay curve (<span className="font-mono text-cyan-400">e^-(&alpha;&bull;t)</span>), and activity routing telemetry.
            </p>

            <div className="relative flex-1 min-h-0 bg-black/90 border border-neutral-800 rounded-xl p-4 overflow-y-auto font-mono text-[11px] leading-relaxed text-neutral-300 select-all scrollbar-thin scrollbar-thumb-neutral-800">
              <pre className="whitespace-pre-wrap break-words">{`# MAD GAMBIT • Native Android UI/UX & Style Merge Prompt

You are an expert Android Jetpack Compose and Kotlin developer. Your task is to merge the polished visual aesthetic, typography, design tokens, and conviction math engine from the **MAD GAMBIT Web Simulator** into this Android application (\`com.madgambit.app\`).

Please implement the following architectural improvements step-by-step:

## 1. Visual Theme & Color Scheme (\`MadGambitTheme.kt\`)
Replace or upgrade our native color theme with this dual-mode palette (Ultra Dark Cosmic Slate & Cyberpunk Neon High Contrast). 

\`\`\`kotlin
package com.madgambit.app.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Color Tokens
val CosmicBlack = Color(0xFF030303)
val SurfaceDark = Color(0xFF0C0C0C)
val BorderNeutral = Color(0xFF262626)
val AmberAccent = Color(0xFFEAB308)
val CyanMetric = Color(0xFF06B6D4)
val CyberPink = Color(0xFFEC4899)
val NeonCyan = Color(0xFF22D3EE)
val TextLight = Color(0xFFF5F5F5)
val TextMuted = Color(0xFF737373)

private val UltraDarkColorScheme = darkColorScheme(
    primary = AmberAccent,
    secondary = CyanMetric,
    background = CosmicBlack,
    surface = SurfaceDark,
    onPrimary = Color.Black,
    onBackground = TextLight,
    onSurface = TextLight,
    outline = BorderNeutral
)

private val NeonHighContrastColorScheme = darkColorScheme(
    primary = CyberPink,
    secondary = NeonCyan,
    background = Color.Black,
    surface = Color(0xFF050508),
    onPrimary = Color.White,
    onBackground = Color.White,
    onSurface = NeonCyan,
    outline = NeonCyan
)

val MadTypography = Typography(
    headlineLarge = TextStyle(
        fontFamily = FontFamily.SansSerif,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        letterSpacing = (-0.5).sp
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Bold,
        fontSize = 12.sp,
        letterSpacing = 1.5.sp
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontSize = 11.sp,
        lineHeight = 16.sp,
        color = TextMuted
    )
)

@Composable
fun MadGambitTheme(
    isNeonMode: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = if (isNeonMode) NeonHighContrastColorScheme else UltraDarkColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = MadTypography,
        content = content
    )
}
\`\`\`

## 2. Component Styling Rules (No Shadow Card Discipline)
Update all surface containers, dialogs, and navigation drawers to adhere to the MAD GAMBIT structural layout:
- **Zero Drop Shadows**: Do not use elevation or drop shadows on cards.
- **Surgical Borders**: Apply \`Modifier.border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))\`.
- **Monospace Badges**: All telemetry labels, section headers, and status badges must use \`FontFamily.Monospace\`, uppercase tracking (\`1.5.sp\`), and crisp high-contrast colors (Cyan or Amber).

## 3. Mathematical Conviction Engine (\`ConvictionMathEngine.kt\`)
Implement the continuous stochastic temporal decay curves (e^(-alpha * t)) used in the web chart visualizer.

## 4. Activity Intent Routing Telemetry
Ensure seamless native transitions between SimulatorActivity, GambitsActivity, IngestActivity, and BlueprintActivity.

Please start by reviewing our project manifest and applying \`MadGambitTheme\` to our primary navigation graph!`}</pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 mt-3 border-t border-neutral-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const promptContent = `# MAD GAMBIT • Native Android UI/UX & Style Merge Prompt\n\nYou are an expert Android Jetpack Compose and Kotlin developer. Your task is to merge the polished visual aesthetic, typography, design tokens, and conviction math engine from the **MAD GAMBIT Web Simulator** into this Android application (\`com.madgambit.app\`).\n\nPlease implement the following architectural improvements step-by-step:\n\n## 1. Visual Theme & Color Scheme (\`MadGambitTheme.kt\`)\nReplace or upgrade our native color theme with this dual-mode palette (Ultra Dark Cosmic Slate & Cyberpunk Neon High Contrast).\n\n\`\`\`kotlin\npackage com.madgambit.app.ui.theme\n\nimport androidx.compose.material3.*\nimport androidx.compose.runtime.Composable\nimport androidx.compose.ui.graphics.Color\nimport androidx.compose.ui.text.TextStyle\nimport androidx.compose.ui.text.font.FontFamily\nimport androidx.compose.ui.text.font.FontWeight\nimport androidx.compose.ui.unit.sp\n\nval CosmicBlack = Color(0xFF030303)\nval SurfaceDark = Color(0xFF0C0C0C)\nval BorderNeutral = Color(0xFF262626)\nval AmberAccent = Color(0xFFEAB308)\nval CyanMetric = Color(0xFF06B6D4)\nval CyberPink = Color(0xFFEC4899)\nval NeonCyan = Color(0xFF22D3EE)\nval TextLight = Color(0xFFF5F5F5)\nval TextMuted = Color(0xFF737373)\n\nprivate val UltraDarkColorScheme = darkColorScheme(\n    primary = AmberAccent,\n    secondary = CyanMetric,\n    background = CosmicBlack,\n    surface = SurfaceDark,\n    onPrimary = Color.Black,\n    onBackground = TextLight,\n    onSurface = TextLight,\n    outline = BorderNeutral\n)\n\nprivate val NeonHighContrastColorScheme = darkColorScheme(\n    primary = CyberPink,\n    secondary = NeonCyan,\n    background = Color.Black,\n    surface = Color(0xFF050508),\n    onPrimary = Color.White,\n    onBackground = Color.White,\n    onSurface = NeonCyan,\n    outline = NeonCyan\n)\n\nval MadTypography = Typography(\n    headlineLarge = TextStyle(\n        fontFamily = FontFamily.SansSerif,\n        fontWeight = FontWeight.Bold,\n        fontSize = 24.sp,\n        letterSpacing = (-0.5).sp\n    ),\n    titleMedium = TextStyle(\n        fontFamily = FontFamily.Monospace,\n        fontWeight = FontWeight.Bold,\n        fontSize = 12.sp,\n        letterSpacing = 1.5.sp\n    ),\n    bodySmall = TextStyle(\n        fontFamily = FontFamily.Monospace,\n        fontSize = 11.sp,\n        lineHeight = 16.sp,\n        color = TextMuted\n    )\n)\n\n@Composable\nfun MadGambitTheme(\n    isNeonMode: Boolean = false,\n    content: @Composable () -> Unit\n) {\n    val colorScheme = if (isNeonMode) NeonHighContrastColorScheme else UltraDarkColorScheme\n    MaterialTheme(\n        colorScheme = colorScheme,\n        typography = MadTypography,\n        content = content\n    )\n}\n\`\`\`\n\n## 2. Component Styling Rules (No Shadow Card Discipline)\nUpdate all surface containers, dialogs, and navigation drawers to adhere to the MAD GAMBIT structural layout:\n- **Zero Drop Shadows**: Do not use elevation or drop shadows on cards.\n- **Surgical Borders**: Apply \`Modifier.border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))\`.\n- **Monospace Badges**: All telemetry labels, section headers, and status badges must use \`FontFamily.Monospace\`, uppercase tracking (\`1.5.sp\`), and crisp high-contrast colors (Cyan or Amber).\n\n## 3. Mathematical Conviction Engine (\`ConvictionMathEngine.kt\`)\nImplement the continuous stochastic temporal decay curves (e^(-alpha * t)) used in the web chart visualizer.\n\n## 4. Activity Intent Routing Telemetry\nEnsure seamless native transitions between SimulatorActivity, GambitsActivity, IngestActivity, and BlueprintActivity.\n\nPlease start by reviewing our project manifest and applying \`MadGambitTheme\` to our primary navigation graph!`;
                  const blob = new Blob([promptContent], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "MAD_GAMBIT_Android_AI_Prompt.md";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  showToast("Downloaded .md file!", "success", "Handoff Portal");
                  logAction("Android Handoff: Downloaded prompt markdown file.", "success");
                }}
                className="flex items-center gap-1.5 font-mono text-xs cursor-pointer border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download .md File</span>
              </Button>

              <Button
                type="button"
                onClick={() => {
                  const promptContent = `# MAD GAMBIT • Native Android UI/UX & Style Merge Prompt\n\nYou are an expert Android Jetpack Compose and Kotlin developer. Your task is to merge the polished visual aesthetic, typography, design tokens, and conviction math engine from the **MAD GAMBIT Web Simulator** into this Android application (\`com.madgambit.app\`).\n\nPlease implement the following architectural improvements step-by-step:\n\n## 1. Visual Theme & Color Scheme (\`MadGambitTheme.kt\`)\nReplace or upgrade our native color theme with this dual-mode palette (Ultra Dark Cosmic Slate & Cyberpunk Neon High Contrast).\n\n\`\`\`kotlin\npackage com.madgambit.app.ui.theme\n\nimport androidx.compose.material3.*\nimport androidx.compose.runtime.Composable\nimport androidx.compose.ui.graphics.Color\nimport androidx.compose.ui.text.TextStyle\nimport androidx.compose.ui.text.font.FontFamily\nimport androidx.compose.ui.text.font.FontWeight\nimport androidx.compose.ui.unit.sp\n\nval CosmicBlack = Color(0xFF030303)\nval SurfaceDark = Color(0xFF0C0C0C)\nval BorderNeutral = Color(0xFF262626)\nval AmberAccent = Color(0xFFEAB308)\nval CyanMetric = Color(0xFF06B6D4)\nval CyberPink = Color(0xFFEC4899)\nval NeonCyan = Color(0xFF22D3EE)\nval TextLight = Color(0xFFF5F5F5)\nval TextMuted = Color(0xFF737373)\n\nprivate val UltraDarkColorScheme = darkColorScheme(\n    primary = AmberAccent,\n    secondary = CyanMetric,\n    background = CosmicBlack,\n    surface = SurfaceDark,\n    onPrimary = Color.Black,\n    onBackground = TextLight,\n    onSurface = TextLight,\n    outline = BorderNeutral\n)\n\nprivate val NeonHighContrastColorScheme = darkColorScheme(\n    primary = CyberPink,\n    secondary = NeonCyan,\n    background = Color.Black,\n    surface = Color(0xFF050508),\n    onPrimary = Color.White,\n    onBackground = Color.White,\n    onSurface = NeonCyan,\n    outline = NeonCyan\n)\n\nval MadTypography = Typography(\n    headlineLarge = TextStyle(\n        fontFamily = FontFamily.SansSerif,\n        fontWeight = FontWeight.Bold,\n        fontSize = 24.sp,\n        letterSpacing = (-0.5).sp\n    ),\n    titleMedium = TextStyle(\n        fontFamily = FontFamily.Monospace,\n        fontWeight = FontWeight.Bold,\n        fontSize = 12.sp,\n        letterSpacing = 1.5.sp\n    ),\n    bodySmall = TextStyle(\n        fontFamily = FontFamily.Monospace,\n        fontSize = 11.sp,\n        lineHeight = 16.sp,\n        color = TextMuted\n    )\n)\n\n@Composable\nfun MadGambitTheme(\n    isNeonMode: Boolean = false,\n    content: @Composable () -> Unit\n) {\n    val colorScheme = if (isNeonMode) NeonHighContrastColorScheme else UltraDarkColorScheme\n    MaterialTheme(\n        colorScheme = colorScheme,\n        typography = MadTypography,\n        content = content\n    )\n}\n\`\`\`\n\n## 2. Component Styling Rules (No Shadow Card Discipline)\nUpdate all surface containers, dialogs, and navigation drawers to adhere to the MAD GAMBIT structural layout:\n- **Zero Drop Shadows**: Do not use elevation or drop shadows on cards.\n- **Surgical Borders**: Apply \`Modifier.border(1.dp, MaterialTheme.colorScheme.outline, RoundedCornerShape(16.dp))\`.\n- **Monospace Badges**: All telemetry labels, section headers, and status badges must use \`FontFamily.Monospace\`, uppercase tracking (\`1.5.sp\`), and crisp high-contrast colors (Cyan or Amber).\n\n## 3. Mathematical Conviction Engine (\`ConvictionMathEngine.kt\`)\nImplement the continuous stochastic temporal decay curves (e^(-alpha * t)) used in the web chart visualizer.\n\n## 4. Activity Intent Routing Telemetry\nEnsure seamless native transitions between SimulatorActivity, GambitsActivity, IngestActivity, and BlueprintActivity.\n\nPlease start by reviewing our project manifest and applying \`MadGambitTheme\` to our primary navigation graph!`;
                  navigator.clipboard.writeText(promptContent);
                  setPromptCopied(true);
                  showToast("Copied prompt to clipboard!", "success", "Handoff Portal");
                  logAction("Android Handoff: Copied prompt text to system clipboard.", "success");
                  setTimeout(() => setPromptCopied(false), 2500);
                }}
                className={`flex items-center gap-1.5 font-mono text-xs cursor-pointer transition-all ${
                  promptCopied
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                    : theme === "neon"
                    ? "bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                    : "bg-amber-500 hover:bg-amber-400 text-black font-bold"
                }`}
              >
                {promptCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{promptCopied ? "Prompt Copied!" : "📋 Copy Prompt Text"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Custom simple book icon for app bottom bar since Lucide can sometimes conflict on some bundle shapes
function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
