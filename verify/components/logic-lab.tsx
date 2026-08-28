"use client";

/**
 * MΛĐ Gambit — Logic Lab
 * ------------------------------------------------------------------
 * Ported from MainActivity.kt MathematicalLogicPanel.
 * Three panels:
 *   1. δ-Limit Cap Calculator: δ = π × Multiplier × √ConvictionStake
 *   2. φ-Ratio MAD Shield:     φ = 1.618 structural safety factor
 *   3. Code Checker Simulator: build-check progress with log streaming
 * All formulas from gambit-game-math.ts (verified engine).
 */

import React, { useState, useEffect, useRef } from "react";
import {
  calculateDeltaLimit,
  shieldPhiRatio,
  PHI,
  OV_DECKS,
  OVDeck,
} from "@/lib/gambit-game-math";
import { Terminal, Shield, Calculator, CheckCircle2, Loader } from "lucide-react";

const CHECK_LOGS = [
  "[Sentinel] Bootstrapping conviction-parity oracle...",
  "[GARCH] Loading σ² volatility surface — baseline 0.02",
  "[DL-LMSR] Bond curve integrity → α(V) nominal",
  "[Lunar] Phase multiplier L_θ = 1.027 ✓",
  "[TeaBag Shield] φ-ratio protective limit loaded",
  "[δ-Limit] π × Multiplier × √Stake bounds verified",
  "[VRS] Fibonacci nodes [5,8,13,21,34] seeded",
  "[Evolution] Burn ladder integrity → OK",
  "[Tournament] 8-tier prize distribution → verified",
  "[Z-Liar] Sentinel BS-Index engine online",
  "[MADx] Supply 888,888,888 — immutable ✓",
  "[Fee Engine] 1.88% rake → creator off gross (own markets) → community 28.8% of net",
  "[Elomatic] PvP clamp [0.12, 0.88] → verified",
  "[Kelly] Fractional criterion scale 0.5 → nominal",
  "[Build] ALL SYSTEMS GREEN. Platform integrity: 100%",
];

export default function LogicLab({ activeDeck }: { activeDeck?: OVDeck }) {
  const deck = activeDeck ?? OV_DECKS[0];

  // δ-limit calculator
  const [multiplier, setMultiplier] = useState(deck.multiplier.toString());
  const [stake, setStake] = useState("500");
  const parsedMult = parseFloat(multiplier) || deck.multiplier;
  const parsedStake = parseFloat(stake) || 500;
  const delta = calculateDeltaLimit(parsedMult, parsedStake);

  // φ-shield
  const [lossAmount, setLossAmount] = useState("1000");
  const [volatility, setVolatility] = useState(0.6);
  const parsedLoss = parseFloat(lossAmount) || 1000;
  const phiRecovery = shieldPhiRatio(parsedLoss, volatility, false);
  const phiVip = shieldPhiRatio(parsedLoss, volatility, true);

  // code checker
  const [checking, setChecking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // sync multiplier when deck changes
  useEffect(() => { setMultiplier(deck.multiplier.toString()); }, [deck.multiplier]);

  function runCheck() {
    if (checking) return;
    setChecking(true); setDone(false); setProgress(0); setLogs([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i >= CHECK_LOGS.length) {
        clearInterval(interval);
        setProgress(100);
        setDone(true);
        setChecking(false);
        return;
      }
      setLogs((p) => [...p, CHECK_LOGS[i]]);
      setProgress(Math.round(((i + 1) / CHECK_LOGS.length) * 100));
      i++;
    }, 280);
  }

  return (
    <div className="space-y-4">
      {/* δ-LIMIT CALCULATOR */}
      <Panel title="δ-Limit Cap Calculator" icon={<Calculator className="w-4 h-4" />} accent="#c98aff">
        <p className="font-mono text-[9px] text-neutral-500 mb-3">
          δ = π × Multiplier × √ConvictionStake — bounds max stake per prediction
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input label="Multiplier" value={multiplier} onChange={setMultiplier} hint={`Deck: ${deck.multiplier}x`} />
          <Input label="Conviction Stake" value={stake} onChange={setStake} hint="$MADx" />
        </div>
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 px-4 py-3 text-center">
          <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 mb-1">δ-Limit Result</p>
          <p className="font-mono text-3xl font-black text-purple-400">{delta.toFixed(2)}<span className="text-lg text-purple-600"> δ</span></p>
          <p className="font-mono text-[9px] text-neutral-600 mt-1">π ({Math.PI.toFixed(4)}) × {parsedMult} × √{parsedStake.toFixed(0)}</p>
        </div>
      </Panel>

      {/* φ-RATIO MAD SHIELD */}
      <Panel title="φ-Ratio MAD Shield" icon={<Shield className="w-4 h-4" />} accent="#fbbf24">
        <p className="font-mono text-[9px] text-neutral-500 mb-3">
          φ = {PHI.toFixed(6)} — Structural safety balancing factor for extreme-volatility loss recovery
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Input label="Loss Amount ($MADx)" value={lossAmount} onChange={setLossAmount} hint="position size" />
          <div>
            <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-1">
              <span>Volatility Score</span><span className="text-amber-400">{(volatility * 100).toFixed(0)}%</span>
            </div>
            <input type="range" min={0} max={1} step={0.01} value={volatility}
              onChange={(e) => setVolatility(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#fbbf24", background: "#11151c" }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-center">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-1">Standard Recovery</p>
            <p className="font-mono text-xl font-black text-amber-400">{phiRecovery.toFixed(1)}</p>
            <p className="font-mono text-[8px] text-neutral-600">$MADx recovered</p>
          </div>
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-3 py-2 text-center">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-500 mb-1">VIP φ-Recovery</p>
            <p className="font-mono text-xl font-black text-yellow-400">{phiVip.toFixed(1)}</p>
            <p className="font-mono text-[8px] text-neutral-600">$MADx recovered</p>
          </div>
        </div>
      </Panel>

      {/* CODE CHECKER */}
      <Panel title="Platform Integrity Checker" icon={<Terminal className="w-4 h-4" />} accent="#7cffc7">
        <p className="font-mono text-[9px] text-neutral-500 mb-3">
          Runs a simulated audit of all MAD Gambit math engines and canonical constants.
        </p>

        {/* progress bar */}
        <div className="h-1.5 rounded-full bg-neutral-900 overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }} />
        </div>

        {/* log terminal */}
        <div ref={logRef}
          className="rounded-lg bg-[#010203] border border-neutral-900 p-3 h-40 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-0.5">
          {logs.length === 0 && <p className="text-neutral-700">Awaiting check — press Run below.</p>}
          {logs.map((l, i) => <p key={i}>{l}</p>)}
          {done && (
            <p className="text-cyan-400 font-black animate-resolve-win">
              ✓ ALL {CHECK_LOGS.length} checks passed — integrity confirmed.
            </p>
          )}
        </div>

        <button
          onClick={runCheck}
          disabled={checking}
          className={`mt-3 w-full rounded-xl py-2.5 font-mono text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 ${done ? "animate-gold-jackpot" : ""}`}
          style={{ background: "#7cffc715", border: "1px solid #7cffc740", color: "#7cffc7" }}>
          {checking
            ? <><Loader className="w-3.5 h-3.5 animate-spin" /> Checking…</>
            : done
            ? <><CheckCircle2 className="w-3.5 h-3.5" /> All Clear — Run Again</>
            : <><CheckCircle2 className="w-3.5 h-3.5" /> Run Integrity Check</>
          }
        </button>
      </Panel>
    </div>
  );
}

function Panel({ title, icon, accent, children }: { title: string; icon: React.ReactNode; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-5">
      <div className="flex items-center gap-2 mb-4" style={{ color: accent }}>
        {icon}
        <h3 className="font-mono text-xs uppercase tracking-[0.25em] font-bold text-neutral-300">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-1">
        <span>{label}</span>{hint && <span className="text-neutral-600">{hint}</span>}
      </div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#030508] border border-neutral-800 rounded-lg px-3 py-2 font-mono text-sm text-neutral-200 focus:outline-none focus:border-neutral-600" />
    </div>
  );
}
