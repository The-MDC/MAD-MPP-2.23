"use client";

/**
 * MΛĐ Gambit — Contribution Connectors
 * ------------------------------------------------------------------
 * Links social accounts (X/Twitter, TikTok, Discord) to boost the
 * Cobb-Douglas `d_i` term via EigenTrust weighting. Verified accounts
 * get trustScore = 0.8; bots get R_j = 0 (mathematically weightless).
 *
 * PLACEHOLDER: real OAuth in prod. Deep-link URLs from Gen 2:
 *   meta: madgambit://auth/callback?platform=meta
 *   discord: madgambit://auth/callback?platform=discord
 *   twitter: madgambit://auth/callback?platform=twitter
 * Source: Gen 1 ConvictionDashboard "CONTRIBUTION CONNECTORS"
 *         Gen 2 SocialPlatform enum + OAuth deep-links
 */

import React, { useState } from "react";
import { useGame } from "@/context/game-context";
import { calculateEigenTrustScore } from "@/lib/gambit-game-math";
import { Link2, CheckCircle, Loader, TrendingUp } from "lucide-react";

const PLATFORMS = [
  { id: "twitter" as const, label: "X / Twitter", icon: "𝕏", color: "#e7e9ea", hint: "Verified influencer accounts get 0.8 trust weight" },
  { id: "tiktok"  as const, label: "TikTok",       icon: "♪", color: "#ff0050", hint: "Creator accounts amplify conviction via virality score" },
  { id: "discord" as const, label: "Discord",       icon: "◈", color: "#5865f2", hint: "Community governance weight in Triple-Threat Oracle" },
];

// Simulate OAuth — replace with real OAuth redirect in prod
const SIMULATED_HANDLES: Record<string, string> = {
  twitter: "@mad_conviction",
  tiktok: "@madgambit_degen",
  discord: "mad_gambit#8888",
};

export default function ContributionConnectors() {
  const { socialAccounts, linkSocialAccount, socialAmplification } = useGame();
  const [linking, setLinking] = useState<string | null>(null);
  const [justLinked, setJustLinked] = useState<string | null>(null);

  function handleLink(platform: typeof PLATFORMS[0]["id"]) {
    if (linking) return;
    setLinking(platform);
    // Simulate OAuth round-trip (1.2s)
    setTimeout(() => {
      linkSocialAccount(platform, SIMULATED_HANDLES[platform]);
      setLinking(null);
      setJustLinked(platform);
      setTimeout(() => setJustLinked(null), 3000);
    }, 1200);
  }

  // Show EigenTrust score from linked accounts
  const engagements = socialAccounts.map(a => ({ impact: 40, trustScore: a.trustScore }));
  const eigenScore = calculateEigenTrustScore(engagements);

  return (
    <div className="rounded-2xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-5 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link2 className="w-4 h-4 text-cyan-400" />
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-bold">Contribution Connectors</p>
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-700">Social Amplification Oracle · EigenTrust</p>
          </div>
        </div>
        {socialAccounts.length > 0 && (
          <div className="text-right">
            <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-600">Trust Score</p>
            <p className="font-mono text-sm font-black text-cyan-400">{eigenScore.toFixed(1)}/100</p>
          </div>
        )}
      </header>

      {/* Platform buttons */}
      <div className="space-y-2">
        {PLATFORMS.map(p => {
          const linked = socialAccounts.find(a => a.platform === p.id);
          const isLinking = linking === p.id;
          const wasJust = justLinked === p.id;

          return (
            <div key={p.id} className="rounded-xl border border-neutral-850 bg-[#030508] overflow-hidden">
              <div className="flex items-center gap-3 px-3.5 py-2.5">
                <span className="text-xl w-6 text-center" style={{ color: p.color }}>{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] font-bold text-neutral-300">{p.label}</p>
                  {linked
                    ? <p className="font-mono text-[9px] text-neutral-500">{linked.handle} · trust {linked.trustScore}</p>
                    : <p className="font-mono text-[9px] text-neutral-700">{p.hint}</p>
                  }
                </div>
                <button
                  onClick={() => !linked && handleLink(p.id)}
                  disabled={!!linked || isLinking}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider transition-all ${
                    linked
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                      : isLinking
                      ? "bg-neutral-900 border border-neutral-800 text-neutral-500"
                      : "bg-[#05070c] border border-neutral-800 text-neutral-300 hover:border-cyan-500/40 hover:text-cyan-300"
                  }`}
                  style={linked ? {} : { borderColor: isLinking ? undefined : p.color + "44" }}
                >
                  {linked ? <><CheckCircle className="w-2.5 h-2.5" /> LINKED</>
                    : isLinking ? <><Loader className="w-2.5 h-2.5 animate-spin" /> LINKING…</>
                    : "LINK"}
                </button>
              </div>

              {/* Conviction delta toast */}
              {wasJust && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/8 border-t border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <p className="font-mono text-[9px] text-emerald-400 font-bold animate-conviction">
                    Your conviction score increased. Social amplification: {(socialAmplification * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* EigenTrust explanation */}
      <div className="rounded-lg border border-neutral-900 bg-[#030508] px-3 py-2.5">
        <p className="font-mono text-[8px] uppercase tracking-widest text-neutral-600 mb-1">Why this matters</p>
        <p className="font-mono text-[9px] text-neutral-500 leading-relaxed">
          Your contribution score <span className="text-cyan-400">d_i = Σ Impact · log(1 + R_j)</span>.
          Bots have <span className="text-rose-400">R_j = 0</span> — their engagement is mathematically weightless.
          Your verified accounts get <span className="text-emerald-400">R_j = 0.8</span>. Link your audience. Your reach is your edge.
        </p>
      </div>
    </div>
  );
}
