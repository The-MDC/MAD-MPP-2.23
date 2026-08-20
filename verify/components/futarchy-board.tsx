"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Scale, Users, TrendingUp, CheckCircle2 } from "lucide-react";

interface Proposal {
  id: string;
  title: string;
  description: string;
  passProbability: number;
  passPrice: number;
  failPrice: number;
}

// NOTE: Governance may only tune soft parameters (e.g. the MAD-Shield opt-in fee
// band). The platform fee (1.88%), creator share (40%), and community share
// (28.8%) are canonical constants — never expose them as governable proposals.
const MOCK_PROPOSALS: Proposal[] = [
  { id: "P-42", title: "Widen MAD-Shield Opt-In Fee Band", description: "Adjust the optional MAD-Shield opt-in fee range from 2–4% to 2–5% to deepen the loss-mitigation pool during high-volatility sagas.", passProbability: 0.68, passPrice: 0.72, failPrice: 0.28 },
  { id: "P-43", title: "Implement Lunar Volatility", description: "Peg the LMSR alpha to the real-time lunar cycle, increasing liquidity requirements during Full Moons.", passProbability: 0.35, passPrice: 0.38, failPrice: 0.62 },
];

export default function FutarchyBoard() {
  const [activeId, setActiveId] = useState<string>(MOCK_PROPOSALS[0].id);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-mono uppercase tracking-widest text-white flex items-center gap-3">
          <Scale className="text-cyan-400" /> Meta-Governance Board
        </h2>
        <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20">
          Futarchy Active
        </span>
      </div>

      <p className="text-sm text-neutral-400">
        Vote on protocol values, let the DL-LMSR liquidity pools decide the execution. The market resolves proposals automatically when probability sustains &gt; 80% for 24 hours.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_PROPOSALS.map((prop) => (
          <motion.div 
            key={prop.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveId(prop.id)}
            className={`p-5 rounded-2xl cursor-pointer transition-all border ${activeId === prop.id ? 'bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded uppercase">{prop.id}</span>
              {activeId === prop.id && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
            </div>
            <h3 className="font-bold text-white text-lg mb-2 leading-tight">{prop.title}</h3>
            <p className="text-xs text-neutral-400 mb-6 line-clamp-2">{prop.description}</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-500 mb-1 uppercase tracking-wider">
                  <span>Market Consensus (Pass)</span>
                  <span className="text-white">{(prop.passProbability * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${prop.passProbability * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold font-mono uppercase hover:bg-emerald-500/20 transition-colors">
                  <TrendingUp size={14} /> Buy YES (${prop.passPrice.toFixed(2)})
                </button>
                <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-pink-500/10 text-pink-400 text-xs font-bold font-mono uppercase hover:bg-pink-500/20 transition-colors">
                  <TrendingUp size={14} /> Buy NO (${prop.failPrice.toFixed(2)})
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
