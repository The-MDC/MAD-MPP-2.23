"use client";

import React, { useState, useEffect } from "react";
import ConvictionCharts from "@/components/conviction-charts";
import { Sparkles, HelpCircle, Shield, Globe, Compass, ExternalLink, RotateCcw } from "lucide-react";
import { useMpp } from "@/context/mpp-context";

export default function Home() {
  const [showHelper, setShowHelper] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const { theme, setTheme, resetSimulation } = useMpp();
  const [resetTimestamps, setResetTimestamps] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load initial timestamps on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("mad_simulation_resets");
      if (stored) {
        try {
          setResetTimestamps(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Listen for reset events to append timestamps
  useEffect(() => {
    const handleResetEvent = () => {
      const now = new Date();
      const pad = (num: number) => String(num).padStart(2, "0");
      const timestamp = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      setResetTimestamps((prev) => {
        const next = [timestamp, ...prev].slice(0, 5);
        if (typeof window !== "undefined") {
          localStorage.setItem("mad_simulation_resets", JSON.stringify(next));
        }
        return next;
      });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("mad-simulation-reset", handleResetEvent);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("mad-simulation-reset", handleResetEvent);
      }
    };
  }, []);

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#030303] text-neutral-150 flex flex-col justify-center items-center relative overflow-hidden">
        {/* Simple static backdrop to match server-side render */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(0,163,255,0.08),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60_50_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="text-center font-mono text-xs text-neutral-500 animate-pulse uppercase tracking-widest">
          Mounting secure sandbox workspace...
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen flex flex-col justify-between pt-0 pb-10 relative overflow-hidden transition-all duration-500 selection:bg-yellow-400 selection:text-black ${
      theme === "neon" 
        ? "bg-[#01010a] text-cyan-300" 
        : "bg-[#030303] text-neutral-100"
    }`}>
      
      {/* Dynamic Cosmic Backdrops */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
        theme === "neon"
          ? "bg-[radial-gradient(circle_800px_at_100%_200px,rgba(236,72,153,0.12),transparent)]"
          : "bg-[radial-gradient(circle_800px_at_100%_200px,rgba(0,163,255,0.08),transparent)]"
      }`} />
      <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${
        theme === "neon"
          ? "bg-[radial-gradient(circle_800px_at_0%_800px,rgba(0,242,254,0.12),transparent)]"
          : "bg-[radial-gradient(circle_800px_at_0%_800px,rgba(236,72,153,0.06),transparent)]"
      }`} />
      <div className={`absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none animate-pulse transition-all duration-700 ${
        theme === "neon" ? "bg-cyan-500/10" : "bg-yellow-400/5"
      }`} />
      
      {/* Space grid lattice */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60_50_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none transition-all duration-500 ${
        theme === "neon" ? "opacity-60" : "opacity-100"
      }`} />

      {/* Main Container Workspace */}
      <div className="w-full flex-1 flex flex-col justify-center items-center">
        <ConvictionCharts />
      </div>

      {/* Secondary micro features and help modal (fully offline/client-side) */}
      <footer className="mt-12 text-center text-xs text-neutral-600 relative z-30 flex flex-col items-center justify-center gap-2">
        <div className="flex flex-wrap items-center justify-center gap-4 px-4">
          <button 
            onClick={() => setShowHelper(!showHelper)}
            className={`flex items-center gap-1 transition-colors cursor-pointer font-mono text-[10px] uppercase font-bold tracking-widest ${
              theme === "neon" ? "text-pink-400 hover:text-pink-300" : "text-neutral-500 hover:text-neutral-400"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Sandbox Documentation
          </button>

          <span className="text-neutral-800">•</span>

          <button 
            onClick={() => {
              resetSimulation();
              if (typeof window !== "undefined") {
                const event = new CustomEvent("mad-simulation-reset");
                window.dispatchEvent(event);
              }
            }}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer font-mono text-[10px] uppercase font-bold tracking-widest ${
              theme === "neon" ? "text-cyan-400 hover:text-cyan-300" : "text-neutral-500 hover:text-yellow-400"
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            Reset Sim
          </button>

          <span className="text-neutral-800">•</span>

          {/* Persistent Theme Toggle in Footer */}
          <button 
            onClick={() => {
              const nextTheme = theme === "dark" ? "neon" : "dark";
              setTheme(nextTheme);
            }}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer font-mono text-[10px] uppercase font-bold tracking-widest ${
              theme === "neon" ? "text-pink-400 hover:text-pink-300" : "text-neutral-500 hover:text-cyan-400"
            }`}
          >
            <Sparkles className="w-3 h-3 animate-pulse" />
            Theme: {theme === "neon" ? "NEON HIGH CONTRAST" : "ULTRA DARK"}
          </button>

          <span className="text-neutral-800">•</span>

          <span className={`flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-widest bg-neutral-950/40 px-3 py-1 rounded-full border shadow-sm transition-all duration-300 ${
            theme === "neon" ? "border-pink-500/35 text-pink-400 bg-black/60 shadow-[0_0_8px_rgba(236,72,153,0.15)]" : "border-neutral-900/60 text-neutral-500"
          }`}>
            <Shield className={`w-3.5 h-3.5 ${theme === "neon" ? "text-pink-400" : "text-yellow-500/80"}`} />
            <span>Secure Client Workspace</span>
            <span className="flex items-center gap-1.5 pl-2 border-l border-neutral-800/80">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  theme === "neon" ? "bg-cyan-400" : "bg-green-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  theme === "neon" ? "bg-cyan-500" : "bg-green-500"
                }`}></span>
              </span>
              <span className={`text-[8.5px] uppercase tracking-widest font-extrabold font-mono ${
                theme === "neon" ? "text-cyan-400" : "text-green-400"
              }`}>ONLINE</span>
            </span>
          </span>
        </div>

        {/* Reset history scrollable list */}
        {resetTimestamps.length > 0 && (
          <div className="flex flex-col items-center gap-1.5 mt-3 select-none">
            <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
              Simulation Resets History (Last 5)
            </span>
            <div className={`max-h-[60px] overflow-y-auto w-52 text-left px-3 py-1.5 rounded-lg border text-[9px] font-mono flex flex-col gap-1 shadow-inner scrollbar-thin transition-all duration-300 ${
              theme === "neon"
                ? "bg-black/80 border-pink-500/20 text-cyan-400 scrollbar-thumb-pink-500/40"
                : "bg-neutral-950/80 border-neutral-900/60 text-neutral-400 scrollbar-thumb-neutral-800"
            }`}>
              {resetTimestamps.map((ts, idx) => (
                <div key={idx} className="flex justify-between border-b border-neutral-900/20 last:border-0 pb-0.5 last:pb-0">
                  <span className="text-neutral-500 font-bold">#{resetTimestamps.length - idx}</span>
                  <span className={theme === "neon" ? "text-pink-400" : "text-yellow-400"}>{ts}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dynamic sliding popover helper block */}
        {showHelper && (
          <div className={`mt-4 max-w-xl p-6 rounded-xl text-left space-y-3 shadow-xl border transition-all duration-500 ${
            theme === "neon" 
              ? "bg-black/90 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
              : "bg-neutral-950/90 border-glow-gold text-neutral-400"
          }`}>
            <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
              <span className={`font-bold font-mono uppercase tracking-wider text-xs ${
                theme === "neon" ? "text-cyan-400" : "text-yellow-400"
              }`}>Stochastic Model Guide</span>
              <button 
                onClick={() => setShowHelper(false)}
                className="text-neutral-500 hover:text-neutral-300 text-[10px] font-mono uppercase"
              >
                close
              </button>
            </div>
            <p className="text-[11px] leading-relaxed">
              <strong>Staking conviction half-life voting</strong> relies on decay formulas to represent accrued commitment. Rather than absolute current balance, power accrues over simulated continuous increments (epochs). Raising the multiplier raises the curve capacity, while governance weights govern target triggering heights.
            </p>
            <p className="text-[11px] leading-relaxed">
              Select any of the three active gambits to inject distinct decay constants and base capacities dynamically inside the simulator matrix.
            </p>
          </div>
        )}

        <div className="text-[10px] text-neutral-700 font-mono mt-4">
          © 2026 MΛĐ GAMBIT. All simulations calculated securely locally.
        </div>
      </footer>

    </main>
  );
}
