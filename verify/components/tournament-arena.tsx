"use client";

/**
 * MAD Gambit — TOURNAMENT ARENA + CULL PvP
 * ------------------------------------------------------------------
 * 8-tier prize distribution (PRIZE_BANDS) and the Cull Arena PvP using
 * the Elomatic engine (calculateVictoryProbability + mmrDelta). Live
 * ladder re-sorts on every match. Opponent pairing is simulated
 * (PLACEHOLDER → matchmaking service, docs/BACKEND_PLACEHOLDERS.md).
 */

import React, { useState } from "react";
import { useGame } from "@/context/game-context";
import { PRIZE_BANDS, prizeForRank, RARITY_TABLE } from "@/lib/gambit-game-math";
import { Trophy, Swords, Crown, ChevronUp, ChevronDown, Clock, Star } from "lucide-react";
import { useState as useStateTimer, useEffect } from "react";

// Named active tournaments from Gen 2 GambitViewModel.activeTournaments (exact copy)
const ACTIVE_TOURNAMENTS = [
  { id:"t1", name:"The Consensus Coliseum",  prizePool:5000,  status:"upcoming", startsInMs:2*3600000+15*60000 },
  { id:"t2", name:"MADHAT Genesis Cup",       prizePool:2000,  status:"completed", winner:"YOU", wonAmount:2000 },
  { id:"t3", name:"Scandal Velocity Stakes",  prizePool:12000, status:"live",      endsInMs:4*3600000 },
];

function useCountdown(ms: number): string {
  const [remaining, setRemaining] = useStateTimer(ms);
  useEffect(() => {
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  return `${h}h ${m}m ${s}s`;
}


export default function TournamentArena() {
  const { ladder, tournamentPool, userMmr, cards, runPvpMatch } = useGame();
  const [selectedCard, setSelectedCard] = useState<string>(cards[0]?.id ?? "");
  const [log, setLog] = useState<{ id: string; won: boolean; pWin: number; delta: number; opponent: string }[]>([]);

  function fight() {
    if (!selectedCard) return;
    const res = runPvpMatch(selectedCard);
    if (res) setLog((p) => [{ id: "m_" + Date.now(), ...res }, ...p].slice(0, 6));
  }

  const userRank = ladder.find((e) => e.isUser)?.rank ?? 0;
  const userPrize = prizeForRank(userRank, tournamentPool);

  return (
    <div className="space-y-4">
      {/* Named Tournaments */}
      <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Star className="w-4 h-4 text-yellow-400" />
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-neutral-400">Live Tournaments</h2>
        </div>
        <div className="space-y-2.5">
          {ACTIVE_TOURNAMENTS.map(t => <TournamentCard key={t.id} tournament={t} />)}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
      {/* PRIZE LADDER */}
      <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-6">
        <header className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <div>
              <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 font-bold">Tournament</h2>
              <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">8-Tier Prize Ecosystem</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Prize Pool</p>
            <p className="font-mono text-lg font-black text-yellow-400">{tournamentPool.toLocaleString()} MΛĐ</p>
          </div>
        </header>

        {/* prize bands */}
        <div className="grid grid-cols-5 gap-1.5 mb-5">
          {PRIZE_BANDS.map((b) => (
            <div key={b.placeLabel} className="rounded-lg border border-neutral-850 bg-[#030508] px-2 py-2 text-center">
              <p className="font-mono text-[8px] uppercase tracking-wider text-neutral-500">{b.placeLabel}</p>
              <p className="font-mono text-xs font-black text-yellow-400 mt-0.5">{(b.bpsEach / 100).toFixed(0)}%</p>
              <p className="font-mono text-[8px] text-neutral-600 mt-0.5">{(tournamentPool * b.bpsEach / 10000).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* ladder */}
        <div className="space-y-1.5">
          {ladder.map((e) => {
            const prize = prizeForRank(e.rank, tournamentPool);
            return (
              <div key={e.handle} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${e.isUser ? "border border-cyan-500/40 bg-cyan-500/5" : "bg-[#030508]"}`}>
                <span className={`font-mono text-xs font-black w-6 ${e.rank === 1 ? "text-yellow-400" : e.isUser ? "text-cyan-400" : "text-neutral-500"}`}>
                  {e.rank === 1 ? <Crown className="w-4 h-4" /> : e.rank}
                </span>
                <span className={`font-mono text-xs flex-1 ${e.isUser ? "text-cyan-300 font-bold" : "text-neutral-300"}`}>{e.handle}</span>
                <span className="font-mono text-[11px] text-neutral-400">{e.mmr} MMR</span>
                {prize > 0 && <span className="font-mono text-[10px] text-yellow-500 w-20 text-right">{prize.toLocaleString()}</span>}
              </div>
            );
          })}
        </div>

        {userRank > 0 && (
          <div className="mt-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-3 py-2 text-center">
            <p className="font-mono text-[10px] text-cyan-400">You're rank #{userRank} · projected prize {userPrize > 0 ? `${userPrize.toLocaleString()} MΛĐ` : "outside payout band"}</p>
          </div>
        )}
      </div>

      {/* CULL ARENA PvP */}
      <div className="rounded-3xl border border-neutral-850 bg-[#05070c]/80 backdrop-blur-md p-6">
        <header className="flex items-center gap-2.5 mb-5">
          <Swords className="w-5 h-5 text-rose-400" />
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400 font-bold">Cull Arena</h2>
            <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600">Elomatic PvP · Your MMR {userMmr}</p>
          </div>
        </header>

        {/* card select */}
        <p className="font-mono text-[9px] uppercase tracking-widest text-neutral-600 mb-2">Choose your fighter</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {cards.slice(0, 4).map((c) => {
            const t = RARITY_TABLE[c.rarity];
            const sel = c.id === selectedCard;
            return (
              <button key={c.id} onClick={() => setSelectedCard(c.id)}
                className={`rounded-lg px-3 py-2 text-left transition-all ${sel ? "border" : "border border-neutral-850"}`}
                style={sel ? { borderColor: t.accent + "88", background: t.accent + "12" } : {}}>
                <p className="font-mono text-[10px] font-bold truncate" style={{ color: t.accent }}>{c.name}</p>
                <p className="font-mono text-[9px] text-neutral-500">{t.powerScore.toLocaleString()} PWR · stage {c.stage} · {(c.durability * 100).toFixed(0)}% dura</p>
              </button>
            );
          })}
        </div>

        <button onClick={fight} className="w-full rounded-xl py-3 font-mono text-sm font-black uppercase tracking-widest bg-rose-500/10 border border-rose-500/40 text-rose-400 hover:bg-rose-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 mb-4">
          <Swords className="w-4 h-4" /> Enter the Cull
        </button>

        {/* match log */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {log.length === 0 && <p className="font-mono text-[10px] text-neutral-700 text-center py-4">No matches yet — enter the Cull to climb the ladder.</p>}
          {log.map((m) => (
            <div key={m.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${m.won ? "bg-emerald-500/5 border border-emerald-500/30" : "bg-rose-500/5 border border-rose-500/30"}`}>
              {m.won ? <ChevronUp className="w-3.5 h-3.5 text-emerald-400" /> : <ChevronDown className="w-3.5 h-3.5 text-rose-400" />}
              <span className={`font-mono text-[11px] font-bold ${m.won ? "text-emerald-400" : "text-rose-400"}`}>{m.won ? "VICTORY" : "DEFEAT"}</span>
              <span className="font-mono text-[10px] text-neutral-500 flex-1">vs {m.opponent} · P(win) {(m.pWin * 100).toFixed(0)}%</span>
              <span className={`font-mono text-[11px] font-bold ${m.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{m.delta >= 0 ? "+" : ""}{m.delta} MMR</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

function TournamentCard({ tournament }: { tournament: typeof ACTIVE_TOURNAMENTS[0] }) {
  const [remaining, setRemaining] = React.useState(
    tournament.status === "upcoming" ? (tournament.startsInMs ?? 0) : (tournament.endsInMs ?? 0)
  );
  useEffect(() => {
    if (tournament.status === "completed") return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, [tournament.status]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const countdown = `${h}h ${m}m ${s}s`;
  const statusColor = tournament.status === "live" ? "#ec4899" : tournament.status === "upcoming" ? "#58a6ff" : "#475569";
  return (
    <div className="rounded-xl border px-4 py-3" style={{ borderColor: statusColor + "33", background: statusColor + "05" }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            <span className="font-mono text-[8px] uppercase tracking-widest font-bold" style={{ color: statusColor }}>
              {tournament.status.toUpperCase()}
            </span>
          </div>
          <p className="font-mono text-xs font-bold text-neutral-200 truncate">{tournament.name}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-[8px] text-neutral-600">Prize Pool</p>
          <p className="font-mono text-sm font-black text-yellow-400">{tournament.prizePool.toLocaleString()} $MADx</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        {tournament.status !== "completed" && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" style={{ color: statusColor }} />
            <span className="font-mono text-[9px] font-bold" style={{ color: statusColor }}>
              {tournament.status === "upcoming" ? "Starts in" : "Ends in"} {countdown}
            </span>
          </div>
        )}
        {tournament.status === "completed" && tournament.winner && (
          <div className="flex items-center gap-1.5">
            <Crown className="w-3 h-3 text-yellow-400" />
            <span className="font-mono text-[9px] font-bold text-yellow-400">
              {tournament.winner === "YOU" ? `You won ${tournament.wonAmount?.toLocaleString()} $MADx!` : `Winner: ${tournament.winner}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
