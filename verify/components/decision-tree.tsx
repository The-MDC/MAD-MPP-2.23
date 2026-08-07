"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DecisionNode {
  evidence: string;
  oldPrior: number;
  newPosterior: number;
  shift: number;
  action: "STRONG_BUY" | "WEAK_BUY" | "HOLD" | "WEAK_SELL" | "STRONG_SELL";
}

interface BayesianDecisionTreeProps {
  nodes: DecisionNode[];
}

export default function BayesianDecisionTree({ nodes }: BayesianDecisionTreeProps) {
  if (!nodes || nodes.length === 0) return null;

  return (
    <div className="w-full bg-[#030508]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden relative">
      {/* Background visual accents */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px]" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-[80px]" />

      <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        Bayesian Probability Chain
      </h3>

      <div className="relative border-l-2 border-white/10 ml-4 space-y-6">
        {nodes.map((node, i) => {
          const isPositive = node.shift > 0;
          const isNeutral = node.shift === 0;

          return (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}
              key={i} 
              className="relative pl-8"
            >
              {/* Node Connector */}
              <div className="absolute -left-[5px] top-4 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />

              <div className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-crosshair">
                <p className="text-xs font-mono text-neutral-400 mb-2 uppercase tracking-wide">
                  Evidence Injected: <span className="text-white">{node.evidence}</span>
                </p>
                
                <div className="flex items-center gap-4 text-sm font-bold">
                  <span className="text-neutral-500">{(node.oldPrior * 100).toFixed(1)}%</span>
                  <ArrowRight className="w-4 h-4 text-neutral-600" />
                  
                  <motion.span 
                    key={node.newPosterior}
                    initial={{ scale: 1.5, color: "#fff" }}
                    animate={{ scale: 1, color: isPositive ? "#34d399" : isNeutral ? "#9ca3af" : "#f87171" }}
                    transition={{ duration: 0.5 }}
                    className="text-lg drop-shadow-md"
                  >
                    {(node.newPosterior * 100).toFixed(1)}%
                  </motion.span>
                </div>

                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/40 border border-white/5 text-[10px] font-mono uppercase tracking-widest">
                  {isPositive ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : isNeutral ? <Minus className="w-3 h-3 text-neutral-400" /> : <TrendingDown className="w-3 h-3 text-pink-400" />}
                  <span className={isPositive ? "text-emerald-400" : isNeutral ? "text-neutral-400" : "text-pink-400"}>
                    {node.action.replace('_', ' ')} ({(node.shift > 0 ? "+" : "")}{(node.shift * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
